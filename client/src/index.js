const LocalEchoController = require('local-echo').default;

/**
 * An interactive session object wraps
 */
class InteractiveSession {
  constructor(term) {
    this.localEmulator = new LocalEchoController(term);
    this.term = term;
    this.ws = null;
    this.mode = "busy";
    this.resizeTimer = 0;

    this.localEmulator.addAutocompleteHandler(() => {
      const args = [];
      for (let i = 0; i < 101; i++) {
        args.push("bash");
      }
      return args;
    });

    this._handleTermData = this._handleTermData.bind(this);
    this._handleSessionData = this._handleSessionData.bind(this);
    this._handleResize = this._handleResize.bind(this);

    term.on("data", this._handleTermData.bind(this));
    window.addEventListener("resize", this._handleResize);
  }

  connect(url) {
    this.ws = new WebSocket(url);

    this._showInfo("starting session...");
    this.ws.addEventListener("message", e => {
      const data = JSON.parse(e.data);
      console.log("incoming: ", data);
      this._handleSessionData(data);
    });
    this.ws.addEventListener("open", e => {
      console.log("connected");
      this._handleResize();
    });
    this.ws.addEventListener("close", e => {
      this._setMode("disabled");
    });
  }

  _setMode(mode) {
    this.mode = mode;
    console.log("mode=", mode);
    switch (mode) {
      case "busy":
        this.localEmulator.abortRead();
        break;

      case "idle":
        this._promptForInput();
        break;

      case "disabled":
        this.localEmulator.abortRead();
        this._showError("session terminated");
        break;

      case "interactive":
        this.localEmulator.abortRead();
        break;
    }
  }

  _showError(message) {
    term.write("\x1B[1;31mERROR:\x1B[0m " + message + "\r\n");
  }

  _showInfo(message) {
    term.write("\x1B[1;34mINFO:\x1B[0m " + message + "\r\n");
  }

  /**
   * Handle user for input and submit it's response to the server
   */
  _promptForInput() {
    this.localEmulator
      .read("~$ ")
      .then(command => this._handleStartCommand(command))
      .catch(e => {});
  }

  /**
   * Start a command
   */
  _handleStartCommand(command) {
    if (!this.ws) {
      this._showError("Connection not established");
      this._promptForInput();
    }

    this.ws.send(
      JSON.stringify({
        type: "run",
        data: {
          command: command,
          env: {}
        }
      })
    );
  }

  /**
   * Handle terminal resize
   */
  _handleResize() {
    const { ws, term } = this;

    // De-bounce resize events
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      var ret = term.fit();
      console.log(ret, term.rows, term.cols);

      if (!ws) return;
      ws.send(
        JSON.stringify({
          type: "tty",
          data: {
            resize: {
              width: term.cols,
              height: term.rows
            }
          }
        })
      );
    }, 250);
  }

  /**
   * Handle session messages
   */
  _handleSessionData(data) {
    switch (data.type) {
      case "session":
        this._setMode(data.data.mode);
        break;

      case "error":
        if (data.data.message != null) {
          this._showError(data.data.message);
        }
        break;

      case "tty":
        if (data.data.output != null) {
          term.write(data.data.output);
        }
        break;
    }
  }

  /**
   * Send terminal input to the server, if we are in interactive mode
   */
  _handleTermData(data) {
    if (this.mode !== "interactive" || this.ws == null) return;
    this.ws.send(
      JSON.stringify({
        type: "tty",
        data: {
          input: data
        }
      })
    );
  }
}

module.exports = InteractiveSession;
