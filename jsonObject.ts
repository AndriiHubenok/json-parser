import {parseValue} from "./value";
import {decodeString} from "./stringDecoder";
import {parseArray} from "./array";

export function parseJsonObject(src: string): string {
    src = src.trim();

    if (!src.startsWith('{') || !src.endsWith('}')) {
        return "ERR not a json object";
    }

    const inner = src.slice(1, -1).trim();

    if (inner === "") {
        return "{}";
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

        if ((c === ':' || c === ',') && depth === 0) {
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
    let keyValue: string = "";
    for (let i = 0; i < elements.length; i++) {
        const el = elements[i];
        let parsed: string;

        if (i % 2 === 0) {
            const key: string = parseValue(el);

            if (key.startsWith("'") && key.endsWith("'")) {
                keyValue += key + ": ";
                continue;

            } else {
                parsed =  "ERR object key must be a string"
            }

        } else {
            if (el.startsWith('[')) {
                parsed = parseArray(el);
            } else if (el.startsWith('{')) {
                parsed = parseJsonObject(el);
            } else {
                parsed = parseValue(el);
            }
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