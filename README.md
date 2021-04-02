# Shoebot Atom extension

This Atom package works with [Shoebot](https://github.com/shoebot/shoebot),
which needs to be installed in your system.

Along with syntax highlighting and Shoebot file type, this package provides two
commands:

- Run (`Ctrl-Alt-R`): Run the open sketch on a window
- Export (`Ctrl-Alt-E`): Run and save the output to a file (SVG, PNG or PDF)

These commands are also available in the Packages menu or (better) on the
right-click context menu.

## Install and setup

Be sure to set the `sbot` executable location in the package settings. The
default is `~/virtualenvs/shoebot/bin/sbot`, which should be correct if you
installed Shoebot using the recommended [Virtualenvwrapper
method](https://docs.shoebot.net/install.html#local-install-using-virtualenvwrapper).
