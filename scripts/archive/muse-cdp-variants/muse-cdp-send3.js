const WebSocket = require("ws");
const http = require("http");
const TAB = process.env.MUSE_CDP_TAB_ID;
const MSG = process.env.MUSE_CDP_MSG;
function list() { return new Promise(function(res, rej) { const r = http.get("http://127.0.0.1:9222/json/list", function(s) { let d = ""; s.on("data", function(c) { d += c; }); s.on("end", function() { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }); r.on("error", rej); r.setTimeout(8000, function() { r.destroy(new Error("timeout")); }); }); }
async function main() {
if (!MSG) { console.error("MUSE_CDP_MSG empty"); process.exit(1); }
const tabs = await list();
const t = tabs.find(function(x) { return x.id === TAB; });
if (!t) { console.error("TAB NOT FOUND " + TAB); process.exit(1); }
console.log("SEND3 Target: " + t.title);
const ws = new WebSocket(t.webSocketDebuggerUrl, { perMessageDeflate: false });
let id = 0; const pen = new Map();
ws.on("message", function(m) { try { const o = JSON.parse(m.toString()); if (o.id && pen.has(o.id)) { const f = pen.get(o.id); pen.delete(o.id); f(o); } } catch (e) {} });
await new Promise(function(ok, no) { ws.on("open", ok); ws.on("error", no); setTimeout(function() { no(new Error("ws open timeout")); }, 30000); });
function send(m, p, to) { return new Promise(function(ok, no) { const mid = ++id; const tmr = setTimeout(function() { pen.delete(mid); no(new Error(m + " timeout")); }, to || 90000); pen.set(mid, function(v) { clearTimeout(tmr); if (v.error) { no(new Error(JSON.stringify(v.error))); } else { ok(v.result); } }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }
try {
try { await send("Page.bringToFront", {}, 15000); } catch (e) { console.log("BRINGFAIL: " + (e.message || e)); }
const doc = await send("DOM.getDocument", { depth: 0 }, 90000);
const root = doc.root.nodeId;
console.log("ROOT: " + root);
const sels = ["div[contenteditable]", "textarea", "input[type=text]"];
let nodeId = 0; let usedSel = "";
for (const sel of sels) { try { const q = await send("DOM.querySelector", { nodeId: root, selector: sel }, 30000); if (q && q.nodeId) { nodeId = q.nodeId; usedSel = sel; break; } } catch (e) { console.log("QFAIL " + sel + ": " + (e.message || e)); } }
if (!nodeId) { console.log("TYPE: NO_COMPOSER"); }
else { console.log("FOUND: " + usedSel + " node " + nodeId); await send("DOM.focus", { nodeId: nodeId }, 30000); await send("Input.insertText", { text: MSG }, 30000); console.log("TYPE: INSERTED via " + usedSel); }
await send("Input.dispatchKeyEvent", { type: "rawKeyDown", windowsVirtualKeyCode: 13, code: "Enter", key: "Enter" }, 30000);
await send("Input.dispatchKeyEvent", { type: "char", windowsVirtualKeyCode: 13, text: "X" }, 30000);
await send("Input.dispatchKeyEvent", { type: "keyUp", windowsVirtualKeyCode: 13, code: "Enter", key: "Enter" }, 30000);
console.log("SENT (Enter)");
} catch (e) { console.error("CDP error: " + (e.message || e)); process.exitCode = 1; }
try { ws.close(); } catch (e) {}
process.exit(process.exitCode || 0);
}
main().catch(function(e) { console.error("CDP error: " + (e.message || e)); process.exit(1); });

