const WebSocket = require('ws');
const http = require('http');
http.get('http://127.0.0.1:9222/json/list', res => {
  let d = ''; res.on('data', c => d += c);
  res.on('end', () => {
    const tab = JSON.parse(d).find(t => t.url.startsWith('https://muse.ai/') && !t.url.includes('/api/'));
    if (!tab) { console.log('NO_CHAT_TAB'); return; }
    const ws = new WebSocket(tab.webSocketDebuggerUrl, { perMessageDeflate: false, maxPayload: 256*1024*1024 });
    let id = 0; const pending = new Map();
    const send = (m, p) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method: m, params: p })); });
    ws.on('message', raw => { const m = JSON.parse(raw.toString()); if (m.id && pending.has(m.id)) { pending.get(m.id)(m.result); pending.delete(m.id); } });
    ws.on('open', async () => {
      const r = await send('Runtime.evaluate', {
        expression: `JSON.stringify([...document.querySelectorAll('div, p, span')]
          .filter(e => e.children.length === 0 && e.textContent.trim().length > 30 && e.offsetParent !== null)
          .slice(-30).map(e => e.textContent.trim().slice(0, 320)))`,
        returnByValue: true
      });
      console.log('RECENT_CHAT:'); console.log(JSON.parse(r.result.value).join('\n---\n'));
      ws.close();
    });
  });
});

