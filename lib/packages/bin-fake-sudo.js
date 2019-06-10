const { PackageBuilder } = require("../Package");

/**
 * Fake sudo
 */
module.exports = PackageBuilder.create("bin-fake-sudo")
  .writeFile("/bin/sudo", ["#!/bin/bash", "eval $*", ""].join("\n"))
  .postInstall()
  .chmodFiles("/bin/sudo", 0o777)
  .get();
