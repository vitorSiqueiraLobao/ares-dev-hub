import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { ShieldAlert, UserCheck } from 'lucide-react';

export const HumanGateNode = ({ data, isConnectable }: any) => {
  return (
    <div className="w-64 bg-[#1b1214] border-2 border-[#ff003c] ares-cut shadow-[0_0_20px_rgba(255,0,60,0.3)] overflow-hidden text-xs animate-pulse">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-[#00f0ff] !w-3 !h-3" />

      {/* Header */}
      <div className="bg-[#ff003c]/20 px-3 py-2 border-b border-[#ff003c]/40 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <ShieldAlert size={14} className="text-[#ff003c]" />
          <span className="font-bold text-white tracking-wider">HUMAN GATE</span>
        </div>
        <span className="text-[10px] text-[#ff003c] bg-black px-1.5 py-0.5 border border-[#ff003c]/40 font-bold">
          LOCK
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2">
        <div className="text-[11px] text-zinc-300 font-mono bg-black/60 p-2 border border-[#ff003c]/30 rounded-xs">
          {data.description || 'Pausa pipeline e aguarda validação explícita do operador.'}
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-400 pt-1">
          <span className="flex items-center space-x-1 text-[#ff003c]">
            <UserCheck size={12} />
            <span>Interactive Gate</span>
          </span>
          <span className="text-zinc-500 font-mono">Approve/Reject</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-[#ff003c] !w-3 !h-3" />
    </div>
  );
};
