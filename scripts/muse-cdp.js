// muse-cdp.js — send a message to Muse (Bobbi) via the muse.ai chat tab over CDP.
// Usage: node scripts/muse-cdp.js "<message>" | --inspect | --list
const WebSocket = require('ws');
const http = require('http');

const CDP_HOST = process.env.MUSE_CDP_HOST || '127.0.0.1';
const CDP_PORT = Number(process.env.MUSE_CDP_PORT || 9222);
const CHAT_URL = 'https://muse.ai/';
const TAB_ID_OVERRIDE = process.env.MUSE_CDP_TAB_ID || null;
const OPEN_TIMEOUT_MS = 10000;
const SEND_TIMEOUT_MS = 15000;
const OVERALL_TIMEOUT_MS = 30000;

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
    req.setTimeout(8000, () => req.destroy(new Error('CDP list timeout after 8s')));
  });
}

function pickChatTab(tabs) {
  if (TAB_ID_OVERRIDE) {
    const t = tabs.find(t => t.id === TAB_ID_OVERRIDE);
    if (t) return t;
    console.error(`TAB override ${TAB_ID_OVERRIDE} not found, falling back to URL match`);
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
      for (const [, res] of pending) res(Promise.reject(err));
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
        pending.set(mid, value => {
          clearTimeout(timer);
          res(value);
        });
        ws.send(JSON.stringify({ id: mid, method, params }), err => {
          if (err) {
            clearTimeout(timer);
            pending.delete(mid);
            rej(err);
          }
        });
      });
    const openTimer = setTimeout(() => {
      try { ws.close(); } catch (e) { /* ignore */ }
      done(reject, new Error(`CDP ws open timed out after ${OPEN_TIMEOUT_MS}ms: ${wsUrl}`));
    }, OPEN_TIMEOUT_MS);
    const overallTimer = setTimeout(() => {
      try { ws.close(); } catch (e) { /* ignore */ }
      failPending(new Error(`CDP overall timeout after ${OVERALL_TIMEOUT_MS}ms`));
      done(reject, new Error(`CDP overall timeout after ${OVERALL_TIMEOUT_MS}ms`));
    }, OVERALL_TIMEOUT_MS);
    ws.on('message', raw => {
      let msg;
      try {
        msg = JSON.parse(raw.toString());
      } catch (e) {
        return;
      }
      if (msg.id && pending.has(msg.id)) {
        const res = pending.get(msg.id);
        pending.delete(msg.id);
        if (msg.error) res(Promise.reject(new Error(JSON.stringify(msg.error))));
        else res(msg.result);
      }
    });
    ws.on('open', async () => {
      clearTimeout(openTimer);
      try {
        await actions(send);
        ws.close();
        done(resolve);
      } catch (e) {
        try { ws.close(); } catch (closeErr) { /* ignore */ }
        done(reject, e);
      }
    });
    ws.on('error', e => {
      failPending(e);
      done(reject, e);
    });
    ws.on('close', () => {
      if (!settled && pending.size > 0) {
        failPending(new Error('CDP ws closed with pending requests'));
        done(reject, new Error('CDP ws closed with pending requests'));
      }
    });
  });
}

async function main() {
  const arg = process.argv[2];
  let tabs;
  try {
    tabs = await cdpList();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
  if (arg === '--list') {
    console.log(`TABS: ${tabs.length}`);
    for (const t of tabs) console.log(`${t.id} | ${t.title} | ${t.url}`);
    process.exit(0);
  }
  const tab = pickChatTab(tabs);
  const museCands = tabs.filter(
    t => typeof t.url === 'string' && t.url.startsWith(CHAT_URL) && !t.url.includes('/api/')
  );
  console.log(`CDP tabs: ${tabs.length}, muse.ai candidates: ${museCands.length}`);
  if (!tab) {
    console.error('Muse chat tab not found');
    process.exit(1);
  }
  console.log(`Target: ${tab.title} | ${tab.url} | id=${tab.id}`);
  try {
    await cdp(tab.webSocketDebuggerUrl, async send => {
      try {
        await send('Page.bringToFront', {});
      } catch (e) { /* non-fatal */ }
      await new Promise(r => setTimeout(r, 800));
      if (arg === '--inspect') {
        const r = await send('Runtime.evaluate', {
          expression: `(() => {
            const els = [...document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]')];
            return JSON.stringify(els.map(e => ({
              tag: e.tagName, type: e.type || '', cls: (e.className || '').toString().slice(0, 80),
              placeholder: e.placeholder || e.getAttribute('data-placeholder') || '',
              visible: e.offsetParent !== null, id: e.id || ''
            })), null, 1);
          })()`,
          returnByValue: true,
        });
        console.log(`COMPOSERS: ${r.result.value}`);
        return;
      }
      if (!arg) {
        console.error('Usage: node scripts/muse-cdp.js "<message>"');
        process.exit(1);
      }
      const script = `(() => {
        const els = [...document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]')]
          .filter(e => e.offsetParent !== null);
        const el = els[els.length - 1];
        if (!el) return 'NO_COMPOSER';
        el.focus();
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, ${JSON.stringify(arg)});
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          el.textContent = ${JSON.stringify(arg)};
          el.dispatchEvent(new InputEvent('input', { bubbles: true, data: ${JSON.stringify(arg)}, inputType: 'insertText' }));
        }
        return 'TYPED';
      })()`;
      const typed = await send('Runtime.evaluate', { expression: script, returnByValue: true });
      const typedVal = typed && typed.result ? typed.result.value : JSON.stringify(typed);
      console.log(`TYPE: ${typedVal}`);
      if (typedVal !== 'TYPED') process.exitCode = 1;
      else {
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
