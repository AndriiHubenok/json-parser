import { parseValue } from "./value";
import {type} from "node:os";

export function parseArray(src: string, l?: number, c?: number): string {
    src = src.trim();

    if (src === '[') {
        return `ERR line=${l} col=${c + 2} unexpected EOF`;
    }
    if (!src.endsWith(']')) {
        return `ERR line=${l} col=${c + src.length} unclosed array`;
    }

    const inner = src.slice(1, -1);

    if (inner === "") {
        return "[]";
    }

    const elements: string[] | string = validateArray(inner, l, c + 1);

    if (typeof elements === "string" && elements.startsWith("ERR")) {
        return elements;
    }

    const parsedElements: string[] = [];
    for (const el of elements) {
        let parsed: string;

        if (el.startsWith('[')) {
            parsed = parseArray(el, l, c);
        } else {
            parsed = parseValue(el);
        }

        if (parsed.startsWith("ERR")) {
            return parsed;
        }

        c += parsed.length;
        parsedElements.push(parsed);
    }

    return `[${parsedElements.join(", ")}]`;
}

export function validateArray(inner: string, l?: number, c?: number): string[] | string {
    const elements: string[] = [];
    let current = "";
    let depth = 0;
    let inString = false;
    let escapeNext = false;
    let line: number = l || 1;
    let col: number = c || 0;

    for (const element of inner) {
        if(depth > 4) {
            return "ERR depth exceeded"
        }
        col++;

        const c = element;

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

        if (c === ',' && depth === 0) {
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