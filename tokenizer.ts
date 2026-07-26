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

const out: string[] = [];

for (const line of lines) {
    if (line === "") continue;

    try {
        for (const [k, v] of tokenize(line)) {
            if (k === "EOF") {
                out.push(k);
            } else {
                out.push(`${k} ${v}`);
            }
        }
    } catch (e) {
        if (e instanceof Error) {
            out.push(`ERR ${e.message}`);
        } else {
            out.push("ERR unknown error");
        }
    }
}

if (out.length > 0) {
    process.stdout.write(out.join("\n") + "\n");
}