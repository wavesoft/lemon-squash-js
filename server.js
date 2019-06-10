const express = require("express");
const http = require("http");
const path = require("path");
const ServerSession = require("./lib/ServerSession");
const WebSocket = require("ws");

const PKG_BIN_NETWORK = require("./lib/packages/bin-network");
const PKG_BIN_DCOS = require("./lib/packages/bin-dcos");

// Create a simple express server that just serves a websocket session
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Serve the example directory
// CHANGE ME: Don't do this in production!
app.use(express.static("example"));

// Handle new sessions
const sessions = [];
wss.on("connection", ws => {
  const session = new ServerSession(ws, "/sandbox");
  session.start({
    // CHANGE ME: The session is initialized with the bare minimum packages, so
    // we are installing a few more to make it more usable. You should add here
    // other packages that you might need!
    packages: [PKG_BIN_NETWORK, PKG_BIN_DCOS]
  });
  sessions.push(session);
});

// Handle SIGINT
process.on("SIGINT", function() {
  Promise.all(sessions.map(sess => sess.destroy())).then(() => {
    process.exit();
  });
});

//start our server
server.listen(process.env.PORT || 8080, () => {
  console.log(`lemon-squash server started on port ${server.address().port}`);
});
