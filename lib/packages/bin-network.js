const { PackageBuilder } = require("../Package");

/**
 * Additional utilities for network operations
 */
module.exports = PackageBuilder.create("bin-network")
  .linkFiles(["/bin/ping", "/usr/bin/curl"])
  .postInstall()
  .chownFiles("/bin/ping", "root", "root")
  .chmodFiles("/bin/ping", 0o4755)
  .get();
