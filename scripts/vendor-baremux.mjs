// Vendors the Bare-Mux worker into /public so it can be loaded from same-origin.
import { mkdir, writeFile } from "node:fs/promises";

const VER = process.env.BAREMUX_VER || "2.1.7"; // you can override in CF build vars

const CANDIDATES = [
  // common paths
  `https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@${VER}/lib/worker.js`,
  `https://unpkg.com/@mercuryworkshop/bare-mux@${VER}/lib/worker.js`,
  // alt paths some releases use
  `https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux@${VER}/dist/worker.js`,
  `https://unpkg.com/@mercuryworkshop/bare-mux@${VER}/dist/worker.js`,
  // unpinned fallbacks
  `https://cdn.jsdelivr.net/npm/@mercuryworkshop/bare-mux/lib/worker.js`,
  `https://unpkg.com/@mercuryworkshop/bare-mux/lib/worker.js`,
];

async function fetchFirstOk(urls) {
  for (const url of urls) {
    try {
      const r = await fetch(url);
      if (r.ok) return { code: await r.text(), from: url };
    } catch (_) { /* try next */ }
  }
  throw new Error("Could not download bare-mux worker from any known URL.");
}

const { code, from } = await fetchFirstOk(CANDIDATES);

await mkdir("public/vendor", { recursive: true });
await writeFile("public/vendor/bare-mux-core.js", code, "utf8");
console.log("Vendored Bare-Mux worker from:", from, "→ public/vendor/bare-mux-core.js");
