import React, { useState } from 'react';
import { Handle, Position } from '@xyflow/react';
import { Database, ShieldCheck, Sliders, AlertTriangle } from 'lucide-react';

export const SqlGuardNode = ({ data, isConnectable }: any) => {
  const [currentLimit, setCurrentLimit] = useState<number>(data.limit !== undefined ? data.limit : 50);
  const [isEditing, setIsEditing] = useState(false);

  const updateLimit = (newLimit: number) => {
    setCurrentLimit(newLimit);
    data.limit = newLimit; // Mutate node data for DAG pipeline execution
  };

  const isUnlimited = currentLimit <= 0;

  return (
    <div className="w-72 bg-[#121216] border border-[#00f0ff]/60 ares-cut shadow-[0_0_20px_rgba(0,0,0,0.8)] overflow-hidden text-xs">
      <Handle type="target" position={Position.Top} isConnectable={isConnectable} className="!bg-[#00f0ff] !w-3 !h-3" />

      {/* Header */}
      <div className="bg-[#0a0a0c] px-3 py-2 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Database size={14} className="text-[#00f0ff]" />
          <span className="font-bold text-zinc-200">SQL Guard (Read-Only)</span>
        </div>
        <span className="text-[10px] text-emerald-400 flex items-center space-x-1">
          <ShieldCheck size={12} />
          <span>READ-ONLY</span>
        </span>
      </div>

      {/* Body */}
      <div className="p-3 space-y-2.5">
        <div className="text-[11px] text-[#00f0ff] font-mono bg-[#0a0a0c] p-2 border border-zinc-800 rounded-xs truncate">
          {data.filePath || data.sql || 'SELECT * FROM users'}
        </div>

        {/* Limit Controller Trigger */}
        <div className="bg-[#0a0a0c] p-2 border border-zinc-850 rounded-xs space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-[11px] flex items-center space-x-1">
              <Sliders size={12} className="text-[#00f0ff]" />
              <span>Limite de Saída (Rows):</span>
            </span>
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="text-[10px] text-[#00f0ff] hover:underline font-mono"
            >
              {isEditing ? 'Fechar' : 'Ajustar'}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-zinc-400 text-[10px]">Configurado:</span>
            {isUnlimited ? (
              <span className="px-1.5 py-0.5 bg-amber-950/60 border border-amber-500/50 text-amber-400 font-bold text-[10px] flex items-center space-x-1 ares-cut-sm animate-pulse">
                <AlertTriangle size={10} />
                <span>SEM LIMITE (FULL)</span>
              </span>
            ) : (
              <span className="px-2 py-0.5 bg-[#00f0ff]/10 border border-[#00f0ff]/40 text-[#00f0ff] font-mono font-bold text-[11px] ares-cut-sm">
                {currentLimit} ROWS
              </span>
            )}
          </div>

          {/* Quick Preset Buttons & Input */}
          {isEditing && (
            <div className="space-y-2 pt-1 border-t border-zinc-800/80">
              <div className="grid grid-cols-5 gap-1 text-[10px] font-mono">
                {[50, 100, 500, 1000].map(val => (
                  <button
                    key={val}
                    onClick={() => updateLimit(val)}
                    className={`py-1 border ares-cut-sm transition ${
                      currentLimit === val
                        ? 'bg-[#00f0ff] text-black font-bold border-[#00f0ff]'
                        : 'bg-zinc-900 text-zinc-300 border-zinc-750 hover:bg-zinc-800'
                    }`}
                  >
                    {val}
                  </button>
                ))}
                <button
                  onClick={() => updateLimit(0)}
                  title="Executar sem LIMIT injetado"
                  className={`py-1 border ares-cut-sm transition ${
                    isUnlimited
                      ? 'bg-amber-500 text-black font-bold border-amber-400'
                      : 'bg-zinc-900 text-amber-400 border-zinc-750 hover:bg-amber-950/40'
                  }`}
                >
                  0 (LIVRE)
                </button>
              </div>

              {/* Custom Input */}
              <div className="flex items-center space-x-2">
                <span className="text-[10px] text-zinc-500">Valor customizado:</span>
                <input
                  type="number"
                  min="0"
                  max="100000"
                  value={currentLimit}
                  onChange={(e) => updateLimit(parseInt(e.target.value || '0', 10))}
                  className="w-20 bg-black border border-zinc-700 text-[#00f0ff] text-[11px] px-1.5 py-0.5 font-mono text-center rounded-xs focus:border-[#00f0ff] outline-none"
                />
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-[10px] text-zinc-500 pt-0.5">
          <span className="text-zinc-500">Operador: <strong className="text-zinc-300">Humano</strong></span>
          <span className="text-emerald-400 font-mono">AST Checked</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} isConnectable={isConnectable} className="!bg-[#00f0ff] !w-3 !h-3" />
    </div>
  );
};
