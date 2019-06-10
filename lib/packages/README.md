# Sandbox Packages

This directory contains a list of "packages" that are installed in the sandbox directory when the user session is created.

Each package is described as a set of actions, provided by the `PackageBuilder` constructor.

For example:

```js
const PACKAGE = PackageBuilder.create("package-name")
    // Require a package from the system (eg. using `apt-get`)
    .requireSystemPackage("package")
    // Download a package from the network and place it on the given directory
    .requireDownloadedBinary(
        "/path/in/sandbox",
        "http://path/to/binary"
    )
    // Create a directory in the samdbox
    .mkdir("path/in/the/sandbox")
    // Link files from the host filesystem, into the sandbox
    // (This will use the same name in the sandbox as with the system)
    .linkFiles([
        "/bin/shell"
    ])
    // The same as `linkFiles`, but allows to specify a different target path
    .linkFileAs(
        "/system/file",
        "/sandbox/file"
    )
    // Copy files from the host filesystem into the sandbox
    // (This will use the same name in the sandbox as with the system)
    .copyFiles([
        "/bin/shell"
    ])
    // The same as `copyFiles`, but allows to specify a different target path
    .copyFileAs(
        "/system/file",
        "/sandbox/file"
    )
    // Change the attributes of the given file
    .chmodFiles(
        "/path/to/file",
        0o777
    )
    // Change the owner of the given file
    .chownFiles(
        "/path/to/file",
        "root"
    )
    // Create a file with the given contents
    .writeFile(
        "/path/to/file",
        "file contents here",
        0o777 // Permissions
    )
    // Set an environment variable
    .setEnv(
        "VARIABLE", "VALUE"
    )
```

