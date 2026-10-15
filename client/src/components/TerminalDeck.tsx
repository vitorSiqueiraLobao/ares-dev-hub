import React, { useEffect, useRef, useState } from 'react';
import { Terminal as Xterm } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { Play, RotateCcw, TerminalSquare } from 'lucide-react';

interface TerminalDeckProps {
  sessionId?: string;
  defaultCommand?: string;
}

export const TerminalDeck: React.FC<TerminalDeckProps> = ({
  sessionId = 'ares_terminal_1',
  defaultCommand = '',
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);
  const xtermInstance = useRef<Xterm | null>(null);
  const fitAddonInstance = useRef<FitAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [activeSession, setActiveSession] = useState(sessionId);
  const [commandInput, setCommandInput] = useState(defaultCommand);

  useEffect(() => {
    if (!terminalRef.current) return;

    // Initialize xterm.js with Cyber-Red theme
    const term = new Xterm({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'Share Tech Mono', monospace",
      fontSize: 13,
      lineHeight: 1.2,
      theme: {
        background: '#0a0a0c',
        foreground: '#e2e8f0',
        cursor: '#ff003c',
        cursorAccent: '#0a0a0c',
        selectionBackground: '#ff003c44',
        black: '#0a0a0c',
        red: '#ff003c',
        green: '#10b981',
        yellow: '#f59e0b',
        blue: '#00f0ff',
        magenta: '#d946ef',
        cyan: '#00f0ff',
        white: '#f8fafc',
        brightBlack: '#475569',
        brightRed: '#ff2055',
        brightGreen: '#34d399',
        brightYellow: '#fbbf24',
        brightBlue: '#38bdf8',
        brightMagenta: '#f472b6',
        brightCyan: '#22d3ee',
        brightWhite: '#ffffff',
      },
    });

    const fitAddon = new FitAddon();
    term.loadAddon(fitAddon);
    term.open(terminalRef.current);
    fitAddon.fit();

    xtermInstance.current = term;
    fitAddonInstance.current = fitAddon;

    // Connect WebSocket
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      term.write('\x1b[1;31m[ARES TERMINAL CONTROLLER ONLINE]\x1b[0m\r\n');
      term.write(`\x1b[36mConnected to session: ${activeSession}\x1b[0m\r\n\r\n`);

      // Attach terminal session
      ws.send(
        JSON.stringify({
          type: 'terminal_attach',
          sessionId: activeSession,
          cols: term.cols,
          rows: term.rows,
        })
      );
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'terminal_output' && msg.sessionId === activeSession) {
          term.write(msg.data);
        }
      } catch (e) {
        term.write(event.data);
      }
    };

    term.onData((data) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'terminal_input',
            sessionId: activeSession,
            data,
          })
        );
      }
    });

    const handleResize = () => {
      fitAddon.fit();
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: 'terminal_resize',
            sessionId: activeSession,
            cols: term.cols,
            rows: term.rows,
          })
        );
      }
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ type: 'terminal_detach', sessionId: activeSession }));
        ws.close();
      }
      term.dispose();
    };
  }, [activeSession]);

  const sendQuickCommand = (cmd: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'terminal_input',
          sessionId: activeSession,
          data: `${cmd}\n`,
        })
      );
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0c] border border-zinc-800 ares-cut">
      {/* Terminal Deck Header */}
      <div className="h-10 bg-[#121216] border-b border-zinc-800 flex items-center justify-between px-3">
        <div className="flex items-center space-x-2">
          <TerminalSquare size={14} className="text-[#00f0ff]" />
          <span className="text-xs font-bold text-zinc-300 tracking-wider">
            TERMINAL DECK: <strong className="text-[#00f0ff]">{activeSession}</strong>
          </span>
        </div>

        {/* Quick Launch Buttons */}
        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => sendQuickCommand('telnet localhost 23')}
            className="px-2 py-0.5 bg-[#ff003c]/10 border border-[#ff003c]/40 text-[#ff003c] ares-cut-sm hover:bg-[#ff003c] hover:text-white transition text-[11px]"
          >
            IRIS Telnet
          </button>
          <button
            onClick={() => sendQuickCommand('git status')}
            className="px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300 ares-cut-sm hover:bg-zinc-800 transition text-[11px]"
          >
            git status
          </button>
          <button
            onClick={() => sendQuickCommand('clear')}
            className="p-1 text-zinc-500 hover:text-zinc-300 transition"
            title="Clear Terminal"
          >
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Xterm Screen */}
      <div className="flex-1 p-2 bg-[#0a0a0c] overflow-hidden" ref={terminalRef} />
    </div>
  );
};
