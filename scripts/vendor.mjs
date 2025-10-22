// scripts/vendor.mjs
import fs from "node:fs/promises";
import path from "node:path";

async function ensureDir(p) { await fs.mkdir(p, { recursive: true }); }

async function copyResolved(from, to) {
  let resolved;
  try {
    resolved = new URL(await import.meta.resolve(from));
  } catch (e) {
    throw new Error(`Cannot resolve ${from}. Is the dependency installed?`);
  }
  await ensureDir(path.dirname(to));
  await fs.copyFile(resolved, to);
  console.log("→", path.basename(to));
}

const out = "public";

(async () => {
  await ensureDir(out);

  // Ultraviolet runtime (SW + config + bundle)
  await copyResolved("@titaniumnetwork-dev/ultraviolet/dist/uv.bundle.js", `${out}/uv.bundle.js`);
  await copyResolved("@titaniumnetwork-dev/ultraviolet/dist/uv.config.js", `${out}/uv.config.js`);
  await copyResolved("@titaniumnetwork-dev/ultraviolet/dist/uv.sw.js", `${out}/uv.sw.js`);
  try {
    await copyResolved("@titaniumnetwork-dev/ultraviolet/dist/uv.sw.js.map", `${out}/uv.sw.js.map`);
  } catch { /* optional */ }

  // Bare-Mux main thread bundle + SharedWorker (must be same-origin)
  // Common paths across versions:
  const bmBundleTry = [
    "@mercuryworkshop/bare-mux/dist/bare-mux.bundle.mjs",
    "@mercuryworkshop/bare-mux/dist/index.mjs"
  ];
  let copied = false;
  for (const cand of bmBundleTry) {
    try {
      await copyResolved(cand, `${out}/bare-mux.bundle.mjs`);
      copied = true; break;
    } catch {}
  }
  if (!copied) throw new Error("Could not locate bare-mux bundle mjs in the package.");

  const bmWorkerTry = [
    "@mercuryworkshop/bare-mux/dist/worker.js",
    "@mercuryworkshop/bare-mux/dist/bare-mux-worker.js"
  ];
  copied = false;
  for (const cand of bmWorkerTry) {
    try {
      await copyResolved(cand, `${out}/bare-mux-worker.js`);
      copied = true; break;
    } catch {}
  }
  if (!copied) throw new Error("Could not locate bare-mux worker.js in the package.");

  console.log("All assets copied into /public");
})();
