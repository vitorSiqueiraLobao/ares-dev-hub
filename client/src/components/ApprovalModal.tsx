import React from 'react';
import { ShieldAlert, Check, X, Terminal, Database, Server } from 'lucide-react';
import { PendingApproval } from '../types.js';

interface ApprovalModalProps {
  pendingApproval: PendingApproval | null;
  onResolve: (approved: boolean) => void;
  onClose: () => void;
}

export const ApprovalModal: React.FC<ApprovalModalProps> = ({
  pendingApproval,
  onResolve,
  onClose,
}) => {
  if (!pendingApproval) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-xl bg-[#121216] border-2 border-[#ff003c] ares-cut shadow-[0_0_30px_rgba(255,0,60,0.5)] overflow-hidden">
        {/* Modal Header */}
        <div className="bg-[#ff003c]/20 px-4 py-3 border-b border-[#ff003c]/40 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShieldAlert size={18} className="text-[#ff003c] animate-pulse" />
            <h3 className="font-bold text-white tracking-widest text-sm">
              BREACH GATE // INTERACTIVE APPROVAL REQUIRED
            </h3>
          </div>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition">
            <X size={16} />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-5 space-y-4">
          <div>
            <span className="text-[10px] text-zinc-500 font-bold tracking-wider uppercase block">
              Ação Solicitada
            </span>
            <p className="text-sm font-semibold text-zinc-200 mt-1">
              {pendingApproval.actionDescription}
            </p>
          </div>

          {/* Payload Preview */}
          <div className="bg-[#0a0a0c] p-3 border border-zinc-800 rounded-xs space-y-2">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-mono">Payload Data / Target:</span>
              <span className="text-[#00f0ff] font-mono text-[10px]">VERIFIED READ-ONLY</span>
            </div>
            <pre className="text-xs font-mono text-zinc-300 max-h-48 overflow-y-auto whitespace-pre-wrap">
              {typeof pendingApproval.payload === 'string'
                ? pendingApproval.payload
                : JSON.stringify(pendingApproval.payload, null, 2)}
            </pre>
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center space-x-2 bg-black/40 p-2 border border-zinc-850">
            <span className="text-[#ff003c] font-bold">Aviso:</span>
            <span>
              Ao aprovar, o pipeline disparará a execução e enviará os resultados para o próximo nó do grafo.
            </span>
          </div>
        </div>

        {/* Modal Footer / Actions */}
        <div className="bg-[#0a0a0c] px-5 py-3 border-t border-zinc-800 flex items-center justify-end space-x-3">
          <button
            onClick={() => onResolve(false)}
            className="flex items-center space-x-1.5 px-4 py-2 border border-zinc-700 bg-zinc-900 text-zinc-300 ares-cut-sm hover:bg-zinc-800 text-xs font-bold transition"
          >
            <X size={14} />
            <span>REJECT / ABORT</span>
          </button>

          <button
            onClick={() => onResolve(true)}
            className="flex items-center space-x-1.5 px-5 py-2 bg-[#ff003c] text-white ares-cut-sm hover:bg-[#ff2055] text-xs font-bold transition shadow-[0_0_15px_#ff003c]"
          >
            <Check size={14} />
            <span>APPROVE EXECUTION</span>
          </button>
        </div>
      </div>
    </div>
  );
};
