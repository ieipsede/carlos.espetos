import React, { useState } from 'react';
import { AlertTriangle, Trash2, X, Database } from 'lucide-react';

interface ClearDatabaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmClear: () => void;
  totalRegistros: number;
}

export const ClearDatabaseModal: React.FC<ClearDatabaseModalProps> = ({
  isOpen,
  onClose,
  onConfirmClear,
  totalRegistros
}) => {
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onConfirmClear();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#111827] border border-red-500/40 rounded-3xl max-w-lg w-full p-6 space-y-5 shadow-2xl relative shadow-red-950/40 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-400 shrink-0">
            <Trash2 className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-100 flex items-center gap-2">
              <span>Zerar Dados</span>
            </h3>
            <p className="text-red-400 text-xs font-semibold mt-0.5">
              Limpeza de registros de compras (DELETE FROM compras)
            </p>
          </div>
        </div>

        <div className="bg-[#0F172A] border border-red-900/40 rounded-2xl p-4 text-xs text-slate-300 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>Confirmação de Limpeza</span>
          </div>

          <p className="text-slate-200 text-sm font-semibold leading-relaxed">
            Tem certeza que deseja apagar todos os registros de compras?
          </p>

          <p className="text-slate-400 leading-relaxed">
            Esta operação apagará todos os <strong className="text-white">{totalRegistros} lançamentos</strong> cadastrados no sistema (Restaurante, Conveniência e Buffet).
          </p>

          <div className="bg-slate-950 p-2.5 rounded-xl font-mono text-[11px] text-red-400 border border-slate-800 flex items-center gap-2">
            <Database className="w-3.5 h-3.5 shrink-0 text-slate-400" />
            <span className="truncate">DELETE FROM compras; VACUUM;</span>
          </div>

          <p className="text-slate-400 text-[11px] leading-relaxed">
            Ao confirmar, o sistema executará a limpeza no banco de dados SQLite e recarregará a página totalmente zerada.
          </p>
        </div>

        <label className="flex items-start gap-2.5 text-xs text-slate-300 cursor-pointer p-2 bg-slate-900/60 rounded-xl border border-slate-800 select-none">
          <input
            type="checkbox"
            checked={confirmCheckbox}
            onChange={e => setConfirmCheckbox(e.target.checked)}
            className="mt-0.5 rounded border-slate-700 bg-slate-900 text-red-600 focus:ring-red-500 w-4 h-4"
          />
          <span>
            Sim, tenho certeza que desejo apagar todos os registros e recarregar a lista zerada.
          </span>
        </label>

        <div className="flex flex-col-reverse sm:flex-row items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            disabled={!confirmCheckbox}
            className="w-full sm:w-auto sm:flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-black uppercase tracking-wider bg-red-600 hover:bg-red-500 disabled:opacity-40 disabled:hover:bg-red-600 disabled:cursor-not-allowed text-white transition flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 active:scale-95"
          >
            <Trash2 className="w-4 h-4" />
            <span>Zerar Dados</span>
          </button>
        </div>
      </div>
    </div>
  );
};
