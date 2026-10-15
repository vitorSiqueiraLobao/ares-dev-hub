import React from 'react';
import { Cpu, Zap, Activity, HardDrive, AlertTriangle } from 'lucide-react';
import { ModelTelemetry } from '../types.js';

interface TelemetryPanelProps {
  telemetry: ModelTelemetry[];
  onRefresh: () => void;
}

export const TelemetryPanel: React.FC<TelemetryPanelProps> = ({ telemetry, onRefresh }) => {
  const renderAsciiMeter = (percent: number, length: number = 20) => {
    const filled = Math.round((percent / 100) * length);
    const empty = Math.max(0, length - filled);
    return `[${'█'.repeat(filled)}${'░'.repeat(empty)}]`;
  };

  return (
    <div className="h-full bg-[#0a0a0c] border border-zinc-800 ares-cut p-6 overflow-y-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div>
          <h2 className="text-base font-bold text-white tracking-widest flex items-center space-x-2">
            <Cpu size={18} className="text-[#00f0ff]" />
            <span>MODEL TELEMETRY & QUOTA CONTROLLER</span>
          </h2>
          <p className="text-xs text-zinc-500 mt-0.5">
            Monitoramento de cotas de assinatura, ocupação de contexto e consumo de tokens por nó.
          </p>
        </div>
        <button
          onClick={onRefresh}
          className="text-xs px-3 py-1.5 border border-[#00f0ff]/40 text-[#00f0ff] ares-cut-sm hover:bg-[#00f0ff]/10 transition"
        >
          RE-SYNC TELEMETRY
        </button>
      </div>

      {/* Grid of Models */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {telemetry.map(item => {
          const isClaude = item.model.includes('claude');
          const accentColor = isClaude ? 'text-[#ff003c]' : 'text-[#00f0ff]';
          const borderColor = isClaude ? 'border-[#ff003c]/40' : 'border-[#00f0ff]/40';
          const meterColor = item.contextPercent > 80 ? 'text-[#ff003c]' : isClaude ? 'text-[#ff003c]' : 'text-[#00f0ff]';

          return (
            <div
              key={item.model}
              className={`bg-[#121216] border ${borderColor} p-4 ares-cut space-y-4 shadow-[0_0_15px_rgba(0,0,0,0.5)]`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h3 className={`font-bold text-sm tracking-wider ${accentColor}`}>
                    {item.spec.modelName}
                  </h3>
                  <span className="text-[10px] text-zinc-500 font-mono">ID: {item.model}</span>
                </div>
                <span className="text-xs px-2 py-0.5 bg-[#0a0a0c] border border-zinc-800 text-zinc-300 font-mono ares-cut-sm">
                  {item.requestCount} REQS
                </span>
              </div>

              {/* Context Window Capacity Meter */}
              <div className="space-y-1.5 bg-[#0a0a0c] p-3 border border-zinc-850 rounded-xs">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-zinc-400 flex items-center space-x-1">
                    <HardDrive size={12} />
                    <span>Context Window Usage:</span>
                  </span>
                  <strong className={`${accentColor} font-mono`}>{item.contextPercent}%</strong>
                </div>

                {/* ASCII Progress */}
                <div className={`font-mono text-xs ${meterColor} tracking-tighter`}>
                  {renderAsciiMeter(item.contextPercent, 28)}
                </div>

                <div className="flex justify-between text-[10px] text-zinc-500 font-mono pt-1">
                  <span>Current: {item.currentContextTokens.toLocaleString()} tokens</span>
                  <span>Max: {item.spec.maxContextWindow.toLocaleString()} tokens</span>
                </div>
              </div>

              {/* Tokens Stats */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="bg-[#0a0a0c] p-2 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Prompt</span>
                  <strong className="text-zinc-200 font-mono">{item.promptTokens.toLocaleString()}</strong>
                </div>
                <div className="bg-[#0a0a0c] p-2 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Completion</span>
                  <strong className="text-zinc-200 font-mono">{item.completionTokens.toLocaleString()}</strong>
                </div>
                <div className="bg-[#0a0a0c] p-2 border border-zinc-800">
                  <span className="text-[10px] text-zinc-500 block">Total</span>
                  <strong className={`${accentColor} font-mono`}>{item.totalTokens.toLocaleString()}</strong>
                </div>
              </div>

              {/* Quota Cost Optimization Tip */}
              <div className="text-[11px] text-zinc-400 bg-black/40 p-2 border border-zinc-800/80 rounded-xs flex items-center space-x-2">
                <Zap size={13} className="text-amber-400 shrink-0" />
                <span>
                  {isClaude
                    ? 'Reservado para síntese de arquitetura e geração refinada de código.'
                    : 'Ideal para leitura contínua de logs, pré-filtragem de selects e compilações.'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
