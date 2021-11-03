"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

/**
 *  @brief  Converts an index to a pair of line and column numbers.
 *  @param  number index
 */
String.prototype.index2lineCol = function (index) {
    return [(this.slice(0, index).match(/\n/g) || []).length + 1, index - this.slice(0, index).lastIndexOf("\n") - 1];
}

/**
 *  @brief  Converts a pair of line and column numbers to an index.
 *  @param  number line
 *  @param  number col
 */
String.prototype.lineCol2Index = function (line, col) {
    return (nthIndex(this, "\n", line) + 1|| 0) + col;
}

/**
 *  @brief  Gets the index of the last occurrence of a space- or line-seperated word in a string.
 *  @param  String str
 */
String.prototype.lastWordIndexOf = function (str) {
    return ((this.match(new RegExp(`(?:[\\W\\w]{2,})(?<=^|\\s)(?=${str}\\b)`, 'g')) || [0])[0].length + 1 || 0) - 1;
}

/**
 *  @brief  Gets the index of the first occurrence of a space- or line-seperated word in a string.
 *  @param  String str
 *  @param  String to [optional]
 */
String.prototype.firstWordIndexOf = function (str, to = "") {
    return (this.length - (this.match(new RegExp(`(?<!(\/\/|").*)(?<=^|\\s)(?=${str}(?:\\s|$))(?:\\S*\\W*(${to}))(?:[\\W\\w]*)`, 'g')) || [0])[0].length + 1 || 0) - 1;
}

/**
 *  @brief  Gets the word located at a given index.
 *  @param  number index
 */
String.prototype.getWordAtIndex = function (index) {
    let head = this.slice(0, index).split(/\n| /).pop();
    let tail = this.slice(index).split(/\n| /).shift();
    return (head + tail).trim();
}

/**
 *  @brief  Gets the index of the nth occurrence of a pattern in a string.
 *  @param  String str
 *  @param  String pat
 *  @param  number n
 */
function nthIndex(str, pat, n){
    var L = str.length, i = -1;
    while(n-- && i++ < L){
        i = str.indexOf(pat, i);
        if (i < 0) break;
    }
    return i;
}

/**
 *  @brief  Escapes a string for use in a regular expression.
 */
String.prototype.escapeRegExp = function () {
    return this.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 *  @brief  Escapes all strings in an array for use in a regular expression.
 */
Array.prototype.escapeRegExp = function () {
    return this.map(x => x.escapeRegExp());
}
