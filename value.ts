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
            return '"' + src.slice(1, -1) + '"';
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

export function serializeValue(src: string): string {

    src = src.trim();
    if (src === "None") {
        return "null";
    }

    if (src === "null" || src === "true" || src === "false") {
        return src;
    }

    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(src)) {
        return src;
    }

    if (src.startsWith('"') && src.endsWith('"')) {
        //return quotingString(src.slice(1, -1));
        return src;
    }

    if (src.startsWith("[")) {
        const inner = src.slice(1, -1);
        if (inner === "") return "[]";

        const elements: string[] = inner.split(',');
        const response: string[] = [];
        for (const el of elements) {
            response.push(serializeValue(el));
        }
        return `[${response.join(",")}]`;
    }

    if (src.startsWith("{")) {
        const inner = src.slice(1, -1);
        if (inner === "") return "{}";

        const elements: string[] = inner.split(',');
        const response: string[] = [];
        for (const el of elements) {
            const eqIndex = el.indexOf(':');
            if (eqIndex !== -1) {
                const key = el.slice(0, eqIndex);
                const value = el.slice(eqIndex + 1);

                response.push(`${(key.trim())}:${(value.trim())}`);
            }
        }

        return `{${response.sort((a, b) => a.localeCompare(b)).join(",")}}`;
    }

    return quotingString(src);
}

function quotingString(src: string): string {
    const response: string[] = ['"'];

    for (const c of src) {
        if (c === '"') {
            response.push('\\"');
        } else if (c === '\\') {
            response.push('\\\\');
        } else if (c === '\n') {
            response.push('\\n');
        } else if (c === '\r') {
            response.push('\\r');
        } else if (c === '\t') {
            response.push('\\t');
        } else if (c === '\b') {
            response.push('\\b');
        } else if (c === '\f') {
            response.push('\\f');
        } else {
            const cp = c.codePointAt(0);
            if (cp !== undefined && cp < 0x20) {
                response.push(`\\u${cp.toString(16).padStart(4, '0')}`);
            } else {
                response.push(c);
            }
        }
    }

    response.push('"');
    return response.join('');
}