const { PackageBuilder } = require("../Package");

/**
 * The DC/OS utility CLI
 */
module.exports = PackageBuilder.create("bin-dcos")
  .requireDownloadedBinary(
    "/usr/bin/dcos",
    "https://downloads.dcos.io/binaries/cli/linux/x86-64/latest/dcos"
  )
  .linkFiles("/usr/bin/dcos")
  .get();
