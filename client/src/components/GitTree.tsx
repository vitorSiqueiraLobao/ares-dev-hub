import React, { useEffect, useState } from 'react';
import { GitBranch, FileCode, Play, ShieldCheck, RefreshCw, FileText, ChevronRight, Folder } from 'lucide-react';
import { GitStatus, FileTreeItem } from '../types.js';

interface GitTreeProps {
  onOpenFile: (filePath: string) => void;
  onDeployToIris: (filePath: string) => void;
  onValidateSql: (filePath: string) => void;
}

export const GitTree: React.FC<GitTreeProps> = ({
  onOpenFile,
  onDeployToIris,
  onValidateSql,
}) => {
  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [files, setFiles] = useState<FileTreeItem[]>([]);
  const [diff, setDiff] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const [resStatus, resFiles] = await Promise.all([
        fetch('/api/git/status').then(r => r.json()),
        fetch('/api/git/files').then(r => r.json()),
      ]);
      setGitStatus(resStatus);
      setFiles(resFiles);
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadDiff = async (filePath?: string) => {
    try {
      const url = filePath ? `/api/git/diff?file=${encodeURIComponent(filePath)}` : '/api/git/diff';
      const res = await fetch(url).then(r => r.json());
      setDiff(res.diff);
      setSelectedFile(filePath || null);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchStatus();
    loadDiff();
  }, []);

  return (
    <div className="flex h-full bg-[#0a0a0c] border border-zinc-800 ares-cut overflow-hidden">
      {/* Left Sidebar: Git Status & File Tree */}
      <div className="w-80 border-r border-zinc-800 flex flex-col bg-[#121216]">
        {/* Branch Header */}
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <GitBranch size={14} className="text-[#ff003c]" />
            <span className="text-xs font-bold text-zinc-200">
              Branch: <strong className="text-[#00f0ff]">{gitStatus?.current || 'main'}</strong>
            </span>
          </div>
          <button
            onClick={fetchStatus}
            className="p-1 text-zinc-400 hover:text-white transition"
            title="Atualizar Status"
          >
            <RefreshCw size={13} className={isLoading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Modified / Staged list */}
        <div className="p-3 border-b border-zinc-800/80 bg-[#0a0a0c]">
          <div className="text-[10px] font-bold text-zinc-400 mb-1.5 tracking-wider">MODIFIED ARTIFACTS</div>
          {gitStatus?.modified && gitStatus.modified.length > 0 ? (
            <div className="space-y-1">
              {gitStatus.modified.map(file => (
                <div
                  key={file}
                  onClick={() => loadDiff(file)}
                  className={`flex items-center justify-between text-xs px-2 py-1 ares-cut-sm cursor-pointer transition ${
                    selectedFile === file ? 'bg-[#ff003c]/20 text-white border border-[#ff003c]/40' : 'text-zinc-300 hover:bg-zinc-900'
                  }`}
                >
                  <span className="truncate">{file}</span>
                  <span className="text-[10px] text-amber-400 font-mono">MOD</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-[11px] text-zinc-600 italic">Working tree clean</div>
          )}
        </div>

        {/* Workspace Files List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="text-[10px] font-bold text-zinc-400 mb-1.5 tracking-wider">PROJECT FILES</div>
          {files.map(item => {
            if (item.isDirectory) {
              return (
                <div key={item.path} className="flex items-center space-x-1.5 text-zinc-400 text-xs py-0.5">
                  <Folder size={12} className="text-zinc-500" />
                  <span className="font-semibold">{item.name}</span>
                </div>
              );
            }

            const isCls = item.name.endsWith('.cls') || item.name.endsWith('.mac');
            const isSql = item.name.endsWith('.sql');

            return (
              <div
                key={item.path}
                className="group flex items-center justify-between text-xs px-2 py-1 rounded-xs hover:bg-zinc-900 text-zinc-300 transition"
              >
                <div
                  className="flex items-center space-x-1.5 truncate cursor-pointer flex-1"
                  onClick={() => onOpenFile(item.path)}
                >
                  <FileCode size={12} className={isCls ? 'text-[#ff003c]' : isSql ? 'text-[#00f0ff]' : 'text-zinc-500'} />
                  <span className="truncate">{item.name}</span>
                </div>

                {/* Quick Action Icons */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1 transition">
                  {isCls && (
                    <button
                      onClick={() => onDeployToIris(item.path)}
                      title="Compilar no IRIS (/overwrite)"
                      className="p-1 hover:text-[#ff003c] transition"
                    >
                      <Play size={11} />
                    </button>
                  )}
                  {isSql && (
                    <button
                      onClick={() => onValidateSql(item.path)}
                      title="Validar Read-Only (SQL Guard)"
                      className="p-1 hover:text-[#00f0ff] transition"
                    >
                      <ShieldCheck size={11} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right: Diff Viewer */}
      <div className="flex-1 flex flex-col bg-[#0a0a0c]">
        <div className="h-10 bg-[#121216] border-b border-zinc-800 flex items-center justify-between px-3">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-400">Diff Viewer:</span>
            <strong className="text-[#00f0ff]">{selectedFile || 'All Changes'}</strong>
          </div>
          {selectedFile && (
            <button
              onClick={() => onOpenFile(selectedFile)}
              className="text-xs text-zinc-400 hover:text-white px-2 py-0.5 border border-zinc-800 ares-cut-sm bg-zinc-900"
            >
              Open Full File
            </button>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 font-mono text-xs">
          {diff ? (
            <pre className="space-y-0.5">
              {diff.split('\n').map((line, idx) => {
                let color = 'text-zinc-400';
                if (line.startsWith('+') && !line.startsWith('+++')) color = 'text-emerald-400 bg-emerald-950/20';
                if (line.startsWith('-') && !line.startsWith('---')) color = 'text-[#ff003c] bg-red-950/20';
                if (line.startsWith('@')) color = 'text-[#00f0ff] font-bold';
                return (
                  <div key={idx} className={`${color} px-2 py-0.5`}>
                    {line}
                  </div>
                );
              })}
            </pre>
          ) : (
            <div className="h-full flex items-center justify-center text-zinc-600 italic">
              Nenhuma alteração git pendente no arquivo selecionado.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
