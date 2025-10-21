// scripts/vendor-baremux.mjs
import { mkdir, writeFile } from "node:fs/promises";
import https from "node:https";

const SRC = "https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@2.1.7/lib/worker.js";
const DEST = "public/vendor/bare-mux-core.js";

await mkdir("public/vendor", { recursive: true });

const get = (url) => new Promise((resolve, reject) => {
  https.get(url, (res) => {
    if (res.statusCode !== 200) return reject(new Error("HTTP " + res.statusCode));
    let data = "";
    res.setEncoding("utf8");
    res.on("data", (c) => data += c);
    res.on("end", () => resolve(data));
  }).on("error", reject);
});

const code = await get(SRC);
await writeFile(DEST, code, "utf8");
console.log("bare-mux core vendored ->", DEST);
