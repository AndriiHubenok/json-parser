require("node:child_process").spawnSync(process.execPath, ["tokenizer.ts"], {
    stdio: "inherit"
});