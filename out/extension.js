'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const child_process = require("child_process");
const search = require("./search");

function activate(context) {
    console.log('Porth language extension is now active!');

    let simulate = vscode.commands.registerCommand('porth.simulate', () => {
        const cmd = `python --version`;
        child_process.exec(cmd, (err, stdout, stderr) => {
            if (err) {
                console.error(err);
                return;
            }
            console.log(stdout);
        });
    });
    context.subscriptions.push(simulate);

    let open_documentation = vscode.commands.registerCommand('porth.OpenExtensionDocumentation', () => {
        search.openURL('https://github.com/timholzhey/porth-language');
    });
    context.subscriptions.push(open_documentation);
}

exports.activate = activate;
function deactivate() {
}
exports.deactivate = deactivate;