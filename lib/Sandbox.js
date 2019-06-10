const fs = require("fs");
const util = require("util");
const colors = require("colors/safe");
const exec = util.promisify(require("child_process").exec);
const pty = require("pty.js");
const http = require("http");
const https = require("https");

const {
  PackageBuilder,
  PackageAction,
  PackageRequirement
} = require("./Package");

const PKG_CACERT = require("./packages/ca-cert");
const PKG_LOCALE = require("./packages/locale");
const PKG_BIN_SHELL = require("./packages/bin-shell");
const PKG_BIN_FAKESUDO = require("./packages/bin-fake-sudo");
const PKG_BIN_EDITOR_VIM = require("./packages/bin-editor-vim");
const PKG_BIN_EDITOR_NANO = require("./packages/bin-editor-nano");

const mkdirAsync = util.promisify(fs.mkdir);
const writeFileAsync = util.promisify(fs.writeFile);
const symlinkAsync = util.promisify(fs.symlink);
const chmodAsync = util.promisify(fs.chmod);

/**
 * The sandbox class is responsible for creating a chroot sandbox where
 * the user can request a VTY into
 */
class Sandbox {
  constructor(sboxDir, options = {}) {
    this.sboxDir = sboxDir;
    this.systemDir = "";
    this.uid = options.uid || 2000;
    this.gid = options.gid || this.uid || 2000;
    this.env = options.env || {};
    this.activePtys = [];

    this.packages = [
      PKG_CACERT,
      PKG_LOCALE,
      PKG_BIN_SHELL,
      PKG_BIN_FAKESUDO,
      PKG_BIN_EDITOR_VIM,
      PKG_BIN_EDITOR_NANO
    ].concat(options.packages || []);

    /**
     * Utility shorthand functions
     */
    this.util = {
      // Local-only actions
      mkdir: (path, mode) => {
        this._log("mkdir", path);
        return mkdirAsync(`${sboxDir}${path}`, mode);
      },
      symlink: (path, target) => {
        this._log("symlink", path, ` -> ${target}`);
        return symlinkAsync(target, `${sboxDir}${path}`);
      },
      chown: (path, user, group) => {
        if (group == null) {
          this._log("chown", path, `${user}`);
          return exec(`chown -R ${user} ${sboxDir}${path}`);
        } else {
          this._log("chown", path, `${user}:${group}`);
          return exec(`chown -R ${user}:${group} ${sboxDir}${path}`);
        }
      },
      chmod: (path, mode) => {
        this._log("chmod", path, " 0" + mode.toString(8));
        return chmodAsync(`${sboxDir}${path}`, mode);
      },

      // System actions
      linkFromSystem: (systemPath, path) => {
        if (path == null) path = systemPath;
        this._log("link", path, ` -> ${this.systemDir}${systemPath}`);
        return exec(
          `cp -alr ${this.systemDir}${systemPath} ${sboxDir}${path} `
        );
      },
      copyFromSystem: (systemPath, path, mode) => {
        if (path == null) path = systemPath;
        if (typeof path === "number") {
          path = systemPath;
          mode = path;
        }

        this._log("copy", path, ` <- ${this.systemDir}${systemPath}`);
        return exec(`cp -ar ${this.systemDir}${systemPath} ${sboxDir}${path} `);
      }
    };
  }

  _log(action, sandboxPath, message = "") {
    if (sandboxPath == null) {
      console.log(colors.blue(action) + " " + message);
    } else {
      console.log(
        colors.blue(action) +
          " " +
          this.sboxDir +
          colors.bold(sandboxPath) +
          message
      );
    }
  }

  /**
   * Check and satisfy package requirements
   */
  satisfyPackageRequirements(pkg) {
    return pkg.requirements.reduce((promise, req) => {
      switch (req.type) {
        case PackageRequirement.SYSTEM_PACKAGE:
          return promise.then(() => {
            this._log("apt-get", null, "install " + colors.bold(req.name));
            return exec(`dpkg -s ${req.name}`)
              .then(x => true)
              .catch(e => exec(`apt-get install -y ${req.name}`));
          });

        case PackageRequirement.DOWNLOADED_BINARY:
          return promise.then(
            () =>
              new Promise((resolve, reject) => {
                this._log(
                  "apt-get",
                  null,
                  "download " + colors.bold(req.url) + " -> " + req.path
                );
                fs.access(req.path, fs.constants.F_OK, err => {
                  if (err) {
                    var file = fs.createWriteStream(req.path);
                    var request = (req.url.startsWith("https:")
                      ? https
                      : http
                    ).get(req.url, response => {
                      // Chmod file to executable upon download completion
                      const complete = () => {
                        fs.chmod(req.path, 0o0755, err => {
                          if (err) {
                            reject(err);
                            return;
                          }
                          resolve();
                        });
                      };

                      // Pipe response to the file
                      const fd = response.pipe(file);
                      fd.on("end", complete);
                      fd.on("finish", complete);
                      fd.on("error", reject);
                    });
                  } else {
                    resolve();
                  }
                });
              })
          );

        default:
          return promise;
      }
    }, Promise.resolve());
  }

  /**
   * Install a package in the sandbox
   */
  runPackageActions(phase, pkg) {
    const {
      chown,
      chmod,
      mkdir,
      symlink,
      linkFromSystem,
      copyFromSystem
    } = this.util;
    console.log(colors.green(`${phase}-install `) + colors.bold(pkg.name));

    return pkg.actions.reduce((promise, action) => {
      if (action.phase !== phase) {
        return promise;
      }

      switch (action.action) {
        case PackageAction.LINK:
          return promise.then(() =>
            Promise.all(
              action.paths.map(([sysPath, localPath]) =>
                linkFromSystem(sysPath, localPath)
              )
            )
          );

        case PackageAction.COPY:
          return promise.then(() =>
            Promise.all(
              action.paths.map(([sysPath, localPath]) =>
                copyFromSystem(sysPath, localPath)
              )
            )
          );

        case PackageAction.MKDIR:
          return promise.then(() =>
            Promise.all(action.paths.map(path => mkdir(path)))
          );

        case PackageAction.SYMLINK:
          return promise.then(() => symlink(action.path, action.target));

        case PackageAction.CHOWN:
          return promise.then(() =>
            Promise.all(
              action.paths.map(path => chown(path, action.user, action.group))
            )
          );

        case PackageAction.CHMOD:
          return promise.then(() =>
            Promise.all(action.paths.map(path => chmod(path, action.mode)))
          );

        case PackageAction.CREATE:
          return promise.then(() => {
            this._log("create", action.path);
            return writeFileAsync(this.sboxDir + action.path, action.contents, {
              mode: action.mode
            });
          });

        case PackageAction.ENV:
          this._log("set", null, `${action.name}="${action.value}"`);
          this.env[action.name] = action.value;
          return promise;

        default:
          return promise;
      }
    }, Promise.resolve());
  }

  /**
   * Prepares the sandbox directory
   *
   * 1. Creates the filesystem layout
   * 2. Initializes /etc
   *  2.1. Creates a custom /passwd and /groups file
   *  2.2. Copies /etc/resolv.conf, /etc/hosts, /etc/ssl from host
   * 3. Hard-links /lib files from host
   * 4. Hard-links useful dirs from /usr
   * 5. Creates basic /dev devices
   * 6. Copes the defined list of binary files
   *
   */
  prepare() {
    const { sboxDir, systemDir } = this;
    const { mkdir, symlink, linkFromSystem, copyFromSystem } = this.util;

    /**
     * Package installation phases
     */
    const packageDepsInstall = () =>
      this.packages.reduce(
        (promise, pkg) =>
          promise.then(_ => this.satisfyPackageRequirements(pkg)),
        Promise.resolve()
      );
    const packagePreInstall = () =>
      Promise.all(this.packages.map(this.runPackageActions.bind(this, "pre")));
    const packagePostInstall = () =>
      Promise.all(this.packages.map(this.runPackageActions.bind(this, "post")));

    /**
     * Prepare the base dir
     */
    const makeBaseDir = () => {
      this._log("mkdir", "/");
      return exec(`mkdir -p ${sboxDir}`);
    };

    /**
     * Prepare the filesystem
     */
    const makeFilesystem = () =>
      Promise.all([
        mkdir("/dev"),
        mkdir("/bin"),
        mkdir("/sbin"),
        mkdir("/etc"),
        mkdir("/lib").then(x => symlink("/lib64", "lib")),
        mkdir("/home").then(x => mkdir("/home/user")),
        mkdir("/usr").then(x =>
          Promise.all([
            mkdir("/usr/bin"),
            mkdir("/usr/sbin"),
            mkdir("/usr/lib"),
            mkdir("/usr/share"),
            mkdir("/usr/local")
          ])
        ),
        mkdir("/opt"),
        mkdir("/proc"),
        mkdir("/tmp", 0o1777),
        mkdir("/root", 0o750)
      ]);

    /**
     * Copy the files from the base directory into the filesystem
     */
    const copyFiles = () => {
      const createPasswdContents = () => {
        return [
          "root:x:0:0:root:/root:/bin/bash",
          "nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin",
          `user:x:${this.uid}:${this.gid}:user:/home/user:/bin/bash`,
          ""
        ].join("\n");
      };

      const createGroupContents = () => {
        return [
          "root:x:0:",
          "daemon:x:1:",
          "nogroup:x:65534:",
          `user:x:${this.gid}:`,
          ""
        ].join("\n");
      };

      /**
       * Copy the etc artifacts
       */
      const prepareEtc = Promise.all([
        copyFromSystem("/etc/resolv.conf"),
        copyFromSystem("/etc/hosts"),
        writeFileAsync(sboxDir + "/etc/passwd", createPasswdContents()),
        writeFileAsync(sboxDir + "/etc/group", createGroupContents())
      ]);

      /**
       * Copy the lib files
       */
      const prepareLib = Promise.all([
        linkFromSystem("/lib/x86_64-linux-gnu/*", "/lib"),
        linkFromSystem("/usr/lib/x86_64-linux-gnu/*.so", "/usr/lib"),
        linkFromSystem("/usr/lib/x86_64-linux-gnu/*.so.*", "/usr/lib")
      ]);

      /**
       * Copy the dev files
       */
      const prepareDev = Promise.all([
        copyFromSystem("/dev/urandom"),
        copyFromSystem("/dev/random"),
        copyFromSystem("/dev/console"),
        copyFromSystem("/dev/null"),
        copyFromSystem("/dev/zero"),
        copyFromSystem("/dev/tty")
      ]);

      return Promise.all([prepareEtc, prepareLib, prepareDev]).then(
        packagePreInstall
      );
    };

    /**
     * Fix permissions
     */
    const fixPermissions = () => {
      return Promise.resolve()
        .then(() => exec(`chown -R root:root ${sboxDir}`))
        .then(() => exec(`chmod -R a-w ${sboxDir}`))
        .then(() => exec(`chmod -R a+w ${sboxDir}/usr/local`))
        .then(() => exec(`chmod -R a+w ${sboxDir}/opt`))
        .then(() => exec(`chmod -R a+w ${sboxDir}/dev/*`))
        .then(() =>
          exec(`chown -R ${this.uid}:${this.gid} ${sboxDir}/home/user`)
        )
        .then(() => exec(`chmod 0700 ${sboxDir}/home/user`))
        .then(() => exec(`chmod 1777 ${sboxDir}/tmp`));
    };

    /**
     * Mount filesystems
     */
    const prepareMounts = () =>
      Promise.all([exec(`mount -t proc ${sboxDir}/proc ${sboxDir}/proc`)]);

    //// Execute

    return packageDepsInstall()
      .then(makeBaseDir)
      .then(makeFilesystem)
      .then(copyFiles)
      .then(fixPermissions)
      .then(packagePostInstall)
      .then(prepareMounts);
  }

  /**
   * Launches a command in the chroot environment and returns a pty handle
   */
  exec(command, options = {}) {
    const width = options.width || 80;
    const height = options.height || 30;
    const term = options.term || "xterm-color";
    const cwd = options.cwd || "/home/user";
    const env = Object.assign(
      {
        HOME: "/home/user",
        TERM: term
      },
      this.env,
      options.env
    );

    // Prepare command-line arguments
    const envStr = Object.keys(env)
      .map(name => `export ${name}=${env[name]}`)
      .join("; ");
    const args = [
      `--userspec=${this.uid}:${this.gid}`,
      this.sboxDir,
      "/bin/bash",
      "-c",
      `${envStr}; cd ${cwd}; ${command}`
    ];

    // Create new terminal
    const terminal = pty.spawn("/usr/sbin/chroot", args, {
      name: term,
      cols: width,
      rows: height,
      cwd: this.sboxDir
    });

    // Keep track of the terminal sessions
    this.activePtys.push(terminal);
    terminal.on("exit", () => {
      const idx = this.activePtys.indexOf(terminal);
      if (idx >= 0) this.activePtys.splice(idx, 1);
    });

    return terminal;
  }

  /**
   * Removes the sandbox directory
   */
  destroy() {
    // Make sure there are no active PTYs
    this.activePtys.forEach(term => term.destroy());
    this.activePtys = [];

    // Remove the sandbox
    return exec(`umount ${this.sboxDir}/proc`).then(() =>
      exec(`rm -rf ${this.sboxDir}`)
    );
  }
}

module.exports = Sandbox;
