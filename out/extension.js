'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const search = require("./search");
const extension_config = vscode.workspace.getConfiguration(this.id);

function activate(context) {
    console.log('Porth language extension is now active!');

    const actions = {
        SIMULATE: "sim",
        COMPILE: "com",
        RUN: "run",
        TEST: "test",
    }

    const action_strings = {
        sim: 'Simulating',
        com: 'Compiling',
        run: 'Running',
        test: 'Testing',
    }

    let executePorth = (action) => {
        if (action == actions.TEST || action == actions.RUN) {
            vscode.window.showInformationMessage("[Porth]: Not implemented yet :(");
            return;
        }

        let porth_path_conf = extension_config.get('porth.path');
        let porth_path = porth_path_conf != "_builtin_" ? porth_path_conf : path.join(context.extensionPath, "/porth");
        let open_file_path = "", open_file_name = "";

        for (let editor of vscode.window.visibleTextEditors) {
            if (editor.document.uri.fsPath.split(".").pop() == "porth") {
                open_file_path = editor.document.uri.fsPath;
                open_file_name = open_file_path.split("\\").pop();
                break;
            }
        }

        if (open_file_name == "" || open_file_path == "") {
            vscode.window.showInformationMessage("[Porth]: Please open a .porth file");
            return;
        }

        const cmd = `python`;
        const flag_autorun = extension_config.get('porth.auto-run');
        const flag_debug = extension_config.get('porth.debug');

        let args = [`${path.join(porth_path, "/porth.py")}`, `-I`, `${porth_path}\\std`];
        if (flag_debug) args.push("-debug");
        args.push(`${action}`);
        if (flag_autorun && action == actions.COMPILE) args.push("-r");
        args.push(`${open_file_path}`);

        if (action == actions.COMPILE) {
            vscode.window.showWorkspaceFolderPick().then((root) => {
                if (root === undefined) {
                    console.log("No workspace folder was detected. Not going to specify an output directory");
                }
                else {
                    let outputPath = root.uri.fsPath + "/out";
                    fs.stat(outputPath, (err, stats) => {
                        if (err && err.code === 'ENOENT') {
                            // output folder does not exist
                            try {
                                fs.mkdirSync(outputPath);
                            }
                            catch (e) {
                                if (e.code !== 'EEXIST') {
                                    throw e;
                                }
                            }
                        }
                        else if (err) {
                            vscode.window.showErrorMessage('[Porth]: Error while checking if /out folder exists: ' + err);
                            return;
                        }
                    });
                    args.push("-o", outputPath);
                }
            });
        }
        
        let output = vscode.window.createOutputChannel("Porth");
        output.show();

        output.appendLine(`[Porth]: ${action_strings[action]} ${open_file_name} ...`);
        output.appendLine(`[Running]: ${cmd} ${args.join(" ")}`);
        var child = child_process.spawn(cmd, args);
        var scriptOutput = "";

        child.stdout.setEncoding('utf8');
        child.stdout.on('data', function(data) {
            output.append(data);

            data=data.toString();
            scriptOutput+=data;
        });

        child.stderr.setEncoding('utf8');
        child.stderr.on('data', function(data) {
            output.appendLine('stderr: ' + data);

            data=data.toString();
            scriptOutput+=data;
        });

        child.on('close', function(code) {
            output.appendLine('[Porth]: Exited with code: ' + code);
        });
    };

    let simulate = vscode.commands.registerCommand('porth.simulate', () => {executePorth(actions.SIMULATE)});
    let compile = vscode.commands.registerCommand('porth.compile', () => {executePorth(actions.COMPILE)});
    let run = vscode.commands.registerCommand('porth.run', () => {executePorth(actions.RUN)});
    let test = vscode.commands.registerCommand('porth.test', () => {executePorth(actions.TEST)});

    context.subscriptions.push(simulate);
    context.subscriptions.push(compile);
    context.subscriptions.push(run);
    context.subscriptions.push(test);

    let open_documentation = vscode.commands.registerCommand('porth.OpenExtensionDocumentation', () => {
        search.openURL('https://github.com/timholzhey/porth-language');
    });
    context.subscriptions.push(open_documentation);
}

exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;