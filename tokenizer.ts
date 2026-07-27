import * as fs from "node:fs";

type TokenKind =
    | "PUNCT"
    | "STRING"
    | "NUMBER"
    | "TRUE"
    | "FALSE"
    | "NULL"
    | "EOF";

type Token = [TokenKind, string];

const lines: string[] = fs.readFileSync(0, "utf8").split(/\r?\n/);

function tokenize(src: string): Token[] {
    const tokens: Token[] = [];
    let i = 0;

    while (i < src.length) {
        const c = src[i];

        if (" \t\n\r".includes(c)) {
            i++;
            continue;
        }

        if ("{}[],:".includes(c)) {
            tokens.push(["PUNCT", c]);
            i++;
            continue;
        }

        if (c === '"') {
            let j = i + 1;
            const response: string[] = [];

            while (j < src.length && src[j] !== '"') {
                if (src[j] === "\\") {
                    const next = src[j + 1];
                    if (
                        next === '"' ||
                        next === "\\" ||
                        next === "n" ||
                        next === "t"
                    ) {
                        response.push(next);
                        j += 2;
                        continue;
                    }
                }

                response.push(src[j]);
                j++;
            }

            tokens.push(["STRING", response.join("")]);
            i = j + 1;
            continue;
        }

        if (c === "-" || (c >= "0" && c <= "9")) {
            let j = i;
            if (c === "-") j++;

            while (j < src.length && src[j] >= "0" && src[j] <= "9") j++;

            if (src[j] === ".") {
                j++;
                while (j < src.length && src[j] >= "0" && src[j] <= "9") j++;
            }

            if (src[j] === "e" || src[j] === "E") {
                j++;
                if (src[j] === "+" || src[j] === "-") j++;
                while (j < src.length && src[j] >= "0" && src[j] <= "9") j++;
            }

            tokens.push(["NUMBER", src.slice(i, j)]);
            i = j;
            continue;
        }

        if (src.startsWith("true", i)) {
            tokens.push(["TRUE", "true"]);
            i += 4;
            continue;
        }

        if (src.startsWith("false", i)) {
            tokens.push(["FALSE", "false"]);
            i += 5;
            continue;
        }

        if (src.startsWith("null", i)) {
            tokens.push(["NULL", "null"]);
            i += 4;
            continue;
        }

        throw new Error(`unexpected character ${c} at position ${i}`);
    }

    tokens.push(["EOF", ""]);
    return tokens;
}

// const out: string[] = [];
//
// for (const line of lines) {
//     if (line === "") continue;
//
//     try {
//         for (const [k, v] of tokenize(line)) {
//             if (k === "EOF") {
//                 out.push(k);
//             } else {
//                 out.push(`${k} ${v}`);
//             }
//         }
//     } catch (e) {
//         if (e instanceof Error) {
//             out.push(`ERR ${e.message}`);
//         } else {
//             out.push("ERR unknown error");
//         }
//     }
// }
//
// if (out.length > 0) {
//     process.stdout.write(out.join("\n") + "\n");
// }

function decodeString(input: string): string {

    if (input.length < 2 || (!input.startsWith('"')) || (!input.endsWith('"'))) {
        return "ERR"
    }

    let i: number = 1;
    const response: string[] = [];

    while (i < input.length && input[i] !== '"') {
        if (input[i] === "\\") {

            if (i + 1 >= input.length - 1) {
                return "ERR";
            }
            const next = input[i + 1];

            if (next === '"' || next === "\\" || next === "/"
            ) {
                response.push(next);
                i += 2;
                continue;
            }

            if (next === 'n') {
                response.push("\n");
                i += 2;
                continue;
            }

            if (next === 't') {
                response.push("\t");
                i += 2;
                continue;
            }

            if (next === 'b') {
                response.push('\b');
                i += 2;
                continue;
            }

            if (next === 'f') {
                response.push('\f');
                i += 2;
                continue;
            }

            if (next === "u") {
                if (i + 5 >= input.length - 1) {
                    return "ERR";
                }

                const hexStr: string = input.slice(i + 2, i + 6);
                if (!/^[0-9a-fA-F]{4}$/.test(hexStr)) {
                    return "ERR";
                }
                let hex: number = parseInt(hexStr, 16);

                if (i + 6 < input.length - 1 && input[i + 6] === '\\' && input[i + 7] === 'u') {
                    if (i + 11 >= input.length - 1) {
                        return "ERR"
                    }

                    const hexStr2: string = input.slice(i + 8, i + 12);
                    if (!/^[0-9a-fA-F]{4}$/.test(hexStr2)) {
                        return "ERR";
                    }

                    hex = 0x10000 + ((hex - 0xD800) << 10) + parseInt(hexStr2, 16) - 0xDC00;
                    response.push(String.fromCharCode(hex));
                    i += 12;
                    continue;
                }

                response.push(String.fromCharCode(hex));
                i += 6;
                continue;
            }

            return "ERR";

        }
        response.push(input[i]);
        i++;
    }

    return response.join("");
}

function parseValue(src: string): string {

    if (src.startsWith('"') && src.endsWith('"')) {
        return "'" + src.slice(1, -1) + "'";
    }

    if (src === "true") {
        return "True";
    }

    if (src === "false") {
        return "False";
    }

    if (src === "null") {
        return "None";
    }

    const match = src.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (match) {
        const numStr = match[0];
        const num = Number(numStr);

        if (Number.isInteger(num) && (numStr.includes('.') || /[eE]/.test(numStr))) {
            return num.toFixed(1);
        }

        return num.toString();
    }

    return `ERR not a JSON literal: '${src}'`;
}

function parseArray(src: string): string {
    src = src.trim();

    if (!src.startsWith('[') || !src.endsWith(']')) {
        return "ERR not an array";
    }

    const inner = src.slice(1, -1).trim();

    if (inner === "") {
        return "[]";
    }

    const elements: string[] = [];
    let current = "";
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (let i = 0; i < inner.length; i++) {
        const c = inner[i];

        if (inString) {
            if (escapeNext) {
                escapeNext = false;
            } else if (c === '\\') {
                escapeNext = true;
            } else if (c === '"') {
                inString = false;
            }
            current += c;
            continue;
        }

        if (c === '"') {
            inString = true;
            current += c;
            continue;
        }

        if (c === '[' || c === '{') {
            depth++;
            current += c;
            continue;
        }

        if (c === ']' || c === '}') {
            depth--;
            current += c;
            continue;
        }

        if (c === ',' && depth === 0) {
            if (current.trim() === "") {
                return "ERR unexpected/consecutive comma";
            }
            elements.push(current.trim());
            current = "";
            continue;
        }

        current += c;
    }

    if (depth !== 0) return "ERR mismatched brackets";
    if (inString) return "ERR unclosed string";

    const lastElement = current.trim();
    if (lastElement === "") {
        return "ERR trailing comma";
    }
    elements.push(lastElement);

    const parsedElements: string[] = [];
    for (const el of elements) {
        let parsed: string;

        if (el.startsWith('[')) {
            parsed = parseArray(el);
        } else {
            parsed = parseValue(el);
        }

        if (parsed.startsWith("ERR")) {
            return parsed;
        }

        parsedElements.push(parsed);
    }

    return `[${parsedElements.join(", ")}]`;
}

type validateNumberResult = "OK" | "ERR invalid number";

function validateNumber(src: string): validateNumberResult {

    let match = src.match("^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$");
    if (match) {
        return "OK";
    }

    return "ERR invalid number";
}



for (const line of lines) {
    if (!line) continue;
    console.log(parseArray(line));
}