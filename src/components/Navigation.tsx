import React from 'react';
import { PlusCircle, Globe } from 'lucide-react';

interface NavigationProps {
  unidadeSelecionada: number;
  onSelectUnidade: (id: number) => void;
  onOpenCadastro: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  unidadeSelecionada,
  onSelectUnidade,
  onOpenCadastro
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 flex-1">
        <button
          onClick={() => onSelectUnidade(0)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition shadow-sm ${
            unidadeSelecionada === 0
              ? 'bg-blue-600 text-white shadow-blue-500/25 ring-2 ring-blue-400'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <Globe className="w-4 h-4 text-blue-400" />
          <span>CONSOLIDADA</span>
        </button>

        <button
          onClick={() => onSelectUnidade(1)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition shadow-sm ${
            unidadeSelecionada === 1
              ? 'bg-amber-600 text-white shadow-amber-500/25 ring-2 ring-amber-400'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span>🍽️</span>
          <span>RESTAURANTE</span>
        </button>

        <button
          onClick={() => onSelectUnidade(2)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition shadow-sm ${
            unidadeSelecionada === 2
              ? 'bg-emerald-600 text-white shadow-emerald-500/25 ring-2 ring-emerald-400'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span>🏪</span>
          <span>CONVENIÊNCIA</span>
        </button>

        <button
          onClick={() => onSelectUnidade(3)}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition shadow-sm ${
            unidadeSelecionada === 3
              ? 'bg-indigo-600 text-white shadow-indigo-500/25 ring-2 ring-indigo-400'
              : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white'
          }`}
        >
          <span>🎉</span>
          <span>BUFFET</span>
        </button>
      </div>

      <button
        onClick={onOpenCadastro}
        className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition transform active:scale-95"
      >
        <PlusCircle className="w-4 h-4" />
        <span>NOVA COMPRA</span>
      </button>
    </div>
  );
};
