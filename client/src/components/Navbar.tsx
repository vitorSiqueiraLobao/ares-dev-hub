import React from 'react';
import { Terminal, GitBranch, Cpu, Play, CheckCircle2, ShieldAlert } from 'lucide-react';
import { ModelTelemetry } from '../types.js';

interface NavbarProps {
  telemetry: ModelTelemetry[];
  activeTab: 'nodes' | 'terminal' | 'git' | 'telemetry';
  setActiveTab: (tab: 'nodes' | 'terminal' | 'git' | 'telemetry') => void;
  onRunPipeline: () => void;
  isRunningPipeline: boolean;
  hasPendingApproval: boolean;
  onOpenApproval: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  telemetry,
  activeTab,
  setActiveTab,
  onRunPipeline,
  isRunningPipeline,
  hasPendingApproval,
  onOpenApproval,
}) => {
  return (
    <header className="h-14 border-b border-[#ff003c]/40 bg-[#121216]/95 backdrop-blur flex items-center justify-between px-4 z-50">
      {/* Brand & Status */}
      <div className="flex items-center space-x-3">
        <div className="flex items-center space-x-2">
          <span className="w-3 h-3 bg-[#ff003c] inline-block ares-cut-sm shadow-[0_0_8px_#ff003c]" />
          <span className="font-bold tracking-widest text-[#ff003c] ares-glow-red text-sm">
            ARES
          </span>
          <span className="text-xs text-[#00f0ff] font-semibold tracking-wider ares-glow-cyan">
            // DEV MESH HUD
          </span>
        </div>

        <div className="hidden md:flex items-center space-x-2 px-2 py-0.5 border border-[#00f0ff]/30 ares-cut-sm bg-[#0a0a0c]/80 text-[10px] text-[#00f0ff]">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00f0ff] animate-ping" />
          <span>BREACH: ACTIVE</span>
        </div>
      </div>

      {/* Quota Telemetry Quick Glance: Claude + Gemini */}
      <div className="hidden lg:flex items-center space-x-3 text-xs">
        {telemetry
          .filter(m => m.model === 'claude-3-7-sonnet' || m.model === 'gemini-3-8-flash')
          .map(m => {
            const isClaude = m.model.includes('claude');
            const colorClass = isClaude ? 'text-[#ff003c]' : 'text-[#00f0ff]';
            const barClass = isClaude ? 'bg-[#ff003c]' : 'bg-[#00f0ff]';

            return (
              <div key={m.model} className="flex items-center space-x-2 bg-[#0a0a0c] px-2.5 py-1 border border-zinc-800 ares-cut-sm">
                <span className={`text-[11px] font-semibold ${colorClass}`}>{m.spec.modelName}:</span>
                <div className="w-16 h-1.5 bg-zinc-900 overflow-hidden rounded-xs border border-zinc-800">
                  <div
                    className={`h-full ${barClass}`}
                    style={{ width: `${Math.max(5, m.contextPercent)}%` }}
                  />
                </div>
                <span className={`${colorClass} text-[10px] font-mono`}>{m.contextPercent}% CTX</span>
              </div>
            );
          })}
      </div>

      {/* Action Buttons & Tabs */}
      <div className="flex items-center space-x-2">
        {hasPendingApproval && (
          <button
            onClick={onOpenApproval}
            className="flex items-center space-x-1.5 bg-[#ff003c] text-white px-3 py-1.5 text-xs font-bold ares-cut hover:bg-[#ff2055] transition shadow-[0_0_12px_#ff003c] animate-pulse"
          >
            <ShieldAlert size={14} />
            <span>APPROVAL REQ</span>
          </button>
        )}

        <button
          onClick={onRunPipeline}
          disabled={isRunningPipeline}
          className={`flex items-center space-x-1.5 px-3 py-1.5 text-xs font-bold ares-cut transition ${
            isRunningPipeline
              ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
              : 'bg-[#00f0ff]/10 text-[#00f0ff] border border-[#00f0ff] hover:bg-[#00f0ff]/20 shadow-[0_0_8px_rgba(0,240,255,0.3)]'
          }`}
        >
          <Play size={13} className={isRunningPipeline ? 'animate-spin' : ''} />
          <span>{isRunningPipeline ? 'RUNNING...' : 'EXECUTE MESH'}</span>
        </button>

        <div className="h-6 w-px bg-zinc-800 mx-1" />

        <div className="flex items-center bg-[#0a0a0c] p-0.5 border border-zinc-800 ares-cut-sm text-xs">
          <button
            onClick={() => setActiveTab('nodes')}
            className={`px-3 py-1 ares-cut-sm transition ${
              activeTab === 'nodes'
                ? 'bg-[#ff003c] text-white font-bold shadow-[0_0_8px_#ff003c]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            DAG Mesh
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`flex items-center space-x-1 px-3 py-1 ares-cut-sm transition ${
              activeTab === 'terminal'
                ? 'bg-[#00f0ff] text-black font-bold shadow-[0_0_8px_#00f0ff]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Terminal size={12} />
            <span>Deck</span>
          </button>
          <button
            onClick={() => setActiveTab('git')}
            className={`flex items-center space-x-1 px-3 py-1 ares-cut-sm transition ${
              activeTab === 'git'
                ? 'bg-[#ff003c] text-white font-bold shadow-[0_0_8px_#ff003c]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <GitBranch size={12} />
            <span>Git / Files</span>
          </button>
          <button
            onClick={() => setActiveTab('telemetry')}
            className={`flex items-center space-x-1 px-3 py-1 ares-cut-sm transition ${
              activeTab === 'telemetry'
                ? 'bg-[#00f0ff] text-black font-bold shadow-[0_0_8px_#00f0ff]'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu size={12} />
            <span>Quotas</span>
          </button>
        </div>
      </div>
    </header>
  );
};
