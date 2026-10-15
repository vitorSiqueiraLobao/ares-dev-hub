import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Send, CheckCircle2, AlertTriangle } from 'lucide-react';

export const NewmanNode = ({ data, isConnectable }: any) => {
  return (
    <div className="w-64 bg-[#121216] border border-amber-500/60 ares-cut shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden text-xs">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-[#00f0ff] !w-3 !h-3" />

      {/* Header */}
      <div className="bg-[#0a0a0c] px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Send size={14} className="text-amber-400" />
          <span className="font-bold text-zinc-200">Postman / Newman</span>
        </div>
        <span className="text-[10px] text-amber-400 font-mono">CLI EXEC</span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="text-[11px] text-zinc-300 font-mono bg-[#0a0a0c] p-2 border border-zinc-800 rounded-xs truncate">
          {data.collectionPath || 'tests/sample_collection.json'}
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
          <span>Folder: <strong className="text-zinc-300">{data.folder || 'All'}</strong></span>
          <span className="text-emerald-400 font-mono">JSON Reporter</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-amber-500 !w-3 !h-3" />
    </div>
  );
};
