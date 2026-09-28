import React from 'react';
import { Trash2 } from 'lucide-react';

interface HeaderProps {
  onOpenPhpModal: () => void;
  onOpenClearModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenPhpModal,
  onOpenClearModal
}) => {
  return (
    <header className="pt-4 pb-2 text-center relative">
      <div className="absolute right-0 top-3 flex items-center gap-2">
        <button
          onClick={onOpenClearModal}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/50 hover:text-white transition shadow-sm"
          title="Zerar todos os registros de compras"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-400" />
          <span>Zerar Dados</span>
        </button>

        <button
          onClick={onOpenPhpModal}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-purple-950/40 border border-purple-500/40 text-purple-300 hover:bg-purple-900/50 hover:text-white transition"
          title="Ver e Baixar index.php"
        >
          <span className="font-mono text-purple-400">&lt;?php</span>
          <span className="hidden sm:inline">index.php</span>
        </button>
      </div>

      <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-widest uppercase brand-gradient mb-1">
        CARLÃO
      </h1>
      <div className="text-slate-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-5">
        SISTEMA INTEGRADO DE GESTÃO DE COMPRAS
      </div>

      <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6">
        <div className="bg-gray-900/90 border border-amber-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-200 inline-flex items-center gap-2 shadow-lg shadow-amber-950/20">
          <span className="text-base">🍽️</span>
          <strong className="text-amber-300">1. RESTAURANTE</strong>
          <span className="text-slate-400 hidden md:inline text-[11px]">(Cozinha, Salão & Insumos de Preparo)</span>
        </div>

        <div className="bg-gray-900/90 border border-emerald-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-200 inline-flex items-center gap-2 shadow-lg shadow-emerald-950/20">
          <span className="text-base">🏪</span>
          <strong className="text-emerald-300">2. CONVENIÊNCIA</strong>
          <span className="text-slate-400 hidden md:inline text-[11px]">(Produtos Prontos, Tabacaria & Bebidas Geladas)</span>
        </div>

        <div className="bg-gray-900/90 border border-indigo-500/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-200 inline-flex items-center gap-2 shadow-lg shadow-indigo-950/20">
          <span className="text-base">🎉</span>
          <strong className="text-indigo-300">3. BUFFET</strong>
          <span className="text-slate-400 hidden md:inline text-[11px]">(Eventos, Serviços Corporativos & Recepções)</span>
        </div>
      </div>
    </header>
  );
};
