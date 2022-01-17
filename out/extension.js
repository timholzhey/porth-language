'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const vscode = require("vscode");
const search = require("./search");
const server = require("./server");
const commands = require("./commands");
const language = require("./language_defines");

/**
 *  @brief  The activate function is called when the extension is activated.
 *  @param  vscode.ExtensionContext context
 */
function activate(context) {
    console.log('Porth language extension is now active!');

    let languageServer = new server.LanguageServer();
    let commandsManager = new commands.CommandsManager();

    /**
     *  @brief  Gets the current active porth file opened in the editor.
     */
    let getPorthFile = () => {
        let editors = [];
        if (vscode.window.activeTextEditor != undefined) {
            editors.push(vscode.window.activeTextEditor);
        }
        editors = editors.concat(vscode.window.visibleTextEditors);
        for (let editor of editors) {
            if (editor.document.uri.fsPath.split(".").pop() == "porth") {
                commandsManager.setFile(editor.document.uri.fsPath, editor.document.uri.fsPath.split("\\").pop());
                languageServer.setFile(editor.document.uri, editor.document.uri.fsPath);
                languageServer.init();
                console.log(`Updated current porth file to ${editor.document.uri.fsPath}`);
                break;
            }
        }
    }

    let compile = vscode.commands.registerCommand('porth.compile', () => {
        commandsManager.prepareCommand(language.CMD.COMPILE, context);
    });
    let bootstrap = vscode.commands.registerCommand('porth.bootstrap', () => {
        commandsManager.prepareCommand(language.CMD.BOOTSTRAP, context);
    });
    let run = vscode.commands.registerCommand('porth.run', () => {
        commandsManager.prepareCommand(language.CMD.RUN, context);
    });
    let open_documentation = vscode.commands.registerCommand('porth.OpenExtensionDocumentation', () => {
        search.openURL('https://github.com/timholzhey/porth-language');
    });
    
    vscode.workspace.onDidChangeTextDocument((event) => {
        languageServer.onDidChangeTextDocument(event);
    });
    vscode.window.onDidChangeVisibleTextEditors(() => {
        getPorthFile();
    });
    vscode.workspace.onDidCloseTextDocument((event) => {
        getPorthFile();
    });
    vscode.workspace.onDidOpenTextDocument((event) => {
        getPorthFile();
    });

    let hoverProvider = vscode.languages.registerHoverProvider('porth', {
        provideHover(document, position, token) {
            return languageServer.provideHover(document, position, token);
        }
    });

    let definitionProvider = vscode.languages.registerDefinitionProvider('porth', {
        provideDefinition(document, position, token) {
            return languageServer.provideDefinition(document, position, token);
        }
    });

    context.subscriptions.push(compile, bootstrap, run, open_documentation, hoverProvider, definitionProvider);
}

exports.activate = activate;
function deactivate() {

}
exports.deactivate = deactivate;
