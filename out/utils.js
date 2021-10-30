"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

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

String.prototype.escapeRegExp = function () {
    return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

Array.prototype.escapeRegExp = function () {
    return this.map(x => x.escapeRegExp());
}
