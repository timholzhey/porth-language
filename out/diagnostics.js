"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
require("./utils");

class DiagnosticsProvider {
    constructor() {
        this.diagnostics = [];
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection("Porth");
    }

    /**
     *  @brief  Adds an error diagnostics entry to the array of diagnostics.
     *  @param  String: buffer, Number: index, Number: len, String: msg
     *  @return -
     */
    assignError = (buffer, index, len, msg) => {
        let [line, column] = buffer.index2lineCol(index);
        if (line < 0 || column < 0) return;
        let range = new vscode.Range(line, column, line, column + len);
        this.diagnostics.push(new vscode.Diagnostic(range, msg, vscode.DiagnosticSeverity.Error));
    }

    /**
     *  @brief  Checks the syntax and adds diagnostics entries (e.g. errors) to the diagnostics collection.
     *  @param  -
     *  @return -
     */
    provideDiagnostics = () => {
        // TODO: Too many language changes at the moment
    }
}

exports.DiagnosticsProvider = DiagnosticsProvider;