import * as fs from "node:fs";
import { parseArray } from "./array";
import {parseJsonObject} from "./jsonObject";
import {parseValue, serializeValue} from "./value";

const lines = fs.readFileSync(0, "utf8").split("\n");

for (const line of lines) {
    if (!line) continue;

    let result: string = "";

    if (line.startsWith("{")) {
        result = parseJsonObject(line);
    } else if (line.startsWith("[")) {
        result = parseArray(line);
    } else {
        result = parseValue(line);
    }

    console.log(serializeValue(result));
}