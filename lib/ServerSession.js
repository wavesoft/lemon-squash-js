const Sandbox = require("./Sandbox");

const MODE_BUSY = "busy";
const MODE_IDLE = "idle";
const MODE_DISABLED = "disabled";
const MODE_INTERACTIVE = "interactive";

/**
 * The server session class represents an interactive user session
 */
class ServerSession {
  /**
   * Initialize an interactive session
   *
   * @param {WebSocket} ws - A WebSocket object over which to communicate with the client
   * @param {string} baseDir - The server directory where to create user sessions within
   */
  constructor(ws, baseDir) {
    this.ws = ws;
    this.baseDir = baseDir;
    this.sandbox = null;
    this.tty = null;
    this.mode = "";
    this.size = {
      width: 80,
      height: 30
    };
    this.validateFn = command => null;

    // Handle incoming messages
    ws.on("message", message => {
      const data = JSON.parse(message);
      if (!data.type) {
        this._sendError("missing `type` field");
        return;
      }

      this._handleFrame(data.type, data.data || {});
    });
    ws.on("close", () => {
      this.destroy();
    });

    // Start in IDLE mode
    this._setMode(MODE_BUSY);
  }

  /**
   * Start the session
   *
   * This function should be called after the construction of the server object.
   * It prepares the sandbox for further command execution.
   *
   * The `config` object contains various configuration options for the sandbox.
   * Refer to the `Sandbox.constructor` reference for more details.
   *
   * @param {Object} config - The configuration parameters for the session
   */
  start(config = {}) {
    const { baseDir } = this;

    // Create new sandbox
    const id = ServerSession.LastID++;
    this.sandbox = new Sandbox(
      `${baseDir}/user-${id}`,
      Object.assign({}, config, { uid: id, gid: id })
    );

    // Prepare sandbox
    console.log("Preparing sandbox: " + this.sandbox.sboxDir);
    return this.sandbox
      .prepare()
      .then(() => {
        // Enter echo mode
        this._setMode(MODE_IDLE);
      })
      .catch(error => {
        console.error(error);
        this._criticalError(`unable to create sandbox: ${error}`);
      });
  }

  /**
   * Define the validation function to use when handling user requests
   *
   * @param {(string) => null|string} fn - The validation function
   */
  setValidationFn(fn) {
    this.validateFn = fn;
  }

  /**
   * Launch the given command and start an interactive session
   *
   * This function will execute the given command on the sandbox and
   * bind the input/output of the command with the remote terminal session.
   *
   * @param {string} command - The command-line to execute
   * @param {object} env - The environment variables to set on the session
   */
  startCommand(command, env = {}) {
    if (this.sandbox == null) return;
    if (this.tty != null) this.stopCommand();

    // Start a tty session
    this.tty = this.sandbox.exec(
      command,
      Object.assign({}, this.size, {
        env
      })
    );
    this._setMode(MODE_INTERACTIVE);

    // Listen for events
    this.tty.on("data", data => {
      this._sendFrame("tty", { output: data });
    });
    this.tty.on("exit", (exit, signal) => {
      this._sendFrame("tty", { exit });
      this._setMode(MODE_IDLE);
      this.tty = null;
    });
  }

  /**
   * Forcefully stop the currently running command
   */
  stopCommand() {
    if (this.sandbox == null) return;
    if (this.tty == null) return;

    this.tty.destroy();
    this.tty = null;
  }

  /**
   * Stop any currently running command and destroy the sandbox
   */
  destroy() {
    return Promise.resolve()
      .then(() => {
        if (this.tty) {
          this.tty.destroy();
          this.tty = null;
        }
      })
      .then(() => {
        const { sandbox } = this;
        if (sandbox) {
          console.log("Tearing down sandbox: " + this.sandbox.sboxDir);
          this.sandbox = null;
          return sandbox.destroy();
        }
      });
  }

  _setMode(mode) {
    this.mode = mode;
    this._sendFrame("session", { mode });
  }

  _criticalError(error) {
    this._sendError(error);
    this._setMode(MODE_DISABLED);
  }

  _sendError(message) {
    this._sendFrame("error", { message });
  }

  _sendFrame(type, data = {}) {
    if (this.ws.readyState !== 1) {
      return;
    }

    this.ws.send(
      JSON.stringify({
        type,
        data
      })
    );
  }

  _handleFrame(type, data) {
    switch (type) {
      case "run":
        if (this.tty != null) {
          this._sendError("an other session is already active");
          return;
        }
        if (data.command == null) {
          this._sendError("missing `command` field");
          return;
        }

        const validationError = this.validateFn(data.command);
        if (validationError != null) {
          console.error(`Command rejected: ${data.command}`);
          this._sendError(validationError);
          return;
        }

        this.startCommand(data.command, data.env || {});
        break;

      case "stop":
        if (this.tty != null) {
          this.stopCommand();
          this._setMode(MODE_IDLE);
        }
        break;

      case "tty":
        if (data.input != null) {
          if (this.tty == null || this.mode != MODE_INTERACTIVE) {
            this._sendError("there is no active session");
            return;
          }

          this.tty.write(data.input);
        }
        if (data.resize != null) {
          this.size.width = data.resize.width || 80;
          this.size.height = data.resize.height || 30;
          console.log("resize=", JSON.stringify(this.size));

          if (this.tty != null) {
            this.tty.resize(this.size.width, this.size.height);
          }
        }
        break;
    }
  }
}

ServerSession.LastID = 2000;

module.exports = ServerSession;
