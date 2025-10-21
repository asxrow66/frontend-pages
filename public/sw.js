// Cloudflare Pages requires SW scripts to be same-origin files.
importScripts("/uv/uv.bundle.js"); // gives Ultraviolet.codec.*
importScripts("/uv/uv.config.js"); // defines self.__uv$config (your endpoints)
importScripts("/uv/uv.sw.js");     // defines UVServiceWorker

const sw = new UVServiceWorker();
sw.route();
