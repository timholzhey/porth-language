# Change Log

## [0.0.1]

- Initial release
- Added simple syntax highlighting
- Added code snippets for language intrinsics and more

## [0.0.2]

- Added macro declaration name highlighting
- fixed small syntax highlighting bugs

## [0.0.3]

- Added compile, run and test command
- Added debug flag, auto-run flag and porth path settings
- Implemented compile and auto-run command
- Added compile and run support and documentation for Windows with WSL

## [0.0.4]

- Implemented run command
- Changed execution from OUTPUT to TERMINAL in order to support user input
- Fixed os specific file paths

## [0.0.5]

- Fixed typos in README

## [0.0.6]

- Fixed intrinsics syntax highlighting
- Added newest instrinsic language features highlighting and snippets
- Updated porth fork

## [0.0.7]

- Added newest language features: memory, proc, orelse to the grammar set, snippets and diagnostics
- Updated porth module
- Added simple semantic type checking rules to show errors as diagnostics
- Improved syntax highlighting regex
- Improved snippet descriptions

## [0.0.8]

- Updated porth module
- Changed elif to orelse snippets

## [0.0.9]

- Changed repo url from GitHub to GitLab in README

## [0.0.10]

- Improved grammar, snippets and type checking error annotations regex queries

## [0.0.11]

- Added a hover provider which displays the location of any definition (proc, macro, const) in the current file as well as in the standard library
- Improved syntax highlighting colors
- Added standard library definitions to the syntax highlighting
- Added newest language features: const, offset, reset
- Added example image to the README

## [0.0.12]

- Added newest language keyword: if* to grammar and snippets
- Updated example image in shown README
- Added definition provider (Right click: Goto definition)
- Added brief comments to every larger function
- Reorganized and split up language server into multiple files
- Removed diagnositcs due to the frequent language changes
- Updated porth module
- Updated README