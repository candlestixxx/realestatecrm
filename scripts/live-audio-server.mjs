/**
 * Live Audio Stream Server (WebSocket)
 * Standalone WebSocket server for Twilio Media Streams live monitoring.
 * Run alongside Next.js: node scripts/live-audio-server.mjs
 *
 * Handles:
 * - Twilio Media Stream connections (bidirectional audio)
 * - Manager monitoring connections (listen-only)
 * - Call event broadcasting
 */
import { WebSocketServer, WebSocket } from 'ws';
import { createServer } from 'http';

const PORT = parseInt(process.env.LIVE_AUDIO_PORT || '8090');

// Track active calls and their audio streams.
// NOTE: this file is .mjs (ESM JavaScript) — TypeScript type annotations are
// stripped because `interface` is a strict-mode reserved word in ESM and
// Node's ESM loader rejects it at parse time (SyntaxError).
const activeCalls = new Map();

const httpServer = createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', activeCalls: activeCalls.size }));
    return;
  }
  res.writeHead(404);
  res.end();
});

const wss = new WebSocketServer({ server: httpServer });

wss.on('connection', (ws, req) => {
  const url = new URL(req.url || '/', `http://localhost:${PORT}`);
  const role = url.searchParams.get('role'); // 'twilio' | 'monitor'
  const callSid = url.searchParams.get('callSid');
  const agentId = url.searchParams.get('agentId');

  console.log(`[LiveAudio] Connection: role=${role} callSid=${callSid}`);

  if (role === 'twilio' && callSid) {
    // Twilio Media Stream connection
    const stream = {
      callSid,
      agentId: agentId || 'unknown',
      twilioSocket: ws,
      monitors: new Set(),
      startTime: Date.now(),
    };
    activeCalls.set(callSid, stream);

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());

        switch (msg.event) {
          case 'connected':
            console.log(`[LiveAudio] Twilio stream connected for ${callSid}`);
            broadcastToMonitors(callSid, { event: 'stream_started', callSid });
            break;

          case 'media':
            // Forward audio payload to all monitors
            if (msg.media && msg.media.payload) {
              broadcastToMonitors(callSid, {
                event: 'audio',
                callSid,
                payload: msg.media.payload,
                track: msg.media.track,
                timestamp: msg.media.timestamp,
              });
            }
            break;

          case 'stop':
            console.log(`[LiveAudio] Twilio stream stopped for ${callSid}`);
            broadcastToMonitors(callSid, { event: 'stream_ended', callSid, duration: Date.now() - stream.startTime });
            activeCalls.delete(callSid);
            break;

          case 'mark':
            broadcastToMonitors(callSid, { event: 'mark', callSid, name: msg.mark?.name });
            break;
        }
      } catch (e) {
        console.error('[LiveAudio] Error parsing Twilio message:', e);
      }
    });

    ws.on('close', () => {
      console.log(`[LiveAudio] Twilio stream closed for ${callSid}`);
      broadcastToMonitors(callSid, { event: 'stream_ended', callSid });
      activeCalls.delete(callSid);
    });

  } else if (role === 'monitor') {
    // Manager monitoring connection (listen-only)
    if (!callSid || !activeCalls.has(callSid)) {
      ws.send(JSON.stringify({ event: 'error', message: 'Call not found or not active' }));
      ws.close();
      return;
    }

    const stream = activeCalls.get(callSid);
    stream.monitors.add(ws);

    ws.send(JSON.stringify({
      event: 'monitor_connected',
      callSid,
      agentId: stream.agentId,
      duration: Date.now() - stream.startTime,
    }));

    ws.on('message', (data) => {
      try {
        const msg = JSON.parse(data.toString());
        if (msg.event === 'barge_in' && stream.twilioSocket) {
          // Forward barge-in signal to Twilio
          stream.twilioSocket.send(JSON.stringify({
            event: 'customParameters',
            parameters: { barge_in: 'true' },
          }));
        }
      } catch (e) {
        console.error('[LiveAudio] Error parsing monitor message:', e);
      }
    });

    ws.on('close', () => {
      stream.monitors.delete(ws);
    });

  } else {
    // List active calls
    ws.send(JSON.stringify({
      event: 'call_list',
      calls: Array.from(activeCalls.values()).map(c => ({
        callSid: c.callSid,
        agentId: c.agentId,
        duration: Date.now() - c.startTime,
        monitors: c.monitors.size,
      })),
    }));
    ws.close();
  }
});

function broadcastToMonitors(callSid, message) {
  const stream = activeCalls.get(callSid);
  if (!stream) return;
  const payload = JSON.stringify(message);
  stream.monitors.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload);
    }
  });
}

httpServer.listen(PORT, () => {
  console.log(`[LiveAudio] WebSocket server listening on port ${PORT}`);
  console.log(`[LiveAudio] Health check: http://localhost:${PORT}/health`);
  console.log(`[LiveAudio] Twilio stream: ws://localhost:${PORT}/?role=twilio&callSid=XXX`);
  console.log(`[LiveAudio] Monitor: ws://localhost:${PORT}/?role=monitor&callSid=XXX`);
});
