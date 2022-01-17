"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

const Tokens = {
    definition_start: ["const", "proc", "memory", "macro"],
    definition_end: ["end"],
    intrinsics: ["max", "+", "-", "*", "divmod", "print", "=", ">", "<", ">=", "<=", "!=", "shr", "shl", "or", "and", "not", "dup", "swap", "drop", "over", "rot", "!8", "@8", "!16", "@16", "!32", "@32", "!64", "@64", "cast(ptr)", "cast(int)", "cast(bool)", "argc", "argv", "here", "syscall0", "syscall1", "syscall2", "syscall3", "syscall4", "syscall5", "syscall6"],
    keywords: ["if", "if*", "else", "while", "do", "include", "memory", "proc", "end", "const", "offset", "reset", "assert", "in", "--", "addr-of", "call-like"],
    datatypes: ["int", "ptr", "bool", "addr"],
};

const stdlib_path = "../porth/std/std.porth";

const CMD = {
    BOOTSTRAP: "bootstrap",
    COMPILE: "com",
    RUN: "run",
};

module.exports = {
    Tokens,
    stdlib_path,
    CMD,
};