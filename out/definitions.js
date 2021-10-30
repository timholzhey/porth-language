"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const path = require('path');
const fs = require('fs');
const language = require("./language_defines");
require("./utils");

let static_definitions = [];

class DefinitionProvider {
    /**
     *  @brief  Loads metadata (name, file, position) of all scopes (procedures, constants, etc.)
     *          defined inside external files statically.
     *  @param  -
     *  @return -
     */
    loadStaticDefinitions = () => {
        static_definitions = [];
        let load_static_definitions_from_files = [language.stdlib_path];

        for (let i = 0; i < load_static_definitions_from_files.length; i++) {
            let file_path = path.join(__dirname, load_static_definitions_from_files[i]);
            if (fs.existsSync(file_path)) {
                let file_buffer = fs.readFileSync(file_path, 'utf8');
                static_definitions = static_definitions.concat(static_definitions.concat(parseDefinitionsFromBuffer(file_buffer, file_path)));
            }
        }

        console.log(`Found ${static_definitions.length} definitions in files: [${load_static_definitions_from_files}]`);
    }

    /**
     *  @brief  Searches for the hovered word in the definitions table
     *  @param  vscode.DocumentSelector: document, vscode.Position: position, vscode.CancellationToken: token
     *  @return vscode.ProviderResult<vscode.Location>: Location of the definition to jump to
     *          null: No definition found
     */
    provideDefinition = (document, position, token) => {
        const word = document.getText().getWordAtIndex(document.getText().lineCol2Index(position.line, position.character));
        let definitions = static_definitions.concat(parseDefinitionsFromBuffer(document.getText(), document.uri.fsPath));

        for (let i in definitions) {
            if (definitions[i].name == word) {
                // Jump to definition
                return new vscode.Location(vscode.Uri.file(definitions[i].filePath), new vscode.Position(definitions[i].line, 0));
            }
        }
        
        return null;
    }
}

/**
 *  @brief  Parses all scope definitions from a file buffer and adds them to the table
 *  @param  String: buffer, String: filePath
 *  @return Array: Array of definition entries found in the buffer
 */
let parseDefinitionsFromBuffer = (buffer, filePath) => {
    let definitions = [];
    let allDefinitionNames = buffer.match(new RegExp(`(\\s|^)(${language.Tokens.definition_start.escapeRegExp().join('|')})\\s+\\S*`, 'g'));
    for (let i in allDefinitionNames) {
        if (!allDefinitionNames[i] || typeof allDefinitionNames[i] != "string") continue;
        let definitionMatch = buffer.match(new RegExp(`(\\s|^)(${language.Tokens.definition_start.escapeRegExp().join('|')})\\s+${allDefinitionNames[i].trim().split(" ").pop().escapeRegExp()}`));
        if (!definitionMatch) continue;
        let [line,col] = buffer.index2lineCol(definitionMatch.index);
        definitions.push({
            name: definitionMatch[0].trim().split(" ").pop(),
            index: definitionMatch.index + 1,
            filePath: filePath,
            datatype: definitionMatch[0].trim().split(" ").shift().trim(),
            filename: path.basename(filePath),
            line: line,
            col: col
        });
    }
    return definitions;
}

let getStaticDefinitions = () => {
    return static_definitions;
}

module.exports = {
    DefinitionProvider,
    parseDefinitionsFromBuffer,
    getStaticDefinitions
}