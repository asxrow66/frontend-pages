import { bareFetch } from "./transport.js";

const $ = (s) => document.querySelector(s);
const view = $("#view");
const urlBox = $("#url");
const spinner = $("#spinner");
const backBtn = $("#back");
const fwdBtn = $("#forward");
const reloadBtn = $("#reload");

// Simple session history
const historyStack = [];
let historyIndex = -1;
let currentUrl = "";

// Search engine + homepage
const SEARCH_BASE = "https://www.google.com/search?q=";
const HOMEPAGE = "https://www.google.com/";

// --- Omnibox helpers ---

function isLikelyUrl(input) {
  const s = input.trim();
  if (!s) return false;
  try {
    const u = new URL(s); // explicit scheme -> URL
    return !!u.protocol;
  } catch {}
  if (/\s/.test(s)) return false; // spaces => search
  if (s.includes(".") || s.startsWith("localhost") || s.includes("/")) return true;
  return false;
}

function toUrlOrSearch(input) {
  const s = (input || "").trim();
  if (!s) return HOMEPAGE;
  if (isLikelyUrl(s)) {
    if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(s)) return s;
    return `https://${s}`;
  }
  return SEARCH_BASE + encodeURIComponent(s);
}

// --- UI/State ---

function setBusy(b) { spinner.classList.toggle("active", !!b); }

function updateNavButtons() {
  backBtn.disabled = !(historyIndex > 0);
  fwdBtn.disabled = !(historyIndex >= 0 && historyIndex < historyStack.length - 1);
  reloadBtn.disabled = !(historyIndex >= 0);
}

// Show URL without the scheme in the box
function updateAddressBar(u) {
  try {
    const p = new URL(u);
    urlBox.value = p.host + p.pathname + p.search + p.hash;
  } catch {
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
  navigate(urlBox.value);
});
backBtn.addEventListener("click", goBack);
fwdBtn.addEventListener("click", goForward);
reloadBtn.addEventListener("click", reload);

// Start on Google so it works as a search bar immediately
navigate(HOMEPAGE);
