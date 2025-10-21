import { bareFetch } from "./transport.js";

const $ = (s) => document.querySelector(s);
const view = $("#view");
const urlBox = $("#url");
const spinner = $("#spinner");
const backBtn = $("#back");
const fwdBtn = $("#forward");
const reloadBtn = $("#reload");
const schemeEl = $("#scheme");

// Simple session history
const historyStack = [];
let historyIndex = -1;
let currentUrl = "";

// Search engine (change here if you want another provider)
const SEARCH_BASE = "https://www.google.com/search?q=";
const HOMEPAGE = "https://www.google.com/";

// --- Omnibox helpers ---

function isLikelyUrl(input) {
  const s = input.trim();
  if (!s) return false;
  // If it parses as a URL, it's a URL.
  try {
    // Accept explicit schemes
    const u = new URL(s);
    return !!u.protocol;
  } catch {}
  // If it has spaces, treat as search (unless it's a data/mailto etc., which we don't support here)
  if (/\s/.test(s)) return false;
  // Heuristics: contains a dot or is localhost or has a slash segment
  if (s.includes(".") || s.startsWith("localhost") || s.includes("/")) return true;
  return false;
}

function toUrlOrSearch(input) {
  const s = (input || "").trim();
  if (!s) return HOMEPAGE; // empty → homepage
  if (isLikelyUrl(s)) {
    // Add https:// if user omitted scheme
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) return s;
    return `https://${s}`;
  }
  // Otherwise: Google search
  return SEARCH_BASE + encodeURIComponent(s);
}

// --- UI/State ---

function setBusy(b) { spinner.classList.toggle("active", !!b); }

function updateNavButtons() {
  backBtn.disabled = !(historyIndex > 0);
  fwdBtn.disabled = !(historyIndex >= 0 && historyIndex < historyStack.length - 1);
  reloadBtn.disabled = !(historyIndex >= 0);
}

function updateAddressBar(u) {
  try {
    const parsed = new URL(u);
    schemeEl.textContent = parsed.protocol + "//";
    urlBox.value = parsed.host + parsed.pathname + parsed.search + parsed.hash;
  } catch {
    schemeEl.textContent = "https://";
    urlBox.value = u;
  }
}

async function renderViaBlob(html) {
  const blob = new Blob([html], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);
  view.src = blobUrl;
  await new Promise((res) => {
    const onload = () => { view.removeEventListener("load", onload); res(); };
    view.addEventListener("load", onload);
  });
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

function rewriteHtml(html, baseHref) {
  let output = html;
  const hasHead = /<head[^>]*>/i.test(output);
  const baseTag = `<base href="${baseHref}">`;
  const refMeta = `<meta name="referrer" content="no-referrer">`;
  const charset = `<meta charset="utf-8">`;

  if (hasHead) {
    output = output.replace(/<head[^>]*>/i, (m) => `${m}\n${charset}\n${baseTag}\n${refMeta}`);
  } else {
    output = `<!doctype html><head>${charset}${baseTag}${refMeta}</head>${output}`;
  }
  return output;
}

// Core navigation
async function navigate(inputValue, { push = true } = {}) {
  const href = toUrlOrSearch(inputValue);
  setBusy(true);
  try {
    const res = await bareFetch(href, { method: "GET" });
    const txt = await res.text();
    const html = rewriteHtml(txt, href);

    await renderViaBlob(html);

    currentUrl = href;
    updateAddressBar(currentUrl);

    if (push) {
      historyStack.splice(historyIndex + 1);
      historyStack.push(currentUrl);
      historyIndex = historyStack.length - 1;
    }
  } catch (e) {
    const errHtml = `<!doctype html><meta charset="utf-8">
      <body style="background:#0b0e14;color:#e8f0fe;font-family:system-ui">
        <div style="max-width:860px;margin:8vh auto;padding:24px">
          <h2>Load error</h2>
          <p>Failed to fetch <code>${href}</code> via proxy.</p>
          <pre style="background:#111319;border:1px solid #1b1f2a;border-radius:10px;padding:12px;white-space:pre-wrap">${(e && e.message) || e}</pre>
        </div>
      </body>`;
    await renderViaBlob(errHtml);
  } finally {
    setBusy(false);
    updateNavButtons();
  }
}

// History controls
async function goBack() {
  if (historyIndex <= 0) return;
  historyIndex -= 1;
  const u = historyStack[historyIndex];
  await navigate(u, { push: false });
}
async function goForward() {
  if (historyIndex >= historyStack.length - 1) return;
  historyIndex += 1;
  const u = historyStack[historyIndex];
  await navigate(u, { push: false });
}
async function reload() {
  if (historyIndex < 0) return;
  await navigate(historyStack[historyIndex], { push: false });
}

// Wire UI
$("#nav").addEventListener("submit", (e) => {
  e.preventDefault();
  const val = urlBox.value;
  navigate(val);
});
backBtn.addEventListener("click", goBack);
fwdBtn.addEventListener("click", goForward);
reloadBtn.addEventListener("click", reload);

// Start on Google (so users can search without typing a URL)
navigate(HOMEPAGE);
