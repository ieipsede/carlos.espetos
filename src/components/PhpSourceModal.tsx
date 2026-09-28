import React, { useState } from 'react';
import { FileCode, Copy, Check, Download, X } from 'lucide-react';

interface PhpSourceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PhpSourceModal: React.FC<PhpSourceModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleDownload = () => {
    // Busca o arquivo index.php diretamente
    fetch('/index.php')
      .then(res => res.text())
      .then(content => {
        const blob = new Blob([content], { type: 'application/x-php' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'index.php';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      })
      .catch(() => {
        alert('Erro ao baixar index.php');
      });
  };

  const handleCopy = () => {
    fetch('/index.php')
      .then(res => res.text())
      .then(content => {
        navigator.clipboard.writeText(content).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2500);
        });
      })
      .catch(() => {
        alert('Erro ao copiar conteúdo.');
      });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-2xl w-full p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <FileCode className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-100">
              Arquivo index.php Criado com Sucesso!
            </h3>
            <p className="text-slate-400 text-xs mt-0.5">
              Todo o código Python/Streamlit foi convertido para PHP puro em arquivo único.
            </p>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-slate-800 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
          <div className="font-bold text-slate-100 flex items-center gap-2">
            <span>🚀 Como executar o seu index.php:</span>
          </div>
          <p className="text-slate-400 leading-relaxed">
            O arquivo <code className="text-purple-300 font-mono">index.php</code> está salvo na raiz do projeto e é 100% autossuficiente (inclui banco SQLite embutido via PDO, rotas HTTP GET/POST, e interface completa).
          </p>
          <div className="bg-slate-950 p-3 rounded-xl font-mono text-[11px] text-emerald-400 border border-slate-800 flex items-center justify-between">
            <span>php -S 0.0.0.0:8000 index.php</span>
          </div>
          <p className="text-[11px] text-slate-500">
            Compatível com PHP 7.4, 8.0, 8.1, 8.2, 8.3, Apache, Nginx, XAMPP, Laragon e Docker.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
          <button
            onClick={handleDownload}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white flex items-center justify-center gap-2 shadow-lg shadow-blue-600/25 transition"
          >
            <Download className="w-4 h-4" />
            <span>Baixar index.php</span>
          </button>

          <button
            onClick={handleCopy}
            className="w-full sm:flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-2 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copiado para Área de Transferência!' : 'Copiar Código PHP'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
