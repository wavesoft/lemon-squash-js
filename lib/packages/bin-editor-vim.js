const { PackageBuilder } = require("../Package");

/**
 * VIM Editor
 */
module.exports = PackageBuilder.create("bin-editor-vim")
  .requireSystemPackage("vim")
  .linkFiles("/usr/bin/vim.basic")
  .symlink("/usr/bin/vim", "vim.basic")
  .symlink("/usr/bin/vi", "vim.basic")
  .get();
