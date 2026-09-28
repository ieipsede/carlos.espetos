import React from 'react';
import { Compra } from '../types';
import { formatBRL } from '../services/db';

interface MetricsCardsProps {
  compras: Compra[];
}

export const MetricsCards: React.FC<MetricsCardsProps> = ({ compras }) => {
  const totalCompras = compras.reduce((acc, c) => acc + c.valor, 0);
  const qtdLancamentos = compras.length;

  const pagos = compras.filter(c => c.status === 'PAGO');
  const totalPago = pagos.reduce((acc, c) => acc + c.valor, 0);

  const pendentes = compras.filter(c => c.status === 'PENDENTE');
  const totalPendente = pendentes.reduce((acc, c) => acc + c.valor, 0);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <div className="bg-[#111827] border border-[#1F2937] hover:border-blue-500/50 rounded-2xl p-5 shadow-lg shadow-black/40 transition hover:-translate-y-0.5">
        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>💳 Total de Compras</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          {formatBRL(totalCompras)}
        </div>
        <div className="text-xs text-slate-500 mt-1.5 font-medium">
          Valor total acumulado
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] hover:border-blue-500/50 rounded-2xl p-5 shadow-lg shadow-black/40 transition hover:-translate-y-0.5">
        <div className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>📦 Lançamentos / Boletos</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-slate-100 tracking-tight">
          {qtdLancamentos}
        </div>
        <div className="text-xs text-slate-500 mt-1.5 font-medium">
          Movimentações cadastradas
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg shadow-black/40 transition hover:-translate-y-0.5">
        <div className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>✅ Liquidado (Pago)</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-emerald-400 tracking-tight">
          {formatBRL(totalPago)}
        </div>
        <div className="text-xs text-slate-500 mt-1.5 font-medium">
          {pagos.length} {pagos.length === 1 ? 'despesa quitada' : 'despesas quitadas'}
        </div>
      </div>

      <div className="bg-[#111827] border border-[#1F2937] hover:border-amber-500/50 rounded-2xl p-5 shadow-lg shadow-black/40 transition hover:-translate-y-0.5">
        <div className="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1 flex items-center justify-between">
          <span>⏳ A Pagar (Pendente)</span>
        </div>
        <div className="text-2xl sm:text-3xl font-extrabold text-amber-400 tracking-tight">
          {formatBRL(totalPendente)}
        </div>
        <div className="text-xs text-slate-500 mt-1.5 font-medium">
          {pendentes.length} {pendentes.length === 1 ? 'conta pendente' : 'contas pendentes'}
        </div>
      </div>
    </div>
  );
};
