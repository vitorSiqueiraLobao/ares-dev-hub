import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Layers, Server } from 'lucide-react';

export const IrisDeployNode = ({ data, isConnectable }: any) => {
  return (
    <div className="w-64 bg-[#121216] border border-[#ff003c]/60 ares-cut shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden text-xs">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-[#00f0ff] !w-3 !h-3" />

      {/* Header */}
      <div className="bg-[#0a0a0c] px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Server size={14} className="text-[#ff003c]" />
          <span className="font-bold text-zinc-200">IRIS 2022 Deploy</span>
        </div>
        <span className="text-[10px] text-amber-400 font-mono">PORT :23</span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="text-[11px] text-zinc-300 font-mono bg-[#0a0a0c] p-2 border border-zinc-800 rounded-xs truncate">
          {data.filePath || 'src/Sample/Custom/Service.cls'}
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
          <span>Namespace: <strong className="text-[#00f0ff]">{data.namespace || 'USER'}</strong></span>
          <span className="text-emerald-400 font-bold">/OVERWRITE FORCED</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-[#ff003c] !w-3 !h-3" />
    </div>
  );
};
