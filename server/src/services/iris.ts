// @ts-ignore
import { Client } from 'telnet-client';
import { config, IrisConfig } from '../config.js';

export interface IrisExecutionResult {
  success: boolean;
  rawOutput: string;
  hasErrors: boolean;
  errors?: string[];
  executionTimeMs: number;
}

export class IrisService {
  private client: any;
  private isConnected: boolean = false;
  private currentNamespace: string;

  constructor(private irisConfig: IrisConfig = config.iris) {
    this.currentNamespace = irisConfig.namespace;
  }

  /**
   * Connects to the InterSystems IRIS Telnet server on port 23.
   */
  public async connect(): Promise<boolean> {
    if (this.isConnected && this.client) {
      return true;
    }

    this.client = new Client();

    const connectionParams: any = {
      host: this.irisConfig.host,
      port: this.irisConfig.port,
      shellPrompt: /(USER|%SYS|[A-Z0-9_]+)>/i,
      loginPrompt: /Username:/i,
      passwordPrompt: /Password:/i,
      timeout: this.irisConfig.timeout || 5000,
      ors: '\r\n',
      irs: '\r\n',
    };

    if (this.irisConfig.username) {
      connectionParams.username = this.irisConfig.username;
    }
    if (this.irisConfig.password) {
      connectionParams.password = this.irisConfig.password;
    }

    try {
      await this.client.connect(connectionParams);
      this.isConnected = true;

      // Switch to default namespace if configured
      if (this.irisConfig.namespace && this.irisConfig.namespace !== 'USER') {
        await this.switchNamespace(this.irisConfig.namespace);
      }

      return true;
    } catch (err: any) {
      this.isConnected = false;
      throw new Error(`Falha ao conectar no terminal IRIS (${this.irisConfig.host}:${this.irisConfig.port}): ${err.message}`);
    }
  }

  /**
   * Switches the active namespace in IRIS.
   */
  public async switchNamespace(namespace: string): Promise<string> {
    const res = await this.execute(`zn "${namespace}"`);
    this.currentNamespace = namespace;
    return res.rawOutput;
  }

  /**
   * Executes an ObjectScript command in the IRIS terminal.
   */
  public async execute(command: string, targetNamespace?: string): Promise<IrisExecutionResult> {
    const startTime = Date.now();
    try {
      await this.connect();

      if (targetNamespace && targetNamespace !== this.currentNamespace) {
        await this.switchNamespace(targetNamespace);
      }

      const rawOutput = await this.client.exec(command);
      const executionTimeMs = Date.now() - startTime;

      const hasErrors = /<[A-Z0-9]+>|\bERROR\b|\bERRO\b/i.test(rawOutput);
      const errors = hasErrors ? this.extractErrors(rawOutput) : undefined;

      return {
        success: !hasErrors,
        rawOutput,
        hasErrors,
        errors,
        executionTimeMs,
      };
    } catch (err: any) {
      return {
        success: false,
        rawOutput: err.message,
        hasErrors: true,
        errors: [err.message],
        executionTimeMs: Date.now() - startTime,
      };
    }
  }

  /**
   * Imports and compiles an ObjectScript file (.cls, .mac, .int) directly with force overwrite.
   */
  public async compileFile(
    absoluteFilePath: string,
    overwrite: boolean = true,
    targetNamespace?: string
  ): Promise<IrisExecutionResult> {
    const flags = overwrite ? 'ck /overwrite /display=error' : 'ck /display=error';
    const command = `Do $system.OBJ.Load("${absoluteFilePath}", "${flags}")`;
    return this.execute(command, targetNamespace);
  }

  /**
   * Disconnects from the IRIS Telnet session.
   */
  public async disconnect(): Promise<void> {
    if (this.client) {
      try {
        await this.client.end();
      } catch (err) {
        // ignore disconnect error
      }
      this.client = null;
      this.isConnected = false;
    }
  }

  private extractErrors(output: string): string[] {
    const lines = output.split(/\r?\n/);
    return lines.filter(line => /<[A-Z0-9]+>|\bERROR\b|\bERRO\b/i.test(line));
  }
}

export const irisService = new IrisService();
