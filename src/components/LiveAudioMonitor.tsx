'use client';

// LiveAudioMonitor — compact WebSocket status panel for the dashboard.
// Connects to the standalone live-audio-server.mjs on :8090 and shows
// connection state + rolling message count. Why: the voice/live-audio
// subsystem was running but invisible from the dashboard — operators had
// no way to know whether the WS bridge was healthy without opening a
// terminal. This gives at-a-glance status with a reconnect button.

import { useState, useEffect, useRef, useCallback } from 'react';

const WS_URL = 'ws://localhost:8090';

export default function LiveAudioMonitor() {
  const [status, setStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [messageCount, setMessageCount] = useState(0);
  const [lastMessage, setLastMessage] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const connect = useCallback(() => {
    // Close any existing socket before reconnecting to avoid leaks
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    setStatus('connecting');

    try {
      const ws = new WebSocket(WS_URL);
      wsRef.current = ws;

      ws.onopen = () => setStatus('connected');

      ws.onmessage = (event) => {
        setMessageCount((c) => c + 1);
        // Keep only a short preview of the last payload
        const raw = typeof event.data === 'string' ? event.data : JSON.stringify(event.data);
        setLastMessage(raw.slice(0, 80));
      };

      ws.onclose = () => {
        setStatus('disconnected');
        // Auto-reconnect every 10 seconds — the WS server may restart
        reconnectTimer.current = setTimeout(connect, 10_000);
      };

      ws.onerror = () => {
        // onerror is always followed by onclose, so just mark state
        setStatus('disconnected');
      };
    } catch {
      setStatus('disconnected');
    }
  }, []);

  useEffect(() => {
    connect();
    return () => {
      if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, [connect]);

  const statusColor =
    status === 'connected'
      ? 'text-green-500'
      : status === 'connecting'
        ? 'text-yellow-500'
        : 'text-red-500';

  const statusDot =
    status === 'connected'
      ? 'bg-green-500'
      : status === 'connecting'
        ? 'bg-yellow-500 animate-pulse'
        : 'bg-red-500';

  return (
    <div className="bg-background border border-border rounded-xl p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={'w-2 h-2 rounded-full ' + statusDot} />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
            Live Audio WS
          </span>
        </div>
        <button
          onClick={connect}
          className="text-xs text-secondary hover:underline font-medium"
          aria-label="Reconnect to live audio WebSocket"
        >
          Reconnect
        </button>
      </div>

      <div className="flex items-baseline gap-2">
        <span className={'text-sm font-bold ' + statusColor}>
          {status === 'connected' ? 'Connected' : status === 'connecting' ? 'Connecting...' : 'Disconnected'}
        </span>
        <span className="text-xs text-muted-foreground">
          {messageCount > 0 ? messageCount + ' msgs' : 'port 8090'}
        </span>
      </div>

      {lastMessage && (
        <p className="text-xs text-muted-foreground font-mono truncate" title={lastMessage}>
          {lastMessage}
        </p>
      )}
    </div>
  );
}
