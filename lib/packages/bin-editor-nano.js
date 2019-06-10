const { PackageBuilder } = require("../Package");

/**
 * Nano Editor
 */
module.exports = PackageBuilder.create("bin-editor-nano")
  .requireSystemPackage("nano")
  .linkFiles("/bin/nano")
  .get();
