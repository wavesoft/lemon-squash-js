/**
 * An enum of possible actions
 */
const PackageAction = {
  LINK: "LINK",
  MKDIR: "MKDIR",
  COPY: "COPY",
  SYMLINK: "SYMLINK",
  CHOWN: "CHOWN",
  CHMOD: "CHMOD",
  CREATE: "CREATE",
  ENV: "ENV"
};

/**
 * An enum of possible package requirements
 */
const PackageRequirement = {
  SYSTEM_PACKAGE: "SYSTEM_PACKAGE",
  DOWNLOADED_BINARY: "DOWNLOADED_BINARY"
};

/**
 * A Package is a set of actions that form a re-usable component
 */
class Package {
  constructor(name) {
    this.name = name;
    this.requirements = [];
    this.actions = [];
  }

  toJSON() {
    return {
      name: this.name,
      requirements: this.requirements,
      actions: this.actions
    };
  }

  static fromJSON(data) {
    return new Package(data.name, data.actions);
  }
}

/**
 * Helper class to programmatically create packages
 */
class PackageBuilderClass {
  constructor(pkg, phase = "pre") {
    this.pkg = pkg;
    this.phase = phase;
  }

  get() {
    return this.pkg;
  }

  postInstall() {
    return new PackageBuilderClass(this.pkg || new Package(), "post");
  }

  requireSystemPackage(name) {
    const pkg = this.pkg || new Package();
    pkg.requirements.push({
      type: PackageRequirement.SYSTEM_PACKAGE,
      name
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  requireDownloadedBinary(path, url) {
    const pkg = this.pkg || new Package();
    pkg.requirements.push({
      type: PackageRequirement.DOWNLOADED_BINARY,
      path,
      url
    });
    return new PackageBuilderClass(pkg, this.phase);
  }


  mkdir(paths, mode = 0o0755) {
    const pkg = this.pkg || new Package();
    const pathsArray = Array.isArray(paths) ? paths : [paths];

    pkg.actions.push({
      action: PackageAction.MKDIR,
      phase: this.phase,
      paths: pathsArray,
      mode
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  linkFiles(paths) {
    const pkg = this.pkg || new Package();
    const pathsArray = Array.isArray(paths) ? paths : [paths];

    pkg.actions.push({
      action: PackageAction.LINK,
      phase: this.phase,
      paths: pathsArray.map(f => (Array.isArray(f) ? f : [f, f]))
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  linkFileAs(systemPath, localPath) {
    const pkg = this.pkg || new Package();

    pkg.actions.push({
      action: PackageAction.LINK,
      phase: this.phase,
      paths: [[systemPath, localPath]]
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  copyFiles(paths) {
    const pkg = this.pkg || new Package();
    const pathsArray = Array.isArray(paths) ? paths : [paths];

    pkg.actions.push({
      action: PackageAction.COPY,
      phase: this.phase,
      paths: pathsArray.map(f => (Array.isArray(f) ? f : [f, f]))
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  copyFileAs(systemPath, localPath) {
    const pkg = this.pkg || new Package();

    pkg.actions.push({
      action: PackageAction.COPY,
      phase: this.phase,
      paths: [[systemPath, localPath]]
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  symlink(path, target) {
    const pkg = this.pkg || new Package();

    pkg.actions.push({
      action: PackageAction.SYMLINK,
      phase: this.phase,
      path,
      target
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  chmodFiles(paths, mode = 0o0644) {
    const pkg = this.pkg || new Package();
    const pathsArray = Array.isArray(paths) ? paths : [paths];

    pkg.actions.push({
      action: PackageAction.CHMOD,
      phase: this.phase,
      paths: pathsArray,
      mode
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  chownFiles(paths, user, group = user) {
    const pkg = this.pkg || new Package();
    const pathsArray = Array.isArray(paths) ? paths : [paths];

    pkg.actions.push({
      action: PackageAction.CHOWN,
      phase: this.phase,
      paths: pathsArray,
      user,
      group
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  writeFile(path, contents, mode = 0o0644) {
    const pkg = this.pkg || new Package();

    pkg.actions.push({
      action: PackageAction.CREATE,
      phase: this.phase,
      path,
      contents,
      mode
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  setEnv(name, value) {
    const pkg = this.pkg || new Package();

    pkg.actions.push({
      action: PackageAction.ENV,
      phase: this.phase,
      name,
      value
    });
    return new PackageBuilderClass(pkg, this.phase);
  }

  combineWith(withPkg) {
    const pkg = this.pkg || new Package();

    pkg.actions = pkg.action.concat(withPkg.actions);
    pkg.requirements = pkg.action.concat(withPkg.requirements);

    return new PackageBuilderClass(pkg, this.phase);
  }
}

const PackageBuilder = {
  create(name) {
    return new PackageBuilderClass(new Package(name));
  }
};

module.exports = {
  PackageAction,
  PackageRequirement,
  PackageBuilder,
  Package
};
