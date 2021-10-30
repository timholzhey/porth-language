"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const extension_config = vscode.workspace.getConfiguration(this.id);
const isWin = process.platform === "win32";
const language = require("./language_defines");

class CommandsManager {
    constructor() {
        this.open_file_path = null;
        this.open_file_name = null;
    }

    /**
     *  @brief  Loads the extension configuration and gets the current porth file
     *  @param  String: action, vscode.ExtensionContext: context
     *  @return -
     */
    prepareCommand = (action, context) => {
        console.log(`Preparing command with action [${action}]...`);
        if (action == language.CMD.TEST) {
            vscode.window.showErrorMessage("[Porth]: Not implemented yet :(");
            return;
        }

        let porth_path_conf = extension_config.get('porth.path');
        let porth_path = porth_path_conf != "_builtin_" ? porth_path_conf : path.join(context.extensionPath, "/porth");

        if (this.open_file_name == null || this.open_file_path == null) {
            vscode.window.showErrorMessage("[Porth]: Please open a .porth file");
            console.log("Couldn't select a visible editor containing a .porth file");
            return;
        } else {
            console.log(`Selected .porth file path: ${this.open_file_path} with file name: ${this.open_file_name}`);
        }

        let flag_autorun = extension_config.get('porth.auto-run');
        let flag_debug = extension_config.get('porth.debug');
        console.log(`Using global extension settings: [Autorun: ${flag_autorun}, Debug: ${flag_debug}]`);

        this.buildCommand(action, porth_path, flag_autorun, flag_debug);
    }

    /**
     *  @brief  Assembles the command to be executed depending on the action
     *  @param  String: action, String: porth_path, Boolean: flag_autorun, Boolean: flag_debug
     *  @return -
     */
    buildCommand = (action, porth_path, flag_autorun, flag_debug) => {
        console.log("Building command...");
        let cmd = "";
        let args = [];
        switch (action) {
            case language.CMD.SIMULATE:
            case language.CMD.COMPILE:
                cmd = `python3`;
                args = [`${path.join(porth_path, "/porth.py")}`, `-I`, `${porth_path}/std`];
                if (flag_debug) args.push("-debug");
                args.push(`${action}`);
                if (flag_autorun && action == language.CMD.COMPILE) args.push("-r");
                args.push(`${this.open_file_path}`);
                return this.executeCommand(cmd, args);
            case language.CMD.RUN:
                let basepath = this.open_file_path.split(".porth")[0];
                fs.stat(basepath, (err, stats) => {
                    if (err && err.code === 'ENOENT') {
                        console.log(`${basepath} does not exist.`);
                        vscode.window.showErrorMessage("[Porth]: Executable not found. Compile before running.");
                        return this.executeCommand(cmd, args);
                    }
                    else if (err) {
                        vscode.window.showErrorMessage('[Porth]: Error while checking if output file exists: ' + err);
                        return;
                    } else {
                        if (isWin) {
                            cmd = `wsl`;
                            args = [`${basepath.replace(/\\/g, '/').replace(/(^)/, '/mnt/$1').replace(':', '')}`];
                        } else {
                            cmd = `${basepath}`;
                            args = [];
                        }
                        console.log(`Selected ${basepath} as the executable to run.`);
                        return this.executeCommand(cmd, args);
                    }
                });
        }
    }

    /**
     *  @brief  Executes the command in the Terminal
     *  @param  String: cmd, Array: args
     *  @return -
     */
    executeCommand = (cmd, args) => {
        console.log(`Executing command [${cmd}] with args [${args}]...`);
        if (cmd == "") return;
        if (vscode.window.activeTerminal != undefined && vscode.window.activeTerminal.name == "Porth") {
            vscode.window.activeTerminal.dispose();
        }
        let terminal = vscode.window.createTerminal("Porth");

        terminal.show();

        console.log(`[Running]: ${cmd} ${args.join(" ")}`);

        terminal.sendText(cmd + " " + args.join(" "));
    }

    /**
     *  @brief  Sets the file path and name of the currently opened file
     *  @param  String: file_path, String: file_name
     *  @return -
     */
    setFile = (file_path, file_name) => {
        this.open_file_path = file_path;
        this.open_file_name = file_name;
    }
}

exports.CommandsManager = CommandsManager;