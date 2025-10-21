import { bareFetch } from "./transport.js";

const $ = (s) => document.querySelector(s);
const view = $("#view");
const urlBox = $("#url");
const spinner = $("#spinner");
const backBtn = $("#back");
const fwdBtn = $("#forward");
const reloadBtn = $("#reload");
const schemeEl = $("#scheme");

// Very simple in-memory history for the session
const historyStack = [];
let historyIndex = -1;
let currentUrl = "";

// Normalize user input into a full https:// URL
function normalizeInput(val) {
  val = (val || "").trim();
  if (!val) return "";
  try {
    // If it already looks like a URL with a scheme, trust it
    const u = new URL(val);
    return u.href;
  } catch {
    // If user typed "example.com", assume https://
    return `https://${val}`;
  }
}

// Update UI state
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

// Render HTML into the iframe using a Blob URL
async function renderViaBlob(html) {
  const blob = new Blob([html], { type: "text/html" });
  const blobUrl = URL.createObjectURL(blob);
  // Load it
  view.src = blobUrl;
  // Revoke once loaded to free memory
  await new Promise((res) => {
    const onload = () => { view.removeEventListener("load", onload); res(); };
    view.addEventListener("load", onload);
  });
  setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
}

// Minimal HTML rewrite: inject <base> so some relative links resolve,
// and add <meta name=referrer content=no-referrer> for privacy.
// (Note: many assets still won't load due to CSP; this is a light client-side viewer.)
function rewriteHtml(html, baseHref) {
  let output = html;
  const hasHead = /<head[^>]*>/i.test(output);
  const baseTag = `<base href="${baseHref}">`;
  const refMeta = `<meta name="referrer" content="no-referrer">`;
  const charset = `<meta charset="utf-8">`;

  if (hasHead) {
    output = output.replace(/<head[^>]*>/i, match => `${match}\n${charset}\n${baseTag}\n${refMeta}`);
  } else {
    output = `<!doctype html><head>${charset}${baseTag}${refMeta}</head>${output}`;
  }
  return output;
}

// Navigate (push into history)
async function navigate(inputValue, { push = true } = {}) {
  const href = normalizeInput(inputValue);
  if (!href) return;
  setBusy(true);
  try {
    const res = await bareFetch(href, { method: "GET" });
    const txt = await res.text();
    const html = rewriteHtml(txt, href);

    await renderViaBlob(html);

    currentUrl = href;
    updateAddressBar(currentUrl);

    if (push) {
      // Trim forward history
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

// History navigation
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
  const val = urlBox.value.trim();
  navigate(val);
});
backBtn.addEventListener("click", goBack);
fwdBtn.addEventListener("click", goForward);
reloadBtn.addEventListener("click", reload);

// Initial page
navigate("https://google.com");
