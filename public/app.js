import { BareClient } from "https://esm.sh/@mercuryworkshop/bare-mux@2?bundle";
import { connect as wispConnect } from "https://esm.sh/@mercuryworkshop/epoxy-transport@2?bundle";

const qs = (s) => document.querySelector(s);
const logEl = qs("#log");

function log(line) {
  logEl.textContent += (line + "\n");
  logEl.scrollTop = logEl.scrollHeight;
}

function saveCfg() {
  const bare = qs("#bareUrl").value.trim();
  const wisp = qs("#wispUrl").value.trim();
  localStorage.setItem("cfg.bare", bare);
  localStorage.setItem("cfg.wisp", wisp);
  log("Saved config.");
}

function loadCfg() {
  qs("#bareUrl").value = localStorage.getItem("cfg.bare") || "";
  qs("#wispUrl").value = localStorage.getItem("cfg.wisp") || "";
  log("Loaded saved config.");
}

function clearCfg() {
  localStorage.removeItem("cfg.bare");
  localStorage.removeItem("cfg.wisp");
  log("Cleared saved config.");
}

function prefill() {
  qs("#bareUrl").value = "https://bare-transport.jcullenr1236496.workers.dev/";
  qs("#wispUrl").value = "wss://voiceless-dorry-nothinggames-cd908596.koyeb.app/";
  log("Prefilled endpoints.");
}

async function testBare() {
  log("Testing Bare...");
  const bareUrl = qs("#bareUrl").value.trim();
  const target = qs("#testUrl").value.trim() || "https://example.com";
  if (!bareUrl) return log("Set BARE_URL first.");
  try {
    const base = bareUrl.endsWith("/") ? bareUrl : bareUrl + "/";
    const bare = new BareClient(base);
    const res = await bare.fetch(target, { method: "GET" });
    log(`Bare status: ${res.status} ${res.statusText}`);
    const text = await res.text();
    log(`Bare body length: ${text.length}`);
  } catch (e) {
    log(`Bare error: ${e.message || e}`);
  }
}

async function testWisp() {
  log("Testing Wisp...");
  const wispUrl = qs("#wispUrl").value.trim();
  if (!wispUrl) return log("Set WISP_URL first.");
  try {
    const ws = await wispConnect(wispUrl);
    log("Wisp WebSocket: connected");
    ws.close();
    log("Wisp WebSocket: closed");
  } catch (e) {
    log(`Wisp error: ${e.message || e}`);
  }
}

async function openViaBare() {
  const bareUrl = qs("#bareUrl").value.trim();
  const target = qs("#openUrl").value.trim();
  if (!bareUrl || !target) {
    log("Enter BARE_URL and a URL to open.");
    return;
  }
  try {
    const base = bareUrl.endsWith("/") ? bareUrl : bareUrl + "/";
    const bare = new BareClient(base);
    const res = await bare.fetch(target, { method: "GET" });
    const html = await res.text();
    const blob = new Blob([html], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    qs("#viewer").src = url;
    log(`Opened ${target} via Bare`);
  } catch (e) {
    log(`Open error: ${e.message || e}`);
  }
}

qs("#saveCfg").addEventListener("click", saveCfg);
qs("#loadCfg").addEventListener("click", loadCfg);
qs("#clearCfg").addEventListener("click", clearCfg);
qs("#prefill").addEventListener("click", prefill);
qs("#testBare").addEventListener("click", testBare);
qs("#testWisp").addEventListener("click", testWisp);
qs("#openBtn").addEventListener("click", openViaBare);

loadCfg();
