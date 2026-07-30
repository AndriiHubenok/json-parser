import {decodeString} from "./stringDecoder";

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
        return "true";
    }

    if (src.startsWith("false")) {
        if (src.length > 5) return `ERR line=${line} col=${col + 6} trailing data`;
        return "false";
    }

    if (src.startsWith("null")) {
        if (src.length > 4) return `ERR line=${line} col=${col + 5} trailing data`;
        return "null";
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

export function serializeValue(src: string): string {

    src = src.trim();
    if (src === "null" || src === "None") {
        return "null";
    }

    if (src === "false" || src === "False") {
        return "false";
    }

    if (src === "true" || src === "True") {
        return "true";
    }

    if (/^-?(?:0|[1-9]\d*)(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(src)) {
        return src;
    }

    if (src.startsWith('"') && src.endsWith('"')) {
        return `"${decodeString(src)}"`;
    }

    if (src.startsWith("[")) {
        const inner = src.slice(1, -1);
        if (inner === "") return "[]";

        const splitResult: string | string[] = splitObject(inner);
        if (typeof splitResult === "string" && splitResult.startsWith("ERR")) {
            return splitResult;
        }

        const elements = splitResult;
        const response: string[] = [];
        for (const el of elements) {
            response.push(serializeValue(el));
        }
        return `[${response.join(",")}]`;
    }

    if (src.startsWith("{")) {
        const inner = src.slice(1, -1);
        if (inner === "") return "{}";

        const splitResult: string | string[] = splitObject(inner);
        if (typeof splitResult === "string" && splitResult.startsWith("ERR")) {
            return splitResult;
        }

        const elements = splitResult;
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

function splitObject(src: string): string[] | string {
    const elements: string[] = [];
    let current = "";
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (const element of src) {
        if(depth > 4) {
            return "ERR"
        }

        const c = element;

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
                return "ERR";
            }
            elements.push(current.trim());
            current = "";
            continue;
        }

        current += c;
    }

    if (depth !== 0) return `ERR`;
    if (inString) return `ERR`;

    const lastElement = current.trim();
    if (lastElement === "") {
        return `ERR`;
    }
    elements.push(lastElement);

    return elements;
}