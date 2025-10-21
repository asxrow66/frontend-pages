// Used by BOTH the page and the service worker.
self.__uv$config = {
  // All proxied paths are under this prefix (must match SW scope)
  prefix: "/go/",

  // Your Cloudflare Bare worker root (no trailing slash required; UV appends /v1)
  // If yours already serves at /v1, keep it as-is. Using the root also works.
  bare: "https://bare-transport.jcullenr1236496.workers.dev",

  // WebSocket proxy (Koyeb Wisp)
  wisp: "wss://voiceless-dorry-nothinggames-cd908596.koyeb.app",

  // Where UV runtime files live
  handler: "/uv/uv.handler.js",
  client:  "/uv/uv.client.js",
  bundle:  "/uv/uv.bundle.js",
  sw:      "/sw.js",
  config:  "/uv/uv.config.js",

  // URL codec (keeps paths compact)
  encodeUrl: Ultraviolet.codec.xor.encode,
  decodeUrl: Ultraviolet.codec.xor.decode,

  // Bare-Mux SharedWorker served locally (fixes SharedWorker cross-origin rules)
  mux: { worker: "/bare-mux-worker.js" }
};
