// muse-cdp.js — send a message to Muse (Bobbi) via the muse.ai chat tab over CDP.
// Usage: node scripts/muse-cdp.js "<message>"
const WebSocket = require('ws');
const http = require('http');

const CHAT_URL = 'https://muse.ai/';
const TAB_ID = '8D1A787E4B6EC1F5367DD13A73F34020';

function findChatTab(cb) {
  http.get('http://127.0.0.1:9222/json/list', res => {
    let d = '';
    res.on('data', c => d += c);
    res.on('end', () => {
      const tabs = JSON.parse(d);
      const chat = tabs.find(t => t.id === TAB_ID) || tabs.find(t => t.url.startsWith('https://muse.ai/') && !t.url.includes('/api/'));
      cb(chat);
    });
  }).on('error', e => { console.error('CDP list error:', e.message); process.exit(1); });
}

function cdp(wsUrl, actions) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(wsUrl, { perMessageDeflate: false, maxPayload: 256 * 1024 * 1024 });
    let id = 0;
    const pending = new Map();
    const send = (method, params) => new Promise(res => {
      const mid = ++id;
      pending.set(mid, res);
      ws.send(JSON.stringify({ id: mid, method, params }));
    });
    ws.on('message', raw => {
      const msg = JSON.parse(raw.toString());
      if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg.result || msg.error); pending.delete(msg.id); }
    });
    ws.on('open', async () => {
      try { await actions(send); ws.close(); resolve(); }
      catch (e) { ws.close(); reject(e); }
    });
    ws.on('error', reject);
  });
}

async function main() {
  const message = process.argv[2];
  findChatTab(async tab => {
    if (!tab) { console.error('Muse chat tab not found'); process.exit(1); }
    console.log('Target: ' + tab.title + ' | ' + tab.url);
    await cdp(tab.webSocketDebuggerUrl, async send => {
      if (message === '--inspect') {
        // Find the composer: input/textarea/contenteditable near the bottom
        const r = await send('Runtime.evaluate', {
          expression: `(() => {
            const els = [...document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]')];
            return JSON.stringify(els.map(e => ({
              tag: e.tagName, type: e.type || '', cls: (e.className || '').toString().slice(0, 80),
              placeholder: e.placeholder || e.getAttribute('data-placeholder') || '',
              visible: e.offsetParent !== null, id: e.id || ''
            })), null, 1);
          })()`, returnByValue: true
        });
        console.log('COMPOSERS: ' + r.result.value);
        return;
      }
      if (!message) { console.error('Usage: node scripts/muse-cdp.js "<message>"'); process.exit(1); }
      // Focus composer, set text via native setter + input event, then Enter.
      const script = `(() => {
        const els = [...document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]')]
          .filter(e => e.offsetParent !== null);
        const el = els[els.length - 1];
        if (!el) return 'NO_COMPOSER';
        el.focus();
        if (el.tagName === 'TEXTAREA' || el.tagName === 'INPUT') {
          const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
          const setter = Object.getOwnPropertyDescriptor(proto, 'value').set;
          setter.call(el, ${JSON.stringify(message)});
          el.dispatchEvent(new Event('input', { bubbles: true }));
          el.dispatchEvent(new Event('change', { bubbles: true }));
        } else {
          el.textContent = ${JSON.stringify(message)};
          el.dispatchEvent(new InputEvent('input', { bubbles: true, data: ${JSON.stringify(message)}, inputType: 'insertText' }));
        }
        return 'TYPED';
      })()`;
      const typed = await send('Runtime.evaluate', { expression: script, returnByValue: true });
      console.log('TYPE: ' + (typed.result ? typed.result.value : JSON.stringify(typed)));
      // Press Enter
      await send('Input.dispatchKeyEvent', { type: 'rawKeyDown', windowsVirtualKeyCode: 13, code: 'Enter', key: 'Enter' });
      await send('Input.dispatchKeyEvent', { type: 'char', windowsVirtualKeyCode: 13, text: '\r' });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', windowsVirtualKeyCode: 13, code: 'Enter', key: 'Enter' });
      console.log('SENT (Enter dispatched)');
    });
  });
}

main().catch(e => { console.error('CDP error:', e.message || e); process.exit(1); });
