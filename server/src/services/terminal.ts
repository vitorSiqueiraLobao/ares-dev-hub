import * as pty from 'node-pty';
import os from 'os';
import { WebSocket } from 'ws';

export interface TerminalSession {
  id: string;
  ptyProcess: pty.IPty;
  wsClients: Set<WebSocket>;
  createdAt: Date;
  command: string;
}

export class TerminalManager {
  private sessions: Map<string, TerminalSession> = new Map();
  private defaultShell: string;

  constructor() {
    this.defaultShell = process.env.SHELL || (os.platform() === 'win32' ? 'powershell.exe' : 'zsh');
  }

  /**
   * Spawns a new PTY terminal session.
   */
  public createSession(
    sessionId: string,
    command?: string,
    args: string[] = [],
    cwd: string = process.cwd(),
    cols: number = 100,
    rows: number = 30
  ): TerminalSession {
    // If a session already exists, return it
    if (this.sessions.has(sessionId)) {
      return this.sessions.get(sessionId)!;
    }

    const execCommand = command || this.defaultShell;
    const ptyProcess = pty.spawn(execCommand, args, {
      name: 'xterm-256color',
      cols,
      rows,
      cwd,
      env: {
        ...process.env,
        TERM: 'xterm-256color',
        COLORTERM: 'truecolor',
      },
    });

    const session: TerminalSession = {
      id: sessionId,
      ptyProcess,
      wsClients: new Set(),
      createdAt: new Date(),
      command: execCommand,
    };

    ptyProcess.onData((data: string) => {
      // Broadcast output to all connected WebSockets for this session
      for (const client of session.wsClients) {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(JSON.stringify({ type: 'terminal_output', sessionId, data }));
          } catch (e) {
            // handle send error
          }
        }
      }
    });

    ptyProcess.onExit(({ exitCode, signal }) => {
      for (const client of session.wsClients) {
        if (client.readyState === WebSocket.OPEN) {
          try {
            client.send(
              JSON.stringify({
                type: 'terminal_exit',
                sessionId,
                exitCode,
                signal,
              })
            );
          } catch (e) {}
        }
      }
      this.sessions.delete(sessionId);
    });

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * Attaches a WebSocket client to a terminal session.
   */
  public attachClient(sessionId: string, ws: WebSocket): void {
    const session = this.sessions.get(sessionId) || this.createSession(sessionId);
    session.wsClients.add(ws);
  }

  /**
   * Detaches a WebSocket client from a session.
   */
  public detachClient(sessionId: string, ws: WebSocket): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.wsClients.delete(ws);
    }
  }

  /**
   * Writes user input into the PTY process.
   */
  public write(sessionId: string, data: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.write(data);
    }
  }

  /**
   * Resizes the PTY process.
   */
  public resize(sessionId: string, cols: number, rows: number): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      try {
        session.ptyProcess.resize(cols, rows);
      } catch (e) {
        // resize error ignored
      }
    }
  }

  /**
   * Kills a terminal session.
   */
  public kill(sessionId: string): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.ptyProcess.kill();
      this.sessions.delete(sessionId);
    }
  }

  /**
   * Lists all active terminal sessions.
   */
  public listSessions(): Array<{ id: string; command: string; createdAt: Date }> {
    return Array.from(this.sessions.values()).map(s => ({
      id: s.id,
      command: s.command,
      createdAt: s.createdAt,
    }));
  }
}

export const terminalManager = new TerminalManager();
