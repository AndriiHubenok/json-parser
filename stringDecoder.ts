export function decodeString(input: string): string {

    if (input.length < 2 || (!input.startsWith('"')) || (!input.endsWith('"'))) {
        return "ERR"
    }

    let i: number = 1;
    const response: string[] = [];

    while (i < input.length && input[i] !== '"') {
        if (input[i] === "\\") {

            if (i + 1 >= input.length - 1) {
                return "ERR";
            }
            const next = input[i + 1];

            if (next === '"' || next === "\\" || next === "/"
            ) {
                response.push(next);
                i += 2;
                continue;
            }

            if (next === 'n') {
                response.push("\n");
                i += 2;
                continue;
            }

            if (next === 't') {
                response.push("\t");
                i += 2;
                continue;
            }

            if (next === 'b') {
                response.push('\b');
                i += 2;
                continue;
            }

            if (next === 'f') {
                response.push('\f');
                i += 2;
                continue;
            }

            if (next === "u") {
                if (i + 5 >= input.length - 1) {
                    return "ERR";
                }

                const hexStr: string = input.slice(i + 2, i + 6);
                if (!/^[0-9a-fA-F]{4}$/.test(hexStr)) {
                    return "ERR";
                }
                let hex: number = parseInt(hexStr, 16);

                if (i + 6 < input.length - 1 && input[i + 6] === '\\' && input[i + 7] === 'u') {
                    if (i + 11 >= input.length - 1) {
                        return "ERR"
                    }

                    const hexStr2: string = input.slice(i + 8, i + 12);
                    if (!/^[0-9a-fA-F]{4}$/.test(hexStr2)) {
                        return "ERR";
                    }

                    hex = 0x10000 + ((hex - 0xD800) << 10) + parseInt(hexStr2, 16) - 0xDC00;
                    response.push(String.fromCharCode(hex));
                    i += 12;
                    continue;
                }

                response.push(String.fromCharCode(hex));
                i += 6;
                continue;
            }

            return "ERR";

        }
        response.push(input[i]);
        i++;
    }

    return response.join("");
}