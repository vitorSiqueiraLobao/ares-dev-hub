import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Bot, Sparkles } from 'lucide-react';

export const LLMNode = ({ data, isConnectable }: any) => {
  const modelColor = data.model?.includes('claude') ? 'text-[#ff003c]' : 'text-[#00f0ff]';
  const borderColor = data.model?.includes('claude') ? 'border-[#ff003c]/60' : 'border-[#00f0ff]/60';

  return (
    <div className={`w-64 bg-[#121216] border ${borderColor} ares-cut shadow-[0_0_15px_rgba(0,0,0,0.8)] overflow-hidden text-xs`}>
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-[#00f0ff] !w-3 !h-3" />
      
      {/* Node Header */}
      <div className="bg-[#0a0a0c] px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Bot size={14} className={modelColor} />
          <span className="font-bold text-zinc-200">{data.label || 'AI Agent'}</span>
        </div>
        <span className={`text-[10px] font-mono px-1.5 py-0.5 bg-zinc-900 border border-zinc-800 ${modelColor}`}>
          {data.model || 'Claude'}
        </span>
      </div>

      {/* Node Body */}
      <div className="p-3 space-y-2">
        <div className="text-[11px] text-zinc-400 font-mono line-clamp-2 bg-[#0a0a0c] p-2 border border-zinc-800/80 rounded-xs">
          {data.prompt || 'Awaiting instructions...'}
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-1">
          <span>Role: <strong className="text-zinc-300">{data.role || 'Coder'}</strong></span>
          <span className="flex items-center space-x-1 text-[#00f0ff]">
            <Sparkles size={10} />
            <span>I/O Bound</span>
          </span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-[#ff003c] !w-3 !h-3" />
    </div>
  );
};
