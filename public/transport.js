// Endpoints baked in — your running instances:
const DEFAULT_BARE = "https://bare-transport.jcullenr1236496.workers.dev/";
const DEFAULT_WISP = "wss://voiceless-dorry-nothinggames-cd908596.koyeb.app/";

// Load libs via ESM
import { BareClient } from "https://esm.sh/@mercuryworkshop/bare-mux@2?bundle";
import { connect as wispConnect } from "https://esm.sh/@mercuryworkshop/epoxy-transport@2?bundle";

// Get effective config (allow overrides via localStorage if you ever add a UI)
function getCfg() {
  const bare = (localStorage.getItem("cfg.bare") || DEFAULT_BARE).trim();
  const wisp = (localStorage.getItem("cfg.wisp") || DEFAULT_WISP).trim();
  return { bare: bare.endsWith("/") ? bare : bare + "/", wisp };
}

export function makeBare() {
  const { bare } = getCfg();
  return new BareClient(bare);
}

export async function bareFetch(url, init = {}) {
  const bare = makeBare();
  return bare.fetch(url, init);
}

// For completeness if you later add WS features
export async function openWisp() {
  const { wisp } = getCfg();
  return wispConnect(wisp);
}
