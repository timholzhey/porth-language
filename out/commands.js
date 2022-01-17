"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const extension_config = vscode.workspace.getConfiguration(this.id);
const isWin = process.platform === "win32";
const language = require("./language_defines");
require("./utils");

class CommandsManager {
    constructor() {
        this.open_file_path = null;
        this.open_file_name = null;
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

        let porth_path_conf = extension_config.get('porth.path');
        let porth_path = porth_path_conf != "_builtin_" ? porth_path_conf : path.join(context.extensionPath, "/porth");

        if ((this.open_file_name == null || this.open_file_path == null) && action != language.CMD.BOOTSTRAP) {
            vscode.window.showErrorMessage("[Porth]: Please open a .porth file first");
            console.log("Couldn't select a visible editor containing a .porth file");
            return;
        } else {
            console.log(`Selected .porth file path: ${this.open_file_path} with file name: ${this.open_file_name}`);
        }

        let flag_autorun = extension_config.get('porth.auto-run');
        let flag_debug = extension_config.get('porth.debug');
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

        this.buildCommand(action, porth_path, flag_autorun, flag_debug);
    }

    /**
     *  @brief  Assembles the command to be executed based on the action and os
     *  @param  String action
     *  @param  String porth_path
     *  @param  Boolean flag_autorun
     *  @param  Boolean flag_debug
     */
    buildCommand = (action, porth_path, flag_autorun, flag_debug) => {
        console.log("Building command...");
        let cmd = "";
        let args = [];
        switch (action) {
            case language.CMD.COMPILE:
                if (isWin) {
                    cmd = `cd ${porth_path} && wsl`;
                    args = [`${path.posix.join(porth_path.winToWslPath(), "/porth")}`];
                    // if (flag_debug) args.push("-debug");
                    args.push(`${action}`);
                    if (flag_autorun) args.push("-r");
                    args.push(`${this.open_file_path.winToWslPath()}`);
                    this.executeCommand(cmd, args);
                } else {
                    cmd = `cd ${porth_path} && ${path.posix.join(porth_path, "/porth")}`;
                    args = [];
                    // if (flag_debug) args.push("-debug");
                    args.push(`${action}`);
                    if (flag_autorun) args.push("-r");
                    args.push(`${this.open_file_path}`);
                    this.executeCommand(cmd, args);
                }
                break;
            case language.CMD.BOOTSTRAP:
                cmd = "nasm";
                args = [`-felf64`, `${path.posix.join(porth_path, "/bootstrap/porth-linux-x86_64.nasm")}`, `-o`, `${path.posix.join(porth_path, "/porth.o")}`];
                this.executeCommand(cmd, args);
                if (isWin) {
                    setTimeout(() => {
                        cmd = "wsl";
                        args = [`ld`, `-o`, `${path.posix.join(porth_path.winToWslPath(), "/porth")}`, `${path.posix.join(porth_path.winToWslPath(), "/porth.o")}`];
                        args.push(...[`&&`, `cd`, `${porth_path}`, `&&`, `wsl`, `${path.posix.join(porth_path.winToWslPath(), "/porth")}`, `com`, `${path.posix.join(porth_path.winToWslPath(), "/porth.porth")}`]);
                        this.executeCommand(cmd, args);
                    }, 1000);
                } else {
                    setTimeout(() => {
                        cmd = "ld";
                        args = [`-o`, `${path.posix.join(porth_path, "/porth")}`, `${path.posix.join(porth_path, "/porth.o")}`];
                        args.push(...[`${path.posix.join(porth_path, "/porth")}`, `com`, `${path.posix.join(porth_path, "/porth.porth")}`]);
                        this.executeCommand(cmd, args);
                    }, 1000);
                }
                break;
            case language.CMD.RUN:
                let basepath = this.open_file_path.split(".porth")[0];
                fs.stat(basepath, (err, stats) => {
                    if (err && err.code === 'ENOENT') {
                        console.log(`${basepath} does not exist.`);
                        vscode.window.showErrorMessage("[Porth]: Executable not found. Compile before running.");
                        return;
                    }
                    else if (err) {
                        vscode.window.showErrorMessage('[Porth]: Error while checking if output file exists: ' + err);
                        return;
                    } else {
                        if (isWin) {
                            cmd = `wsl`;
                            args = [`${basepath.winToWslPath()}`];
                        } else {
                            cmd = `${basepath}`;
                            args = [];
                        }
                        console.log(`Running execuable: ${basepath}`);
                        return this.executeCommand(cmd, args);
                    }
                });
        }
    }

    /**
     *  @brief  Executes the command in the Terminal
     *  @param  String cmd
     *  @param  Array args
     */
    executeCommand = (cmd, args) => {
        console.log(`Executing command [${cmd}] with args [${args}]...`);
        if (cmd == "") return;
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