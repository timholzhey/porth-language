"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require("path");
const def = require("./definitions");
const language = require("./language_defines");

class HoverProvider {
    /**
     *  @brief  Searches the hovered word in the list of language keywords and scope definitions
     *  @param  vscode.DocumentSelector document
     *  @param  vscode.Position position
     *  @param  vscode.CancellationToken token
     *  @return vscode.ProviderResult<vscode.Hover>
     */
    provideHover = (document, position, token) => {
        const word = document.getText().getWordAtIndex(document.getText().lineCol2Index(position.line, position.character));
        let definitions = def.getStaticDefinitions().concat(def.parseDefinitionsFromBuffer(document.getText(), document.uri.fsPath));

        for (let i in definitions) {
            if (definitions[i].name == word) {
                return new vscode.Hover(`(${definitions[i].datatype}) ${definitions[i].name} [${definitions[i].filename}:${definitions[i].line}:${definitions[i].col}]`);
            }
        }
        for (let i in language.Tokens.intrinsics) {
            if (language.Tokens.intrinsics[i] == word) {
                return new vscode.Hover(`(Porth Intrinsic) ${language.Tokens.intrinsics[i]}`);
            }
        }
        for (let i in language.Tokens.keywords) {
            if (language.Tokens.keywords[i] == word) {
                return new vscode.Hover(`(Porth Keyword) ${language.Tokens.keywords[i]}`);
            }
        }
        for (let i in language.Tokens.datatypes) {
            if (language.Tokens.datatypes[i] == word) {
                return new vscode.Hover(`(Porth Datatype) ${language.Tokens.datatypes[i]}`);
            }
        }
    }
}

exports.HoverProvider = HoverProvider;