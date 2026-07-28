export function parseValue(src: string, l?: number, c?: number): string {
    let line: number = l || 1;
    let col: number = c || 0;

    if (src.startsWith('"')) {
        let end = -1;
        for (let i = 1; i < src.length; i++) {
            if (src[i] === '\\') {
                i++;
            } else if (src[i] === '"') {
                end = i;
                break;
            }
        }

        if (end !== -1) {
            if (end < src.length - 1) {
                return `ERR line=${line} col=${col + end + 2} trailing data`;
            }
            return "'" + src.slice(1, -1) + "'";
        }
    }

    if (src.startsWith("true")) {
        if (src.length > 4) return `ERR line=${line} col=${col + 5} trailing data`;
        return "True";
    }

    if (src.startsWith("false")) {
        if (src.length > 5) return `ERR line=${line} col=${col + 6} trailing data`;
        return "False";
    }

    if (src.startsWith("null")) {
        if (src.length > 4) return `ERR line=${line} col=${col + 5} trailing data`;
        return "None";
    }

    const match = src.match(/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?/);
    if (match) {
        const numStr = match[0];

        if (numStr.length < src.length) {
            return `ERR line=${line} col=${col + numStr.length + 1} trailing data`;
        }

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