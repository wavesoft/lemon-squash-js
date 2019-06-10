const { PackageBuilder } = require("../Package");

/**
 * Frequently used utilities for shell applications
 */
module.exports = PackageBuilder.create("bin-shell")
  .linkFiles([
    "/bin/bash",
    "/bin/cat",
    "/bin/grep",
    "/bin/ls",
    "/bin/ln",
    "/bin/mv",
    "/bin/cp",
    "/bin/chmod",
    "/bin/mkdir",
    "/usr/bin/env",
    "/usr/bin/clear"
  ])
  .linkFiles(["/lib/terminfo"])
  .symlink("/bin/sh", "/bin/bash")
  .writeFile(
    "/home/user/.bashrc",
    [`alias ls="ls --color=auto"`, ""].join("\n")
  )
  .get();
