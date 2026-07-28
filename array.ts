import { parseValue } from "./value";
import {type} from "node:os";

export function parseArray(src: string): string {
    src = src.trim();

    if (!src.startsWith('[') || !src.endsWith(']')) {
        return "ERR not an array";
    }

    const inner = src.slice(1, -1).trim();

    if (inner === "") {
        return "[]";
    }

    const elements: string[] | string = validateArray(inner);

    if (typeof elements === "string" && elements.startsWith("ERR")) {
        return elements;
    }

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

export function validateArray(inner: string): string[] | string {
    const elements: string[] = [];
    let current = "";
    let depth = 0;
    let inString = false;
    let escapeNext = false;

    for (const element of inner) {
        if(depth > 4) {
            return "ERR depth exceeded"
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

    return elements;
}