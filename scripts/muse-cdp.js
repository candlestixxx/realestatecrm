// muse-cdp.js — unified Muse (Bobbi) & browser-tab coordinator over Edge CDP (:9222).
// Consolidates muse-cdp-nav/read/read2/read3/resume/send2/send3/wide (archived in scripts/archive/muse-cdp-variants/).
//
// Usage:
//   node scripts/muse-cdp.js --list
//   node scripts/muse-cdp.js --read [chars] [--tab <id>]
//   node scripts/muse-cdp.js --inspect [--tab <id>]
//   node scripts/muse-cdp.js --nav <url> [--tab <id>]
//   node scripts/muse-cdp.js "<message>" [--tab <id>]

const WebSocket = require('ws');
const http = require('http');

const CDP_HOST = process.env.MUSE_CDP_HOST || '127.0.0.1';
const CDP_PORT = Number(process.env.MUSE_CDP_PORT || 9222);
const CHAT_URL = 'https://muse.ai/';
const OPEN_TIMEOUT_MS = 30000;
const SEND_TIMEOUT_MS = 60000;
const OVERALL_TIMEOUT_MS = 120000;

function parseArgs(argv) {
  const args = argv.slice(2);
  let tabId = process.env.MUSE_CDP_TAB_ID || null;
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--tab' && args[i + 1]) {
      tabId = args[++i];
    } else {
      positional.push(args[i]);
    }
  }
  return { tabId, positional };
}

function cdpList() {
  return new Promise((resolve, reject) => {
    const req = http.get(`http://${CDP_HOST}:${CDP_PORT}/json/list`, res => {
      let d = '';
      res.on('data', c => { d += c; });
      res.on('end', () => {
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`CDP list HTTP ${res.statusCode}`));
          return;
        }
        try {
          resolve(JSON.parse(d));
        } catch (e) {
          reject(new Error(`CDP list JSON parse failed: ${e.message}`));
        }
      });
    });
    req.on('error', e => reject(new Error(`CDP list error: ${e.message}`)));
    req.setTimeout(30000, () => req.destroy(new Error('CDP list timeout after 30s')));
  });
}

function pickChatTab(tabs, tabIdOverride) {
  if (tabIdOverride) {
    const t = tabs.find(t => t.id === tabIdOverride || t.id.startsWith(tabIdOverride));
    if (t) return t;
    console.error(`TAB override ${tabIdOverride} not found, falling back to URL match`);
  }
  const cands = tabs.filter(
    t => typeof t.url === 'string' && t.url.startsWith(CHAT_URL) && !t.url.includes('/api/')
  );
  if (cands.length === 0) return null;
  const named = cands.find(t => /bobbi|chat/i.test(t.title || ''));
  return named || cands[cands.length - 1];
}

function cdp(wsUrl, actions) {
  return new Promise((resolve, reject) => {
    let settled = false;
    const done = (fn, val) => {
      if (settled) return;
      settled = true;
      clearTimeout(openTimer);
      clearTimeout(overallTimer);
      fn(val);
    };
    const ws = new WebSocket(wsUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
    let id = 0;
    const pending = new Map();
    const failPending = err => {
      for (const [, rej] of pending) rej(err);
      pending.clear();
    };
    const send = (method, params, timeoutMs = SEND_TIMEOUT_MS) =>
      new Promise((res, rej) => {
        const mid = ++id;
        const timer = setTimeout(() => {
          if (pending.has(mid)) {
            pending.delete(mid);
            rej(new Error(`${method} timed out after ${timeoutMs}ms`));
          }
        }, timeoutMs);
        pending.set(
          mid,
          errOrNull => {
            clearTimeout(timer);
            if (errOrNull instanceof Error) rej(errOrNull);
            else res(errOrNull);
          }
        );
        ws.send(JSON.stringify({ id: mid, method, params }), err => {
          if (err) {
            clearTimeout(timer);
            pending.delete(mid);
            rej(err);
          }
        });
      });

    const openTimer = setTimeout(() => {
      try { ws.close(); } catch { /* ignore */ }
      done(reject, new Error(`CDP ws open timed out after ${OPEN_TIMEOUT_MS}ms: ${wsUrl}`));
    }, OPEN_TIMEOUT_MS);

    const overallTimer = setTimeout(() => {
      try { ws.close(); } catch { /* ignore */ }
      const err = new Error(`CDP overall timeout after ${OVERALL_TIMEOUT_MS}ms`);
      failPending(err);
      done(reject, err);
    }, OVERALL_TIMEOUT_MS);

    ws.on('message', raw => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch {
        return;
      }
      if (msg.id && pending.has(msg.id)) {
        const cb = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) cb(new Error(JSON.stringify(msg.error)));
        else cb(msg.result);
      }
    });

    ws.on('open', async () => {
      clearTimeout(openTimer);
      try {
        await actions(send);
        ws.close();
        done(resolve);
      } catch (e) {
        try { ws.close(); } catch { /* ignore */ }
        done(reject, e);
      }
    });
    ws.on('error', e => {
      failPending(e);
      done(reject, e);
    });
    ws.on('close', () => {
      if (!settled && pending.size > 0) {
        const err = new Error('CDP ws closed with pending requests');
        failPending(err);
        done(reject, err);
      }
    });
  });
}

async function main() {
  const { tabId, positional } = parseArgs(process.argv);
  const cmd = positional[0];
  let tabs;
  try {
    tabs = await cdpList();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }

  if (cmd === '--list') {
    console.log(`TABS: ${tabs.length}`);
    for (const t of tabs) console.log(`${t.id} | ${t.title} | ${t.url}`);
    process.exit(0);
  }

  const tab = pickChatTab(tabs, tabId);
  const museCands = tabs.filter(
    t => typeof t.url === 'string' && t.url.startsWith(CHAT_URL) && !t.url.includes('/api/')
  );
  console.log(`CDP tabs: ${tabs.length}, muse.ai candidates: ${museCands.length}`);
  if (!tab) {
    console.error('Target tab not found');
    process.exit(1);
  }
  console.log(`Target: ${tab.title} | ${tab.url} | id=${tab.id}`);

  try {
    await cdp(tab.webSocketDebuggerUrl, async send => {
      try {
        await send('Page.bringToFront', {}, 15000);
      } catch { /* non-fatal */ }
      await new Promise(r => setTimeout(r, 600));

      if (cmd === '--nav') {
        const url = positional[1] || process.env.MUSE_CDP_URL || CHAT_URL;
        await send('Page.navigate', { url }, 30000);
        console.log(`NAVIGATED: ${url}`);
        return;
      }

      if (cmd === '--read') {
        const maxChars = Number(positional[1] || 8000);
        // Use innerText (not textContent) so Next.js RSC script payloads are excluded.
        const r = await send('Runtime.evaluate', {
          expression: `(() => {
            const frames = [...document.querySelectorAll('iframe')].map(f => {
              try { return f.contentDocument?.body?.innerText || ''; } catch { return ''; }
            }).filter(Boolean).join('\\n---IFRAME---\\n');
            const body = (document.body && document.body.innerText) ? document.body.innerText : '';
            const combined = [document.title, body, frames].filter(Boolean).join('\\n');
            return combined.slice(-${maxChars});
          })()`,
          returnByValue: true,
        });
        console.log('TEXT-BEGIN');
        console.log(r && r.result ? r.result.value : JSON.stringify(r));
        console.log('TEXT-END');
        return;
      }

      if (cmd === '--inspect') {
        const r = await send('Runtime.evaluate', {
          expression: `(() => {
            const els = [...document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"], [role="textbox"]')];
            return JSON.stringify(els.map(e => ({
              tag: e.tagName, type: e.type || '', role: e.getAttribute('role') || '',
              cls: (e.className || '').toString().slice(0, 80),
              placeholder: e.placeholder || e.getAttribute('data-placeholder') || e.getAttribute('aria-label') || '',
              visible: e.offsetParent !== null, id: e.id || ''
            })), null, 1);
          })()`,
          returnByValue: true,
        });
        console.log(`COMPOSERS: ${r.result.value}`);
        return;
      }

      const msg = cmd || process.env.MUSE_CDP_MSG;
      if (!msg) {
        console.error('Usage: node scripts/muse-cdp.js "<message>" | --list | --read [chars] | --inspect | --nav <url>');
        process.exit(1);
      }

      const script = `(() => {
        const els = [...document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"], [role="textbox"]')]
          .filter(e => e.offsetParent !== null);
        const el = els[els.length - 1];
        if (!el) return 'NO_COMPOSER';
        el.focus();
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, ${JSON.stringify(msg)});
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          el.textContent = ${JSON.stringify(msg)};
          el.dispatchEvent(new InputEvent('input', { bubbles: true, data: ${JSON.stringify(msg)}, inputType: 'insertText' }));
        }
        return 'TYPED';
      })()`;

      const typed = await send('Runtime.evaluate', { expression: script, returnByValue: true });
      let typedVal = typed && typed.result ? typed.result.value : 'NO_COMPOSER';

      // Fallback via CDP DOM.focus + Input.insertText for shadow/Lexical/ProseMirror editors
      if (typedVal !== 'TYPED') {
        const doc = await send('DOM.getDocument', { depth: 0 }, 60000);
        const sels = ['[role="textbox"]', 'div[contenteditable="true"]', 'div[contenteditable]', 'textarea', 'input[type="text"]'];
        for (const sel of sels) {
          try {
            const q = await send('DOM.querySelector', { nodeId: doc.root.nodeId, selector: sel }, 20000);
            if (q && q.nodeId) {
              await send('DOM.focus', { nodeId: q.nodeId }, 20000);
              await send('Input.insertText', { text: msg }, 30000);
              typedVal = 'TYPED';
              break;
            }
          } catch { /* try next selector */ }
        }
      }

      console.log(`TYPE: ${typedVal}`);
      if (typedVal !== 'TYPED') {
        process.exitCode = 1;
      } else {
        await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, code: 'Enter', key: 'Enter' });
        await send('Input.dispatchKeyEvent', { type: 'char', windowsVirtualKeyCode: 13, text: '\r' });
        await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, code: 'Enter', key: 'Enter' });
        console.log('SENT (Enter dispatched)');
      }
    });
  } catch (e) {
    console.error(`CDP error: ${e.message || e}`);
    process.exit(1);
  }
  process.exit(process.exitCode || 0);
}

main().catch(e => {
  console.error(`CDP error: ${e.message || e}`);
  process.exit(1);
});
