import {parseValue} from "./value";
import {decodeString} from "./stringDecoder";
import {parseArray} from "./array";

export function parseJsonObject(src: string, l?: number, c?: number): string {
    src = src.trim();

    if (src === '{') {
        return `ERR line=${l} col=${c + 2} object key must be a string`;
    }
    if (!src.endsWith('}')) {
        return `ERR line=${l} col=${c + src.length} unclosed json object`;
    }

    const inner = src.slice(1, -1);

    if (inner === "") {
        return "{}";
    }

    const elements: string | string[] = validateJsonObject(inner, l, c + 1);

    if (typeof elements === "string" && elements.startsWith("ERR")) {
        return elements;
    }

    const parsedElements: string[] = [];
    let keyValue: string = "";
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        let parsed: string;

        if (i % 2 === 0) {
            const key: string = parseValue(el);

            if (key.startsWith('"') && key.endsWith('"')) {
                keyValue += key + ": ";
                continue;

            } else {
                parsed =  `ERR line=${l} col=${c + 2} object key must be a string`
            }

        } else {
            if (el.startsWith('[')) {
                parsed = parseArray(el, l, c);
            } else if (el.startsWith('{')) {
                parsed = parseJsonObject(el, l, c);
            } else {
                parsed = parseValue(el);
            }
            c += parsed.length;
            keyValue += parsed;
        }

        if (parsed.startsWith("ERR")) {
            return parsed;
        }

        if (i % 2 === 1) {
            parsedElements.push(keyValue);
            keyValue = "";
        }
    }

    return `{${sortKeys(parsedElements).join(", ")}}`;
}

function sortKeys(elements: string[]): string[] {
    return elements.sort((a, b) => a.localeCompare(b));
}

function validateJsonObject(inner: string, l?: number, c?: number): string | string[] {
    const elements: string[] = [];
    let current = "";
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let line: number = l || 1;
    let col: number = c || 0;

    for (const element of inner) {
        if (depth > 4) {
            return "ERR depth exceeded"
        }
        const c = element;
        col++;

        if (c === '\n') {
            line++;
            col = 0;
        }

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

        if ((c === ':' || c === ',') && depth === 0) {
            if (current.trim() === "") {
                return `ERR line=${line} col=${col} unexpected character ','`;
            }
            elements.push(current.trim());
            current = "";
            continue;
        }

        current += c;
    }

    if (depth !== 0) return `ERR line=${line} col=${col} mismatched brackets`;
    if (inString) return `ERR line=${line} col=${col} unclosed string`;

    const lastElement = current.trim();
    if (lastElement === "") {
        return `ERR line=${line} col=${col + 1} trailing comma`;
    }
    elements.push(lastElement);

    return elements;
}