const { PackageBuilder } = require("../Package");

/**
 * CA Certificates (required to enable SSL applications)
 */
module.exports = PackageBuilder.create("ca-cert")
  .linkFiles([
    "/usr/share/ca-certificates",
    "/etc/ssl",
    "/etc/ca-certificates",
    "/etc/ca-certificates.conf"
  ])
  .get();
