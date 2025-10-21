// Endpoints baked in — your running instances:
const DEFAULT_BARE = "https://bare-transport.jcullenr1236496.workers.dev/";

// Load Bare via ESM
import { BareClient } from "https://esm.sh/@mercuryworkshop/bare-mux@2?bundle";

// Get effective config (allows future overrides via localStorage)
function getCfg() {
  const bare = (localStorage.getItem("cfg.bare") || DEFAULT_BARE).trim();
  return { bare: bare.endsWith("/") ? bare : bare + "/" };
}

export function makeBare() {
  const { bare } = getCfg();
  return new BareClient(bare);
}

export async function bareFetch(url, init = {}) {
  const bare = makeBare();
  return bare.fetch(url, init);
}

// If/when you actually need Wisp later, we’ll add a correct epoxy import then.
