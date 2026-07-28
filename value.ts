export function parseValue(src: string): string {

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

type validateNumberResult = "OK" | "ERR invalid number";

export function validateNumber(src: string): validateNumberResult {

    let match = src.match("^-?(0|[1-9][0-9]*)(\.[0-9]+)?([eE][+-]?[0-9]+)?$");
    if (match) {
        return "OK";
    }

    return "ERR invalid number";
}