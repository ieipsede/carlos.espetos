import React from 'react';
import { Compra } from '../types';
import { formatBRL, formatBRDate, parseDate } from '../services/db';
import { CheckCircle2, AlertCircle, Calendar, Check, Info } from 'lucide-react';

interface NextDueCardProps {
  compras: Compra[];
  onDarBaixa: (id: number) => void;
  onGoToRecordsTab: () => void;
}

export const NextDueCard: React.FC<NextDueCardProps> = ({
  compras,
  onDarBaixa,
  onGoToRecordsTab
}) => {
  const pendentes = compras
    .filter(c => c.status === 'PENDENTE')
    .sort((a, b) => {
      const dateA = a.vencimento || '9999-12-31';
      const dateB = b.vencimento || '9999-12-31';
      return dateA.localeCompare(dateB);
    });

  if (pendentes.length === 0) {
    return (
      <div className="bg-[#0F172A] border border-emerald-500/40 rounded-2xl p-8 text-center my-4 shadow-xl">
        <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <CheckCircle2 className="w-9 h-9" />
        </div>
        <h3 className="text-xl font-extrabold text-emerald-400 mb-2">
          🎉 Excelente! Nenhuma pendência!
        </h3>
        <p className="text-slate-300 text-sm max-w-lg mx-auto">
          Não há contas ou boletos pendentes para a unidade selecionada. Tudo liquidado e em dia!
        </p>
      </div>
    );
  }

  const proximo = pendentes[0];
  const totalOutros = pendentes.length - 1;

  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);

  const dtVenc = parseDate(proximo.vencimento);
  dtVenc.setHours(0, 0, 0, 0);

  const diffTime = dtVenc.getTime() - hoje.getTime();
  const diasDiff = Math.round(diffTime / (1000 * 60 * 60 * 24));

  let statusBadge = '';
  let urgenciaTxt = '';
  let borderLeftColor = '';
  let badgeBg = '';
  let badgeText = '';
  let containerBg = '';

  if (diasDiff < 0) {
    const atraso = Math.abs(diasDiff);
    statusBadge = `🚨 VENCIDO (Atrasado há ${atraso} dia${atraso > 1 ? 's' : ''})`;
    urgenciaTxt = 'Urgente - Exige Pagamento Imediato';
    borderLeftColor = 'border-l-red-500';
    badgeBg = 'bg-red-500 text-white';
    badgeText = 'text-red-400';
    containerBg = 'bg-red-950/20 border-red-500/40';
  } else if (diasDiff === 0) {
    statusBadge = '🚨 VENCE HOJE!';
    urgenciaTxt = 'Atenção - Vencimento na data de hoje';
    borderLeftColor = 'border-l-red-500';
    badgeBg = 'bg-red-500 text-white';
    badgeText = 'text-red-400';
    containerBg = 'bg-red-950/20 border-red-500/40';
  } else if (diasDiff === 1) {
    statusBadge = '⚠️ VENCE AMANHÃ!';
    urgenciaTxt = 'Atenção - Vence amanhã';
    borderLeftColor = 'border-l-amber-500';
    badgeBg = 'bg-amber-500 text-slate-950';
    badgeText = 'text-amber-400';
    containerBg = 'bg-amber-950/20 border-amber-500/40';
  } else if (diasDiff <= 7) {
    statusBadge = `⚠️ VENCE EM ${diasDiff} DIAS`;
    urgenciaTxt = 'Vencimento nesta semana';
    borderLeftColor = 'border-l-amber-400';
    badgeBg = 'bg-amber-400 text-slate-950';
    badgeText = 'text-amber-300';
    containerBg = 'bg-amber-950/20 border-amber-500/30';
  } else {
    statusBadge = `📅 VENCE EM ${diasDiff} DIAS`;
    urgenciaTxt = 'Programado para as próximas semanas';
    borderLeftColor = 'border-l-blue-500';
    badgeBg = 'bg-blue-600 text-white';
    badgeText = 'text-blue-400';
    containerBg = 'bg-blue-950/20 border-blue-500/30';
  }

  return (
    <div className="space-y-4 my-2">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <span>🔔 Próximo Vencimento & Dar Baixa</span>
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Visão simplificada: acompanhe <strong>apenas o próximo pagamento pendente</strong> com maior prioridade temporal.
          </p>
        </div>
      </div>

      <div
        className={`border border-l-8 ${borderLeftColor} ${containerBg} rounded-2xl p-5 sm:p-7 shadow-xl shadow-black/40`}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span
            className={`text-xs font-black px-3 py-1.5 rounded-md uppercase tracking-wider shadow-sm ${badgeBg}`}
          >
            {statusBadge}
          </span>
          <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-slate-400" />
            {urgenciaTxt}
          </span>
        </div>

        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="flex-1 space-y-3">
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-slate-100 tracking-tight mb-1">
                {proximo.fornecedor}
              </h2>
              <p className="text-slate-300 text-base sm:text-lg font-medium">
                {proximo.descricao}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 pt-1">
              <span className="bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-md font-semibold flex items-center gap-1">
                <span>{proximo.icone_unidade}</span>
                <strong>{proximo.unidade}</strong>
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
                🏷️ {proximo.categoria}
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
                📄 NF: <strong className="text-slate-200">{proximo.numero_nf || 'S/N'}</strong>
              </span>
              <span className="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">
                💳 {proximo.forma_pagamento}
              </span>
            </div>
          </div>

          <div className="md:text-right flex flex-col md:items-end justify-between pt-2 border-t md:border-t-0 border-slate-800/80">
            <div className="text-[11px] uppercase tracking-wider font-bold text-slate-400">
              Valor da Fatura / Boleto
            </div>
            <div className={`text-3xl sm:text-4xl font-black tracking-tight ${badgeText} my-1`}>
              {formatBRL(proximo.valor)}
            </div>
            <div className="text-xs text-slate-300 font-medium flex items-center gap-1.5 md:justify-end">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Data de Vencimento:</span>
              <strong className="text-slate-100">{formatBRDate(proximo.vencimento)}</strong>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 pt-1">
        <div className="md:col-span-2">
          <button
            onClick={() => onDarBaixa(proximo.id)}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 px-6 rounded-xl font-black text-sm tracking-wide bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/30 transition transform active:scale-98"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            <span>DAR BAIXA / CONFIRMAR PAGAMENTO</span>
          </button>
        </div>

        <div className="md:col-span-3">
          {totalOutros > 0 ? (
            <div className="h-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-slate-300">
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-blue-400 shrink-0" />
                <span>
                  Há outros <strong className="text-blue-400">{totalOutros} pagamentos pendentes</strong> na fila.
                </span>
              </div>
              <button
                onClick={onGoToRecordsTab}
                className="text-blue-400 hover:text-blue-300 font-bold underline underline-offset-2 shrink-0 ml-2"
              >
                Ver todos
              </button>
            </div>
          ) : (
            <div className="h-full bg-slate-900/80 border border-slate-800 rounded-xl px-4 py-3 flex items-center text-xs text-slate-400">
              <span>Este é o último pagamento pendente na fila!</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
