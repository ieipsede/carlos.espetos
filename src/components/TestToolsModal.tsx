import React, { useState } from 'react';
import { AlertTriangle, RotateCcw, Trash2, X } from 'lucide-react';

interface TestToolsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onZerar: () => void;
  onRestaurar: () => void;
}

export const TestToolsModal: React.FC<TestToolsModalProps> = ({
  isOpen,
  onClose,
  onZerar,
  onRestaurar
}) => {
  const [confirmZerar, setConfirmZerar] = useState(false);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
            <span>🧪 Ferramentas de Teste & Manutenção</span>
          </h3>
          <p className="text-slate-400 text-xs mt-1">
            Painel de controle para gerenciar dados no ambiente de testes.
          </p>
        </div>

        {/* 1. Zerar Registros */}
        <div className="bg-red-950/20 border border-red-500/30 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-red-400 font-bold text-sm">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>⚠️ Zerar Todos os Registros (Modo Teste)</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            🚨 <strong>Atenção:</strong> Esta ação apagará todos os registros de compras e resetará os contadores para um ambiente limpo.
          </p>

          <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={confirmZerar}
              onChange={e => setConfirmZerar(e.target.checked)}
              className="rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500"
            />
            <span>Confirmo que desejo apagar TODOS os registros</span>
          </label>

          {confirmZerar && (
            <button
              onClick={() => {
                onZerar();
                setConfirmZerar(false);
                onClose();
              }}
              className="w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 text-white transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/30"
            >
              <Trash2 className="w-4 h-4" />
              <span>EXECUTAR LIMPEZA TOTAL</span>
            </button>
          )}
        </div>

        {/* 2. Restaurar Dados */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-3">
          <div className="flex items-center gap-2 text-blue-400 font-bold text-sm">
            <RotateCcw className="w-4 h-4 shrink-0" />
            <span>🔄 Restaurar Dados de Demonstração</span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Recarrega a massa padrão de compras e boletos das 3 unidades (Restaurante, Conveniência e Buffet) com vencimentos calculados a partir da data de hoje.
          </p>
          <button
            onClick={() => {
              onRestaurar();
              onClose();
            }}
            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition flex items-center justify-center gap-2 shadow-sm"
          >
            <RotateCcw className="w-4 h-4 text-emerald-400" />
            <span>Restaurar Amostras Iniciais</span>
          </button>
        </div>

        <div className="text-right pt-2">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
