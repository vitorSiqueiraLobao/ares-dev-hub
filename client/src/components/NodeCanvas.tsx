import React, { useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
  OnNodesChange,
  OnEdgesChange,
  OnConnect,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { LLMNode } from './nodes/LLMNode.js';
import { SqlGuardNode } from './nodes/SqlGuardNode.js';
import { IrisDeployNode } from './nodes/IrisDeployNode.js';
import { NewmanNode } from './nodes/NewmanNode.js';
import { HumanGateNode } from './nodes/HumanGateNode.js';

interface NodeCanvasProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: OnNodesChange;
  onEdgesChange: OnEdgesChange;
  onConnect: OnConnect;
}

export const NodeCanvas: React.FC<NodeCanvasProps> = ({
  nodes,
  edges,
  onNodesChange,
  onEdgesChange,
  onConnect,
}) => {
  const nodeTypes = useMemo(
    () => ({
      llm: LLMNode,
      sql_guard: SqlGuardNode,
      iris_deploy: IrisDeployNode,
      newman_test: NewmanNode,
      human_gate: HumanGateNode,
    }),
    []
  );

  return (
    <div className="w-full h-full bg-[#0a0a0c] ares-grid-bg relative">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
        className="text-white"
        defaultEdgeOptions={{
          animated: true,
          style: { stroke: '#ff003c', strokeWidth: 2 },
        }}
      >
        <Background color="#ff003c" gap={24} size={1} />
        <Controls className="!bg-[#121216] !border !border-zinc-800 !rounded-none !fill-zinc-400 [&>button]:!bg-[#121216] [&>button]:!border-zinc-800 [&>button:hover]:!bg-[#ff003c] [&>button:hover]:!text-white" />
        <MiniMap
          nodeColor={(n) => {
            if (n.type === 'llm') return '#00f0ff';
            if (n.type === 'human_gate') return '#ff003c';
            if (n.type === 'iris_deploy') return '#ff003c';
            return '#121216';
          }}
          className="!bg-[#121216]/90 !border !border-zinc-800 ares-cut-sm"
          maskColor="rgba(10, 10, 12, 0.7)"
        />
      </ReactFlow>

      {/* Floating Canvas Legend */}
      <div className="absolute bottom-4 left-4 bg-[#121216]/90 border border-zinc-800 p-2.5 ares-cut-sm text-[10px] space-y-1.5 backdrop-blur">
        <div className="text-zinc-400 font-bold tracking-wider">PIPELINE I/O STATUS</div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#00f0ff]" />
          <span className="text-zinc-300">Cyan: Data Flow & Queries</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-[#ff003c]" />
          <span className="text-zinc-300">Red: Execution & IRIS Deploy</span>
        </div>
      </div>
    </div>
  );
};
