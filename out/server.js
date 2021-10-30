"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
var fs = require('fs');
var path = require('path');
var diagnostics = require('./diagnostics');
var definitions = require('./definitions');
var hover = require('./hover');
const extension_config = vscode.workspace.getConfiguration(this.id);

class LanguageServer {
    constructor() {
        this.fileURI = undefined;
        this.filePath = undefined;
        this.diagnosticsProvider = new diagnostics.DiagnosticsProvider();
        this.hoverProvider = new hover.HoverProvider();
        this.definitionProvider = new definitions.DefinitionProvider();
    }
    init() {
        this.definitionProvider.loadStaticDefinitions();
    }
    onDidChangeTextDocument = (event) => {
        this.diagnosticsProvider.provideDiagnostics();
    }
    provideHover = (document, position, token) => {
        return this.hoverProvider.provideHover(document, position, token);
    }
    provideDefinition = (document, position, token) => {
        return this.definitionProvider.provideDefinition(document, position, token);
    }
    setFile = (uri, path) => {
        this.fileURI = uri;
        this.filePath = path;
    }
}

exports.LanguageServer = LanguageServer;