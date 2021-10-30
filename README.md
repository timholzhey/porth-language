# Porth language for VSCode

GitHub repository: [Porth language extension for VSCode](https://github.com/timholzhey/porth-language)

## Features

This is a Visual Studio Code extension created by Tim Holzhey to add Porth language support.

[Porth](https://gitlab.com/tsoding/porth) is an imperative, stack-based programming language similar to Forth.
Porth is open-source and is currently being developed by [Alexey Kutepov](https://github.com/rexim) aka [Tsoding](https://www.youtube.com/c/Tsoding).

Features:
- Syntax highlighting (Grammar set)
- Code snippets (Intrinsics and code blocks)
- Simulate, compile and run commands
- Integrated Porth compiler (submodule)
- Jump to definition

![Example](example.png)

## Usage

1. Open a `.porth` file
2. Open the Command Pallet (`CTRL+SHIFT+P` for Windows/Linux or `CMD+SHIFT+P` on Mac) and enter one of the supported commands:
    - Porth: Simulate program
    - Porth: Compile program
    - Porth: Run program

Make sure you have all required commands (python3, nasm, ld) added to `$PATH`.

## Settings

- `porth.path`: Path to the porth compiler (default: builtin)
- `porth.debug`: Compiler debug flag (default: off)
- `porth.auto-run`: Auto run the program after compiling (default: on)

## Work in progress

Future features:

- Test programs
- Syntax error diagnostics
- Context-based autocomplete suggestions
- Parse references from all included files

## Requirements

### Simulation only (all platforms):

- Python 3

### Unix x86 compiling

- Python 3
- Netwide Assembler ([NASM](https://www.nasm.us)) x86
- GNU linker

### Windows 10 x86 compiling

- Python 3
- Install the Windows Subsystem for Linux (WSL) with: `wsl --install` to use the integrated GNU linker
- Download and install the latest version of [NASM](https://www.nasm.us) for `win64`
- Add NASM to `$PATH` (default: `C:\Users\%user%\AppData\Local\bin\NASM`) and restart
