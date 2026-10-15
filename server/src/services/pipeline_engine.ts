import { EventEmitter } from 'events';
import { sqlGuard } from './sql_guard.js';
import { irisService } from './iris.js';
import { newmanService } from './newman_runner.js';
import { gitService } from './git_service.js';

export type NodeType = 'llm' | 'sql_guard' | 'iris_deploy' | 'newman_test' | 'human_gate';

export interface PipelineNode {
  id: string;
  type: NodeType;
  title: string;
  data: Record<string, any>;
}

export interface PipelineEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
}

export interface PipelineDefinition {
  id: string;
  name: string;
  nodes: PipelineNode[];
  edges: PipelineEdge[];
}

export type ExecutionStatus = 'idle' | 'running' | 'paused_for_approval' | 'completed' | 'failed';

export interface NodeExecutionState {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'waiting_approval';
  startedAt?: Date;
  completedAt?: Date;
  input?: any;
  output?: any;
  error?: string;
}

export interface PipelineExecution {
  id: string;
  pipelineId: string;
  status: ExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  nodeStates: Record<string, NodeExecutionState>;
  pendingApproval?: {
    nodeId: string;
    actionDescription: string;
    payload: any;
    resolve: (approved: boolean) => void;
  };
}

export class PipelineEngine extends EventEmitter {
  private executions: Map<string, PipelineExecution> = new Map();

  /**
   * Starts execution of a pipeline definition.
   */
  public async executePipeline(pipeline: PipelineDefinition, initialInput: any = {}): Promise<PipelineExecution> {
    const executionId = `exec_${Date.now()}`;
    const nodeStates: Record<string, NodeExecutionState> = {};

    for (const node of pipeline.nodes) {
      nodeStates[node.id] = {
        nodeId: node.id,
        status: 'pending',
      };
    }

    const execution: PipelineExecution = {
      id: executionId,
      pipelineId: pipeline.id,
      status: 'running',
      startedAt: new Date(),
      nodeStates,
    };

    this.executions.set(executionId, execution);
    this.emit('execution_update', execution);

    // Run DAG asynchronously
    this.runDAG(pipeline, execution, initialInput).catch(err => {
      execution.status = 'failed';
      this.emit('execution_update', execution);
    });

    return execution;
  }

  /**
   * Approves or rejects a human gate.
   */
  public resolveApproval(executionId: string, approved: boolean): boolean {
    const execution = this.executions.get(executionId);
    if (!execution || !execution.pendingApproval) {
      return false;
    }

    const { resolve, nodeId } = execution.pendingApproval;
    execution.pendingApproval = undefined;

    if (approved) {
      execution.status = 'running';
      execution.nodeStates[nodeId].status = 'completed';
      resolve(true);
    } else {
      execution.status = 'failed';
      execution.nodeStates[nodeId].status = 'failed';
      execution.nodeStates[nodeId].error = 'Rejeitado pelo operador humano no gate de aprovação.';
      resolve(false);
    }

    this.emit('execution_update', execution);
    return true;
  }

  public getExecution(executionId: string): PipelineExecution | undefined {
    return this.executions.get(executionId);
  }

  private async runDAG(pipeline: PipelineDefinition, execution: PipelineExecution, initialInput: any) {
    // Build adjacency and in-degree
    const nodeMap = new Map(pipeline.nodes.map(n => [n.id, n]));
    const inDegree = new Map<string, number>();
    const dependents = new Map<string, string[]>();
    const nodeOutputs = new Map<string, any>();

    for (const node of pipeline.nodes) {
      inDegree.set(node.id, 0);
      dependents.set(node.id, []);
    }

    for (const edge of pipeline.edges) {
      inDegree.set(edge.target, (inDegree.get(edge.target) || 0) + 1);
      dependents.get(edge.source)?.push(edge.target);
    }

    // Nodes ready to execute (in-degree 0)
    const readyQueue: string[] = pipeline.nodes
      .filter(n => (inDegree.get(n.id) || 0) === 0)
      .map(n => n.id);

    while (readyQueue.length > 0) {
      const nodeId = readyQueue.shift()!;
      const node = nodeMap.get(nodeId)!;
      const state = execution.nodeStates[nodeId];

      state.status = 'running';
      state.startedAt = new Date();
      this.emit('execution_update', execution);

      try {
        // Collect inputs from incoming edges or initialInput
        const incomingEdges = pipeline.edges.filter(e => e.target === nodeId);
        let nodeInput = incomingEdges.length > 0
          ? incomingEdges.map(e => nodeOutputs.get(e.source))
          : initialInput;

        if (incomingEdges.length === 1) {
          nodeInput = nodeInput[0];
        }

        state.input = nodeInput;

        // Execute specific node logic
        const output = await this.executeNodeLogic(node, nodeInput, execution);

        state.status = 'completed';
        state.completedAt = new Date();
        state.output = output;
        nodeOutputs.set(nodeId, output);
        this.emit('execution_update', execution);

        // Decrement in-degree for dependents
        const nextNodes = dependents.get(nodeId) || [];
        for (const nextId of nextNodes) {
          const currentIn = (inDegree.get(nextId) || 1) - 1;
          inDegree.set(nextId, currentIn);
          if (currentIn === 0) {
            readyQueue.push(nextId);
          }
        }
      } catch (err: any) {
        state.status = 'failed';
        state.completedAt = new Date();
        state.error = err.message;
        execution.status = 'failed';
        this.emit('execution_update', execution);
        return;
      }
    }

    execution.status = 'completed';
    execution.completedAt = new Date();
    this.emit('execution_update', execution);
  }

  private async executeNodeLogic(node: PipelineNode, input: any, execution: PipelineExecution): Promise<any> {
    switch (node.type) {
      case 'sql_guard': {
        const sqlContent = typeof input === 'string' ? input : (input?.sql || node.data.sql || '');
        const validation = sqlGuard.validate(sqlContent);
        if (!validation.valid) {
          throw new Error(`[SQL GUARD VIOLATION] ${validation.reason}`);
        }
        const userLimit = node.data.limit !== undefined ? node.data.limit : 50;
        const sanitized = sqlGuard.applySafetyLimit(sqlContent, userLimit);
        return {
          valid: true,
          originalSql: sqlContent,
          sanitizedSql: sanitized,
          limitApplied: userLimit <= 0 || userLimit === null ? 'UNLIMITED' : userLimit,
          hasLimit: validation.hasLimit,
        };
      }

      case 'iris_deploy': {
        const filePath = input?.filePath || node.data.filePath;
        const overwrite = node.data.overwrite !== false;
        if (!filePath) {
          throw new Error('Nenhum arquivo especificado para compilação no IRIS.');
        }
        const compileResult = await irisService.compileFile(filePath, overwrite, node.data.namespace);
        if (!compileResult.success) {
          throw new Error(`Erro na compilação IRIS: ${compileResult.errors?.join('\n') || compileResult.rawOutput}`);
        }
        return compileResult;
      }

      case 'human_gate': {
        // Pause execution and wait for human resolution
        return new Promise((resolve, reject) => {
          execution.status = 'paused_for_approval';
          execution.nodeStates[node.id].status = 'waiting_approval';
          execution.pendingApproval = {
            nodeId: node.id,
            actionDescription: node.data.description || 'Aprovação necessária para prosseguir o fluxo.',
            payload: input,
            resolve: (approved: boolean) => {
              if (approved) {
                resolve({ approved: true, data: input });
              } else {
                reject(new Error('Ação rejeitada no Human Gate pelo operador.'));
              }
            },
          };
          this.emit('execution_update', execution);
        });
      }

      case 'newman_test': {
        const collection = input?.collectionPath || node.data.collectionPath;
        const summary = await newmanService.runCollection(collection, node.data.environmentPath);
        return summary;
      }

      case 'llm':
      default: {
        // Echo or format output for agent nodes
        return {
          model: node.data.model || 'claude-3-7-sonnet',
          prompt: node.data.prompt,
          result: `Output gerado a partir do input: ${JSON.stringify(input)}`,
        };
      }
    }
  }
}

export const pipelineEngine = new PipelineEngine();
