import React, { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { X, Save, Play, ShieldCheck, Check } from 'lucide-react';

interface FileEditorModalProps {
  filePath: string | null;
  onClose: () => void;
  onDeployToIris: (filePath: string) => void;
  onValidateSql: (filePath: string) => void;
}

export const FileEditorModal: React.FC<FileEditorModalProps> = ({
  filePath,
  onClose,
  onDeployToIris,
  onValidateSql,
}) => {
  const [content, setContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (!filePath) return;
    setIsLoading(true);
    fetch(`/api/git/file?path=${encodeURIComponent(filePath)}`)
      .then(res => res.json())
      .then(data => {
        setContent(data.content || '');
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [filePath]);

  const handleSave = async () => {
    if (!filePath) return;
    try {
      await fetch('/api/git/file', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ path: filePath, content }),
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  if (!filePath) return null;

  const isSql = filePath.endsWith('.sql');
  const isCls = filePath.endsWith('.cls') || filePath.endsWith('.mac');
  const language = isSql ? 'sql' : isCls ? 'csharp' : 'plaintext'; // csharp has good highlighing fallback for cls

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
      <div className="w-full max-w-5xl h-[85vh] bg-[#121216] border border-[#ff003c]/60 ares-cut flex flex-col shadow-[0_0_30px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Editor Header */}
        <div className="h-12 bg-[#0a0a0c] border-b border-zinc-800 flex items-center justify-between px-4">
          <div className="flex items-center space-x-2 text-xs">
            <span className="text-zinc-500 font-mono">FILE:</span>
            <strong className="text-[#00f0ff] font-mono">{filePath}</strong>
            {isSaved && (
              <span className="flex items-center space-x-1 text-emerald-400 text-[10px] ml-2">
                <Check size={12} />
                <span>SAVED</span>
              </span>
            )}
          </div>

          <div className="flex items-center space-x-2 text-xs">
            {isCls && (
              <button
                onClick={() => onDeployToIris(filePath)}
                className="flex items-center space-x-1 px-3 py-1 bg-[#ff003c]/20 border border-[#ff003c] text-[#ff003c] ares-cut-sm hover:bg-[#ff003c] hover:text-white transition"
              >
                <Play size={12} />
                <span>Compile IRIS</span>
              </button>
            )}

            {isSql && (
              <button
                onClick={() => onValidateSql(filePath)}
                className="flex items-center space-x-1 px-3 py-1 bg-[#00f0ff]/10 border border-[#00f0ff] text-[#00f0ff] ares-cut-sm hover:bg-[#00f0ff] hover:text-black transition"
              >
                <ShieldCheck size={12} />
                <span>Validate SQL</span>
              </button>
            )}

            <button
              onClick={handleSave}
              className="flex items-center space-x-1 px-3 py-1 bg-zinc-800 text-zinc-200 border border-zinc-700 ares-cut-sm hover:bg-zinc-700 transition"
            >
              <Save size={12} />
              <span>Save</span>
            </button>

            <button onClick={onClose} className="p-1 text-zinc-500 hover:text-white transition ml-2">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Monaco Editor Container */}
        <div className="flex-1 overflow-hidden bg-[#0a0a0c]">
          {isLoading ? (
            <div className="h-full flex items-center justify-center text-zinc-500 text-xs">
              Carregando arquivo...
            </div>
          ) : (
            <Editor
              height="100%"
              theme="vs-dark"
              language={language}
              value={content}
              onChange={val => setContent(val || '')}
              options={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: 13,
                minimap: { enabled: true },
                scrollBeyondLastLine: false,
                renderLineHighlight: 'all',
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
};
