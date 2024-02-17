"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const extension_config = vscode.workspace.getConfiguration(this.id);
const isWin = process.platform === "win32";
const isDarwin = process.platform === "darwin";
const language = require("./language_defines");
require("./utils");

class CommandsManager {
    constructor() {
        this.open_file_path = null;
        this.open_file_name = null;
        this.chmod_compiler = true;
    }

    /**
     *  @brief  Loads the extension configuration and gets the current porth file
     *  @param  String action
     *  @param  vscode.ExtensionContext context
     */
    prepareCommand = (action, context) => {
        console.log(`Preparing command with action [${action}]...`);
        if (action == language.CMD.TEST) {
            vscode.window.showErrorMessage("[Porth]: Not implemented yet :(");
            return;
        }

        const porth_path_conf = extension_config.get('porth.path');
        const porth_path = porth_path_conf != "_builtin_" ? porth_path_conf : path.join(context.extensionPath, "/porth");

        const fasm_path_conf = extension_config.get('fasm.path');
        const fasm_path = fasm_path_conf != "_builtin_" ? fasm_path_conf : path.join(context.extensionPath, "/fasm");

        if (action == language.CMD.OPEN_EXAMPLES) {
            let examples_folder = path.join(porth_path, "/examples");
            console.log(`Opening examples folder ${examples_folder}...`);
            vscode.commands.executeCommand("vscode.openFolder", vscode.Uri.file(examples_folder), true);
            return;
        }

        if ((this.open_file_name == null || this.open_file_path == null) && action != language.CMD.BOOTSTRAP) {
            vscode.window.showErrorMessage("[Porth]: Please open a .porth file first");
            console.log("Couldn't select a visible editor containing a .porth file");
            return;
        } else {
            console.log(`Selected .porth file path: ${this.open_file_path} with file name: ${this.open_file_name}`);
        }

        const flag_autorun = extension_config.get('porth.auto-run');
        const flag_debug = extension_config.get('porth.debug');
        console.log(`Using global extension settings: [Autorun: ${flag_autorun}, Debug: ${flag_debug}]`);

        fs.stat(path.join(porth_path, "/porth"), (err, stats) => {
            if (err && err.code === 'ENOENT') {
                console.log(`Couldn't find porth compiler in ${porth_path}.`);
                vscode.window.showErrorMessage("[Porth]: Compiler not found. Bootstrap before compiling.");
                return;
            }
            else if (err) {
                vscode.window.showErrorMessage('[Porth]: Error while checking if compiler exists: ' + err);
                return;
            }
        });

        fs.stat(path.join(fasm_path, "/fasm"), (err, stats) => {
            if (err && err.code === 'ENOENT') {
                console.log(`Couldn't find fasm assembler in ${fasm_path}.`);
                vscode.window.showErrorMessage("[Porth]: Assembler not found. Bootstrap before compiling.");
                return;
            }
            else if (err) {
                vscode.window.showErrorMessage('[Porth]: Error while checking if assembler exists: ' + err);
                return;
            }
        });

        this.buildCommand(action, porth_path, fasm_path, flag_autorun, flag_debug);
    }

    /**
     *  @brief  Assembles the command to be executed based on the action and os
     *  @param  String action
     *  @param  String porth_path
     *  @param  Boolean flag_autorun
     *  @param  Boolean flag_debug
     */
    buildCommand = (action, porth_path, fasm_path, flag_autorun, flag_debug) => {
        console.log("Building command...");
        let cmd = "";
        let args = [];
        const exec_path = this.open_file_path.substring(0, this.open_file_path.lastIndexOf(".porth"));
        const basepath = path.dirname(this.open_file_path);

        switch (action) {
            case language.CMD.COMPILE:
                if (isWin) {
                    cmd = `cd ${porth_path} && wsl`;
                    args = [`${path.posix.join(porth_path.winToWslPath(), "/porth")}`];
                    args.push(`${action}`);
                    if (flag_autorun) args.push("-r");
                    args.push(`${this.open_file_path.winToWslPath()}`);
                    this.executeCommand(cmd, args);
                } else if (isDarwin) {
                    cmd = `docker run --rm -v ${porth_path}:/usr/src/porth -w /usr/src/porth/ -v ${fasm_path}:/usr/src/fasm -v ${porth_path}:/usr/src/porth -v ${basepath}:/usr/src/porth/${basepath} ubuntu:latest`;
                    args = [`bash`, `-c`, `"export PATH=\\$PATH:/usr/src/fasm && /usr/src/porth/porth`];
                    args.push(`${action}`);
                    if (flag_autorun) args.push("-r");
                    args.push(`/usr/src/porth/${this.open_file_path}"`);
                    this.executeCommand(cmd, args);
                } else {
                    cmd = "";
                    if (this.chmod_compiler) {
                        this.chmod_compiler = false;
                        cmd = `chmod +x ${path.join(porth_path, "/porth")} &&`;
                    }
                    args = [`cd`, `${porth_path}`, `&&`, `${path.posix.join(porth_path, "/porth")}`];
                    args.push(`${action}`);
                    if (flag_autorun) args.push("-r");
                    args.push(`${this.open_file_path}`);
                    this.executeCommand(cmd, args);
                }
                break;

            case language.CMD.BOOTSTRAP:
                if (isWin) {
                    cmd = "wsl";
                    args = [`fasm`, `-m`, `524288`, `${path.posix.join(porth_path.winToWslPath(), "/bootstrap/porth-linux-x86_64.fasm")}`];
                    this.executeCommand(cmd, args);
                    setTimeout(() => {
                        cmd = "wsl";
                        args = [`mv`, `${path.posix.join(porth_path.winToWslPath(), "/bootstrap/porth-linux-x86_64")}`, `${path.posix.join(porth_path.winToWslPath(), "/porth")}`];
                        args.push(...[`&&`, `cd`, `${porth_path}`, `&&`, `wsl`, `chmod`, `+x`, `${path.posix.join(porth_path.winToWslPath(), "/porth")}`, `&&`, `wsl`, `${path.posix.join(porth_path.winToWslPath(), "/porth")}`, `com`, `${path.posix.join(porth_path.winToWslPath(), "/porth.porth")}`]);
                        this.executeCommand(cmd, args);
                    }, 1000);
                } else if (isDarwin) {
                    cmd = "docker";
                    args = ["run", "--rm", "-v", `${porth_path}:/usr/src/porth`, "-w", "/usr/src/porth", "-v", `${fasm_path}:/usr/src/fasm`, "-v", `${porth_path}:/usr/src/porth`, "ubuntu:latest", "/usr/src/fasm/fasm", "-m", "524288", "/usr/src/porth/bootstrap/porth-linux-x86_64.fasm"];
                    this.executeCommand(cmd, args);
                    setTimeout(() => {
                        cmd = "mv";
                        args = [`${path.posix.join(porth_path, "/bootstrap/porth-linux-x86_64")}`, `${path.posix.join(porth_path, "/porth")}`];
                        args.push(...[`&&`, `cd`, `${porth_path}`, `&&`, `chmod`, `+x`, `${path.posix.join(porth_path, "/porth")}`, `&&`, `docker`, `run`, `--rm`, `-v`, `${porth_path}:/usr/src/porth`, `-w`, `/usr/src/porth`, `ubuntu:latest`, `/usr/src/porth/porth`, `com`, `/usr/src/porth/porth.porth`]);
                        this.executeCommand(cmd, args);
                    }, 1000);
                } else {
                    cmd = "fasm";
                    args = [`-m`, `524288`, `${path.posix.join(porth_path, "/bootstrap/porth-linux-x86_64.fasm")}`];
                    this.executeCommand(cmd, args);
                    setTimeout(() => {
                        cmd = "mv";
                        args = [`${path.posix.join(porth_path, "/bootstrap/porth-linux-x86_64")}`, `${path.posix.join(porth_path, "/porth")}`];
                        args.push(...[`&&`, `cd`, `${porth_path}`, `&&`, `chmod`, `+x`, `${path.posix.join(porth_path, "/porth")}`, `&&`, `${path.posix.join(porth_path, "/porth")}`, `com`, `${path.posix.join(porth_path, "/porth.porth")}`]);
                        this.executeCommand(cmd, args);
                    }, 1000);
                }
                break;

            case language.CMD.RUN:
                fs.stat(exec_path, (err, stats) => {
                    if (err && err.code === 'ENOENT') {
                        console.log(`${exec_path} does not exist.`);
                        vscode.window.showErrorMessage("[Porth]: Executable not found. Compile before running.");
                        return;
                    }
                    else if (err) {
                        vscode.window.showErrorMessage('[Porth]: Error while checking if executable exists: ' + err);
                        return;
                    } else {
                        if (isWin) {
                            cmd = `wsl`;
                            args = [`${exec_path.winToWslPath()}`];
                        } else if (isDarwin) {
                            cmd = `docker`;
                            args = ["run", "--rm", "-v", `${porth_path}:/usr/src/porth`, "-v", `${basepath}:/usr/src/porth/${basepath}`, "ubuntu:latest", `/usr/src/porth/${exec_path}`];
                        } else {
                            cmd = `${exec_path}`;
                            args = [];
                        }
                        console.log(`Running execuable: ${exec_path}`);
                        return this.executeCommand(cmd, args);
                    }
                });
            break;

            default:
                // Unreachable
                break;
        }
    }

    /**
     *  @brief  Executes the command in the Terminal
     *  @param  String cmd
     *  @param  Array args
     */
    executeCommand = (cmd, args) => {
        console.log(`Executing command [${cmd}] with args [${args}]...`);
        let terminal;
        if (vscode.window.activeTerminal != undefined && vscode.window.activeTerminal.name == "Porth") {
            terminal = vscode.window.activeTerminal;
        } else {
            terminal = vscode.window.createTerminal("Porth");
        }

        terminal.show();

        console.log(`[Running]: ${cmd} ${args.join(" ")}`);

        terminal.sendText(cmd + " " + args.join(" "));
    }

    /**
     *  @brief  Sets the file path and name of the currently opened file
     *  @param  String file_path
     *  @param  String file_name
     */
    setFile = (file_path, file_name) => {
        this.open_file_path = file_path;
        this.open_file_name = file_name;
    }
}

exports.CommandsManager = CommandsManager;