const { PackageBuilder } = require("../Package");

/**
 * Locale configuration
 */
module.exports = PackageBuilder.create("locale")
  .linkFiles(["/usr/bin/locale", "/usr/lib/locale"])
  .setEnv("LC_ALL", "C.UTF-8")
  .setEnv("LANG", "C.UTF-8")
  .get();
