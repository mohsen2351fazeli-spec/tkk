// Rebuild the minified css/js after you edit a source file:
//   node tools/minify.mjs
// The pages load the .min files; the readable sources stay next to them.
// Needs Node. esbuild is fetched by npx on first run (or set ESBUILD=/path/to/esbuild).
import { execSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { readFileSync } from "node:fs";

const esbuild = process.env.ESBUILD || "npx --yes esbuild";
const jobs = [
  ["style", ".css"],
  ["script", ".js"],
];

let rawTotal = 0;
let minTotal = 0;
let gzTotal = 0;
for (const [dir, ext] of jobs) {
  for (const name of readdirSync(dir)) {
    if (!name.endsWith(ext) || name.endsWith(".min" + ext)) continue;
    const src = `${dir}/${name}`;
    const out = `${dir}/${name.slice(0, -ext.length)}.min${ext}`;
    execSync(`${esbuild} "${src}" --minify --charset=utf8 --legal-comments=none --log-level=warning --outfile="${out}"`, { stdio: "inherit" });
    const raw = statSync(src).size;
    const min = statSync(out).size;
    const gz = gzipSync(readFileSync(out)).length;
    rawTotal += raw; minTotal += min; gzTotal += gz;
    console.log(`${out.padEnd(28)} ${String(raw).padStart(6)} -> ${String(min).padStart(6)} B   (gzip ${gz} B)`);
  }
}
console.log(`total ${rawTotal} -> ${minTotal} B, gzip ${gzTotal} B`);
