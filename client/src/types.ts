export type NodeType = 'llm' | 'sql_guard' | 'iris_deploy' | 'newman_test' | 'human_gate';

export interface ModelTelemetry {
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  currentContextTokens: number;
  requestCount: number;
  spec: {
    modelName: string;
    maxContextWindow: number;
    dailyTokenQuota?: number;
  };
  contextPercent: number;
}

export interface GitStatus {
  current: string;
  tracking: string;
  modified: string[];
  created: string[];
  deleted: string[];
  staged: string[];
  ahead: number;
  behind: number;
}

export interface FileTreeItem {
  name: string;
  path: string;
  isDirectory: boolean;
  extension?: string;
  size?: number;
}

export interface PendingApproval {
  executionId: string;
  nodeId: string;
  actionDescription: string;
  payload: any;
}
