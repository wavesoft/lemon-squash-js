const path = require("path");

module.exports = {
  mode: "production",
  entry: "./src/index",
  output: {
    path: path.resolve(__dirname, "dist"),
    library: "InteractiveSession",
    libraryTarget: "umd",
    filename: "lemon-squash.dist.js"
  },
  externals: {
    xterm: "Terminal"
  }
};
