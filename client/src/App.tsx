import React, { useState, useEffect, useCallback } from 'react';
import { useNodesState, useEdgesState, addEdge, Connection, Edge, Node } from '@xyflow/react';
import { Navbar } from './components/Navbar.js';
import { NodeCanvas } from './components/NodeCanvas.js';
import { TerminalDeck } from './components/TerminalDeck.js';
import { GitTree } from './components/GitTree.js';
import { TelemetryPanel } from './components/TelemetryPanel.js';
import { ApprovalModal } from './components/ApprovalModal.js';
import { FileEditorModal } from './components/FileEditorModal.js';
import { ModelTelemetry, PendingApproval } from './types.js';

const initialNodes: Node[] = [
  {
    id: 'node-claude',
    type: 'llm',
    position: { x: 50, y: 80 },
    data: {
      label: 'Claude Sonnet',
      model: 'claude-3-7-sonnet',
      role: 'Code Generator',
      prompt: 'Gera consultas SQL e classes ObjectScript (.cls).',
    },
  },
  {
    id: 'node-sql-guard',
    type: 'sql_guard',
    position: { x: 400, y: 40 },
    data: {
      filePath: 'queries/sample_query.sql',
      sql: 'SELECT id, name, email FROM users',
      limit: 50,
    },
  },
  {
    id: 'node-human-gate',
    type: 'human_gate',
    position: { x: 400, y: 220 },
    data: {
      description: 'Validação humana antes de executar queries e compilar no servidor IRIS.',
    },
  },
  {
    id: 'node-iris-deploy',
    type: 'iris_deploy',
    position: { x: 750, y: 40 },
    data: {
      filePath: 'src/Sample/Custom/Service.cls',
      namespace: 'USER',
      overwrite: true,
    },
  },
  {
    id: 'node-gemini-flash',
    type: 'llm',
    position: { x: 750, y: 240 },
    data: {
      label: 'Gemini 3.8 Flash',
      model: 'gemini-3-8-flash',
      role: 'Log Reader & Diagnostician',
      prompt: 'Analisa o log de compilação e resumo de queries com custo mínimo de tokens.',
    },
  },
];

const initialEdges: Edge[] = [
  { id: 'e1-2', source: 'node-claude', target: 'node-sql-guard', animated: true, style: { stroke: '#00f0ff', strokeWidth: 2 } },
  { id: 'e2-3', source: 'node-sql-guard', target: 'node-human-gate', animated: true, style: { stroke: '#00f0ff', strokeWidth: 2 } },
  { id: 'e3-4', source: 'node-human-gate', target: 'node-iris-deploy', animated: true, style: { stroke: '#ff003c', strokeWidth: 2 } },
  { id: 'e4-5', source: 'node-iris-deploy', target: 'node-gemini-flash', animated: true, style: { stroke: '#00f0ff', strokeWidth: 2 } },
];

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'terminal' | 'git' | 'telemetry'>('nodes');
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [telemetry, setTelemetry] = useState<ModelTelemetry[]>([]);
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pendingApproval, setPendingApproval] = useState<PendingApproval | null>(null);
  const [editingFile, setEditingFile] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges]
  );

  const showNotification = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  const fetchTelemetry = async () => {
    try {
      const res = await fetch('/api/telemetry');
      const data = await res.json();
      setTelemetry(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchTelemetry();
    const interval = setInterval(fetchTelemetry, 10000);

    // WebSocket subscription for pipeline events
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      ws.send(JSON.stringify({ type: 'pipeline_subscribe' }));
    };

    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === 'pipeline_update') {
          const exec = msg.execution;
          if (exec.status === 'paused_for_approval' && exec.pendingApproval) {
            setPendingApproval({
              executionId: exec.id,
              nodeId: exec.pendingApproval.nodeId,
              actionDescription: exec.pendingApproval.actionDescription,
              payload: exec.pendingApproval.payload,
            });
          }
          if (exec.status === 'completed') {
            setIsRunningPipeline(false);
            showNotification('Pipeline executado com sucesso!', 'success');
            fetchTelemetry();
          }
          if (exec.status === 'failed') {
            setIsRunningPipeline(false);
            showNotification('Execução do pipeline falhou ou foi abortada.', 'error');
          }
        }
      } catch (err) {}
    };

    return () => {
      clearInterval(interval);
      ws.close();
    };
  }, []);

  const handleRunPipeline = async () => {
    setIsRunningPipeline(true);
    showNotification('Disparando DAG do Mesh...', 'info');

    try {
      const pipelineDef = {
        id: 'ares_dag_main',
        name: 'Pipeline Workflow',
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.type as any,
          title: n.data.label as string,
          data: n.data,
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
        })),
      };

      const res = await fetch('/api/pipeline/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pipeline: pipelineDef, input: { timestamp: new Date() } }),
      });

      const exec = await res.json();
      if (exec.status === 'paused_for_approval') {
        setPendingApproval({
          executionId: exec.id,
          nodeId: exec.pendingApproval?.nodeId || 'node-human-gate',
          actionDescription: exec.pendingApproval?.actionDescription || 'Aprovação de consulta',
          payload: exec.pendingApproval?.payload,
        });
      }
    } catch (err: any) {
      setIsRunningPipeline(false);
      showNotification(`Erro ao disparar pipeline: ${err.message}`, 'error');
    }
  };

  const handleResolveApproval = async (approved: boolean) => {
    if (!pendingApproval) return;
    try {
      await fetch('/api/pipeline/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ executionId: pendingApproval.executionId, approved }),
      });
      setPendingApproval(null);
      showNotification(approved ? 'Ação autorizada!' : 'Ação rejeitada.', approved ? 'success' : 'error');
    } catch (err: any) {
      showNotification(`Falha ao resolver aprovação: ${err.message}`, 'error');
    }
  };

  const handleDeployToIris = async (filePath: string) => {
    showNotification(`Enviando ${filePath} para compilação forçada no IRIS...`, 'info');
    try {
      const res = await fetch('/api/iris/compile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath, overwrite: true }),
      });
      const data = await res.json();
      if (data.success) {
        showNotification(`Arquivo ${filePath} compilado com sucesso no IRIS!`, 'success');
      } else {
        showNotification(`Erro de compilação: ${data.errors?.[0] || data.rawOutput}`, 'error');
      }
    } catch (err: any) {
      showNotification(`Falha de conexão Telnet IRIS: ${err.message}`, 'error');
    }
  };

  const handleValidateSql = async (filePath: string) => {
    try {
      const res = await fetch('/api/sql/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filePath }),
      });
      const data = await res.json();
      if (data.valid) {
        showNotification(`SQL Seguro: Apenas SELECT detectado (${data.statementCount} queries).`, 'success');
      } else {
        showNotification(`ALERTA SQL: ${data.reason}`, 'error');
      }
    } catch (err: any) {
      showNotification(`Falha na validação SQL: ${err.message}`, 'error');
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-[#0a0a0c] text-white overflow-hidden">
      {/* Top HUD Navigation */}
      <Navbar
        telemetry={telemetry}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRunPipeline={handleRunPipeline}
        isRunningPipeline={isRunningPipeline}
        hasPendingApproval={!!pendingApproval}
        onOpenApproval={() => {}}
      />

      {/* Main View Port */}
      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'nodes' && (
          <NodeCanvas
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
          />
        )}

        {activeTab === 'terminal' && <TerminalDeck />}

        {activeTab === 'git' && (
          <GitTree
            onOpenFile={setEditingFile}
            onDeployToIris={handleDeployToIris}
            onValidateSql={handleValidateSql}
          />
        )}

        {activeTab === 'telemetry' && (
          <TelemetryPanel telemetry={telemetry} onRefresh={fetchTelemetry} />
        )}
      </main>

      {/* Interactive Approval Modal */}
      <ApprovalModal
        pendingApproval={pendingApproval}
        onResolve={handleResolveApproval}
        onClose={() => setPendingApproval(null)}
      />

      {/* File Editor Modal */}
      <FileEditorModal
        filePath={editingFile}
        onClose={() => setEditingFile(null)}
        onDeployToIris={handleDeployToIris}
        onValidateSql={handleValidateSql}
      />

      {/* Toast Notification */}
      {notification && (
        <div
          className={`fixed bottom-4 right-4 z-50 px-4 py-2.5 ares-cut text-xs font-bold shadow-[0_0_15px_rgba(0,0,0,0.8)] border transition animate-bounce ${
            notification.type === 'success'
              ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
              : notification.type === 'error'
              ? 'bg-[#1b1214] border-[#ff003c] text-[#ff003c]'
              : 'bg-zinc-900 border-[#00f0ff] text-[#00f0ff]'
          }`}
        >
          {notification.message}
        </div>
      )}
    </div>
  );
};
