"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
var fs = require('fs');
var path = require('path');
const extension_config = vscode.workspace.getConfiguration(this.id);

class diagnosticsManager {
    constructor() {
        this.fileURI = undefined;
        this.filePath = undefined;
        this.fileBuffer = "";
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection("Porth");
        this.diagnostics;
        this.definitions;
        this.stdlibBuffer;
    }
    init() {
        if (this.fileURI === undefined) return;
        this.fileBuffer = fs.readFileSync(this.filePath, 'utf8');
        this.onDidChangeTextDocument({contentChanges: {}});
        this.parseAllDefinitions();
        this.definitionsInterval = setInterval(() => {
            this.parseAllDefinitions();
        }, 5000);
    }
    onDidChangeTextDocument = (event) => {
        this.diagnostics = [];

        for (let i in event.contentChanges) {
            let from = this.fileBuffer.lineCol2Index(event.contentChanges[i].range["_start"].line, event.contentChanges[i].range["_start"].character);
            let to = this.fileBuffer.lineCol2Index(event.contentChanges[i].range["_end"].line, event.contentChanges[i].range["_end"].character);
            if (event.contentChanges[i].text == "") {
                // Removing
                this.fileBuffer = this.fileBuffer.slice(0, from) + this.fileBuffer.slice(to);
            } else {
                // Inserting
                this.fileBuffer = this.fileBuffer.slice(0, from) + 
                event.contentChanges[i].text + 
                this.fileBuffer.slice(to);
            }
        }
        this.updateDiagnostics();
        this.diagnosticCollection.set(this.fileURI, this.diagnostics);
    }
    updateDiagnostics = () => {
        // this.checkSemanticStatic(); // Simple static semantic rules
    }
    parseAllDefinitions = () => {
        this.definitions = [];

        // Current porth file
        this.parseDefinitionsFromBuffer(this.fileBuffer, this.filePath, FILEBUFFER.CURFILE);

        // Standard library
        let stdlib_path = path.join(__dirname, "../porth/std/std.porth");
        if (fs.existsSync(stdlib_path)) {
            this.stdlibBuffer = fs.readFileSync(stdlib_path, 'utf8');
            this.parseDefinitionsFromBuffer(this.stdlibBuffer, stdlib_path, FILEBUFFER.STDLIB);
        }
    }
    parseDefinitionsFromBuffer = (fileBuffer, filePath, buffer_identifier) => {
        let allDefinitionNames = fileBuffer.match(/(?<=(\s|^)(const|proc|memory|macro)\s+)\S*/g);
        for (let i in allDefinitionNames) {
            let definitionMatch = fileBuffer.match(new RegExp(`(?<=(\\s|^)(const|proc|memory|macro)\\s+)${allDefinitionNames[i]}`));
            if (!definitionMatch) continue;
            this.definitions.push({name: definitionMatch[0].trim(), index: definitionMatch.index, file: filePath, buf: buffer_identifier});
        }
    }
    provideHover = (document, position, token) => {
        let index = this.fileBuffer.lineCol2Index(position.line, position.character);
        let word = this.fileBuffer.getWordAtIndex(index);
        for (let i in this.definitions) {
            if (this.definitions[i].name == word) {
                let fb = this.mapFileBuffer(this.definitions[i].buf);
                let datatype = fb.getWordAtIndex(this.definitions[i].index-3);
                let filename = this.definitions[i].file.split(/\\|\//).pop();
                let [line,col] = fb.index2lineCol(this.definitions[i].index);
                return new vscode.Hover(`(${datatype}) ${this.definitions[i].name} [${filename}:${line}:${col}]`);
            }
        }
    }
    setFile = (uri, path) => {
        this.fileURI = uri;
        this.filePath = path;
        this.diagnostics = [];
    }
    assignError = (index, len, msg) => {
        let [line, column] = this.fileBuffer.index2lineCol(index);
        if (line < 0 || column < 0) return;
        let range = new vscode.Range(line, column, line, column + len);
        this.diagnostics.push(new vscode.Diagnostic(range, msg, vscode.DiagnosticSeverity.Error));
    }
    checkSemanticStatic = () => {
        let invalidDefinitionNameIndex = this.fileBuffer.firstWordIndexOf("(macro|memory|proc|const)\\s+(const|if|else|end|while|do|macro|orelse|memory|proc|\\+|-|\\*|divmod|print|=|>|<|>=|<=|!=|shr|shl|or|and|not|dup|swap|drop|over|rot|!8|@8|!16|@16|!32|@32|!64|@64|cast\\(ptr\\)|cast\\(int\\)|cast\\(bool\\)|argc|argv|here|syscall0|syscall1|syscall2|syscall3|syscall4|syscall5|syscall6)");
        if (invalidDefinitionNameIndex != -1) {
            // There is an invalid block definition name
            let wordMatch = this.fileBuffer.slice(invalidDefinitionNameIndex).split(/ |\n/)[1];
            this.assignError(invalidDefinitionNameIndex + this.fileBuffer.slice(invalidDefinitionNameIndex).split(/ |\n/)[0].length + 1, 
                wordMatch.length, 
                `'${wordMatch.replace(/\n/g, "")}' Unexpected Token: Invalid block definition name, word is a reserved language feature.`);
        }

        let missingMemoryBytesIndex = this.fileBuffer.firstWordIndexOf("memory\\s*(\\S*)\\s*end");
        if (missingMemoryBytesIndex != -1) {
            // There is a memory allocation with no number of bytes provided
            let wordMatch = this.fileBuffer.slice(missingMemoryBytesIndex).split(/ |\n/)[1];
            this.assignError(missingMemoryBytesIndex + this.fileBuffer.slice(missingMemoryBytesIndex).split(/ |\n/)[0].length + 1, 
                wordMatch.length, 
                `'${wordMatch.replace(/\n/g, "")}' Missing argument: Number of bytes to allocate not provided.`);
        }

        let missingDefinitionNameIndex = this.fileBuffer.firstWordIndexOf("(memory|macro|proc|const)", "end");
        if (missingDefinitionNameIndex != -1) {
            // There is a block definition with no name
            let wordMatch = this.fileBuffer.slice(missingDefinitionNameIndex).split(/ |\n/)[1];
            this.assignError(missingDefinitionNameIndex + this.fileBuffer.slice(missingDefinitionNameIndex).split(/ |\n/)[0].length + 1, 
                wordMatch.length, 
                `'${wordMatch.replace(/\n/g, "")}' Missing argument: No block definition name provided.`);
        }

        let unexpectedTokenInMemoryDefinitionIndex = this.fileBuffer.firstWordIndexOf("(memory\\s+)(const|if|else|end|while|do|macro|orelse|memory|proc|-|divmod|print|=|>|<|>=|<=|!=|shr|shl|or|and|not|dup|swap|drop|over|rot|!8|@8|!16|@16|!32|@32|!64|@64|cast\\(ptr\\)|cast\\(int\\)|cast\\(bool\\)|argc|argv|here|syscall0|syscall1|syscall2|syscall3|syscall4|syscall5|syscall6)\\s+.*end");
        if (unexpectedTokenInMemoryDefinitionIndex != -1) {
            // There is a memory definition with forbidden tokens
            let wordMatch = this.fileBuffer.slice(unexpectedTokenInMemoryDefinitionIndex).split(/ |\n/)[0];
            this.assignError(unexpectedTokenInMemoryDefinitionIndex, 
                wordMatch.length, 
                `'${wordMatch.replace(/\n/g, "")}' Unexpected Token: Token not allowed inside block definition.`);
        }
        
        let blockStartOperandsCount = (this.fileBuffer.match(/(?<=\s|^)(?<!(\/\/|").*)(if|while|macro|proc|memory|const)\b/g) || []).length;
        let blockEndOperandsCount = (this.fileBuffer.match(/(?<=\s|^)(?<!(\/\/|").*)(end)\b/g) || []).length;
        let operands = ["if", "while", "macro", "proc", "memory", "const"];
        if (blockStartOperandsCount > blockEndOperandsCount) {
            // // There are more block starting operands than ending operands
            // let index, op;
            // for (let i in operands) {
            //     index = this.fileBuffer.lastWordIndexOf(operands[i]);
            //     if (index != -1) {
            //         op = operands[i];
            //         this.assignError(index, operands[i].length, `'${operands[i]}' Unmatched block starting operand.`);
            //         break;
            //     };
            // }
        } else if (blockStartOperandsCount < blockEndOperandsCount) {
            // There are more block ending operands than starting operands
            this.assignError(this.fileBuffer.lastWordIndexOf("end"), "end".length, "'end' Unmatched block ending operand.");
        }
        if (blockStartOperandsCount > 0 || blockEndOperandsCount > 0) {
            for (let i in operands) {
                if (this.fileBuffer.lastWordIndexOf(operands[i]) > this.fileBuffer.lastWordIndexOf("end")) {
                    // There is a trailing block starting operand
                    this.assignError(this.fileBuffer.lastWordIndexOf(operands[i]), operands[i].length, `'${operands[i]}' Unmatched trailing block starting operand`);
                }
            }
            if (this.fileBuffer.firstWordIndexOf(operands.join('|')) > this.fileBuffer.firstWordIndexOf("end")) {
                // There is a leading block ending operand
                this.assignError(this.fileBuffer.firstWordIndexOf("end"), "end".length, `'end' Unmatched leading block ending operand`);
            }
        }
    }
    mapFileBuffer = (identifier) => {
        switch (identifier) {
            case FILEBUFFER.CURFILE:
                return this.fileBuffer;
            case FILEBUFFER.STDLIB:
                return this.stdlibBuffer;
            default:
                console.log("Invalid file buffer identifier");
                return "";
        }
    }
}

String.prototype.index2lineCol = function (index) {
    return [(this.slice(0, index).match(/\n/g) || []).length + 1, index - this.slice(0, index).lastIndexOf("\n") - 1];
}
String.prototype.lineCol2Index = function (line, col) {
    return (nthIndex(this, "\n", line) + 1|| 0) + col;
}
String.prototype.lastWordIndexOf = function (str) {
    return ((this.match(new RegExp(`(?:[\\W\\w]{2,})(?<=^|\\s)(?=${str}\\b)`, 'g')) || [0])[0].length + 1 || 0) - 1;
}
String.prototype.firstWordIndexOf = function (str, to = "") {
    return (this.length - (this.match(new RegExp(`(?<!(\/\/|").*)(?<=^|\\s)(?=${str}(?:\\s|$))(?:\\S*\\W*(${to}))(?:[\\W\\w]*)`, 'g')) || [0])[0].length + 1 || 0) - 1;
}
String.prototype.getWordAtIndex = function (index) {
    let head = this.slice(0, index).split(/\n| /).pop();
    let tail = this.slice(index).split(/\n| /).shift();
    return (head + tail).trim();
}
function nthIndex(str, pat, n){
    var L = str.length, i = -1;
    while(n-- && i++ < L){
        i = str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}
let FILEBUFFER = {
    CURFILE: 0,
    STDLIB: 1,
};

exports.diagnosticsManager = diagnosticsManager;