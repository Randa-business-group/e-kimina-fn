// Cross-platform test entry: finds tests/**/*.test.ts and runs them with Node's test runner.
import { spawnSync } from "node:child_process";
import { readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const files = [];
const walk = (d) => {
  for (const e of readdirSync(d, { withFileTypes: true })) {
    const p = join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (/\.test\.tsx?$/.test(e.name)) files.push(p);
  }
};
walk(here);

const register = pathToFileURL(join(here, "register.mjs")).href;
const r = spawnSync(process.execPath, ["--import", register, "--test", ...files], { stdio: "inherit" });
process.exit(r.status ?? 1);
