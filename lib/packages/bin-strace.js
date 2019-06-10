const { PackageBuilder } = require("../Package");

/**
 * Strace
 */
module.exports = PackageBuilder.create("bin-strace")
  .requireSystemPackage("strace")
  .linkFiles("/usr/bin/strace")
  .postInstall()
  .chownFiles("/usr/bin/strace", "root", "root")
  .chmodFiles("/usr/bin/strace", 0o4755)
  .get();
