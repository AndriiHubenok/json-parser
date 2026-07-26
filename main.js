const lines = require("fs").readFileSync(0, "utf8").split("\n");

function tokenize(src) {
  const tokens = []; let i = 0;
  while (i < src.length) {
    const c = src[i];
    if (" \t\n\r".includes(c)) { i++; continue; }
    if ("{}[],:".includes(c)) { tokens.push(["PUNCT", c]); i++; continue; }
    if (c === '"') {
      // TODO: read until closing '"', handling \" \\ \n \t \uXXXX escapes.
      let j = i + 1;
      while (j < src.length && src[j] !== '"') j++;
      tokens.push(["STRING", src.slice(i + 1, j)]); i = j + 1; continue;
    }
    if (c === '-' || (c >= '0' && c <= '9')) {
      let j = i; if (c === '-') j++;
      while (j < src.length && src[j] >= '0' && src[j] <= '9') j++;
      if (src[j] === '.') { j++; while (src[j] >= '0' && src[j] <= '9') j++; }
      // TODO: handle scientific notation (e/E +/- digits).
      tokens.push(["NUMBER", src.slice(i, j)]); i = j; continue;
    }
    if (src.startsWith("true",  i)) { tokens.push(["TRUE",  "true"]);  i += 4; continue; }
    if (src.startsWith("false", i)) { tokens.push(["FALSE", "false"]); i += 5; continue; }
    if (src.startsWith("null",  i)) { tokens.push(["NULL",  "null"]);  i += 4; continue; }
    throw new Error(`unexpected character ${c} at position ${i}`);
  }
  tokens.push(["EOF", ""]);
  return tokens;
}

for (const line of lines) {
  if (!line) continue;
  try {
    for (const [k, v] of tokenize(line)) console.log(`${k} ${v}`);
    console.log("");
  } catch (e) { console.log(`ERR ${e.message}`); }
}
