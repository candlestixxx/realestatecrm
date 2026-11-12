const WebSocket = require("ws");
const http = require("http");
const TAB = process.env.MUSE_CDP_TAB_ID;
function list() { return new Promise(function(res, rej) { const r = http.get("http://127.0.0.1:9222/json/list", function(s) { let d = ""; s.on("data", function(c) { d += c; }); s.on("end", function() { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }); r.on("error", rej); r.setTimeout(8000, function() { r.destroy(new Error("timeout")); }); }); }
async function main() {
const tabs = await list();
const t = tabs.find(function(x) { return x.id === TAB; });
if (!t) { console.error("TAB NOT FOUND " + TAB); process.exit(1); }
console.log("RESUME Target: " + t.title);
const ws = new WebSocket(t.webSocketDebuggerUrl, { perMessageDeflate: false });
let id = 0; const pen = new Map();
ws.on("message", function(m) { try { const o = JSON.parse(m.toString()); if (o.id && pen.has(o.id)) { const f = pen.get(o.id); pen.delete(o.id); f(o); } else if (o.method) { console.log("EVENT: " + o.method); } } catch (e) {} });
await new Promise(function(ok, no) { ws.on("open", ok); ws.on("error", no); setTimeout(function() { no(new Error("ws open timeout")); }, 30000); });
function send(m, p, to) { return new Promise(function(ok, no) { const mid = ++id; const tmr = setTimeout(function() { pen.delete(mid); no(new Error(m + " timeout")); }, to || 20000); pen.set(mid, function(v) { clearTimeout(tmr); if (v.error) { no(new Error(m + " ERR " + JSON.stringify(v.error))); } else { ok(v.result); } }); ws.send(JSON.stringify({ id: mid, method: m, params: p })); }); }
try {
try { const d = await send("Debugger.enable", {}, 20000); console.log("DBG_ENABLE_OK"); } catch (e) { console.log("DBG_ENABLE: " + (e.message || e)); }
try { await send("Debugger.resume", {}, 20000); console.log("RESUME_OK"); } catch (e) { console.log("RESUME: " + (e.message || e)); }
try { await send("Runtime.runIfWaitingForDebugger", {}, 20000); console.log("RUNIF_OK"); } catch (e) { console.log("RUNIF: " + (e.message || e)); }
try { const r = await send("Runtime.evaluate", { expression: "1+1", returnByValue: true }, 20000); console.log("EVAL_OK: " + JSON.stringify(r)); } catch (e) { console.log("EVAL: " + (e.message || e)); }
} catch (e) { console.error("CDP error: " + (e.message || e)); process.exitCode = 1; }
try { ws.close(); } catch (e) {}
process.exit(process.exitCode || 0);
}
main().catch(function(e) { console.error("CDP error: " + (e.message || e)); process.exit(1); });
