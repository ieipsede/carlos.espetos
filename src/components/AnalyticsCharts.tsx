import React, { useState, useMemo } from 'react';
import { Compra } from '../types';
import { formatBRL } from '../services/db';

interface AnalyticsChartsProps {
  compras: Compra[];
  unidadeSelecionada: number;
}

const PALETTE = [
  '#3B82F6', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6',
  '#06B6D4', '#F97316', '#6366F1', '#14B8A6', '#84CC16',
  '#EAB308', '#D946EF', '#64748B', '#0EA5E9'
];

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  compras,
  unidadeSelecionada
}) => {
  const [hoveredCat, setHoveredCat] = useState<string | null>(null);

  // 1. Agrupamento por Categoria
  const dadosCategoria = useMemo(() => {
    const mapa = new Map<string, number>();
    let total = 0;
    compras.forEach(c => {
      const cat = c.categoria || 'Outros';
      mapa.set(cat, (mapa.get(cat) || 0) + c.valor);
      total += c.valor;
    });

    const lista = Array.from(mapa.entries())
      .map(([categoria, valor], index) => ({
        categoria,
        valor,
        percentual: total > 0 ? (valor / total) * 100 : 0,
        cor: PALETTE[index % PALETTE.length]
      }))
      .sort((a, b) => b.valor - a.valor);

    return { lista, total };
  }, [compras]);

  // 2. Agrupamento por Forma de Pagamento
  const dadosPagamento = useMemo(() => {
    const mapa = new Map<string, number>();
    let total = 0;
    compras.forEach(c => {
      const forma = c.forma_pagamento || 'Outros';
      mapa.set(forma, (mapa.get(forma) || 0) + c.valor);
      total += c.valor;
    });

    const maxValor = Math.max(...Array.from(mapa.values()), 1);

    const lista = Array.from(mapa.entries())
      .map(([forma, valor]) => ({
        forma,
        valor,
        percentualBarra: (valor / maxValor) * 100
      }))
      .sort((a, b) => b.valor - a.valor);

    return { lista, total, maxValor };
  }, [compras]);

  // 3. Comparativo entre Unidades (se visão consolidada)
  const dadosUnidade = useMemo(() => {
    const mapa = {
      RESTAURANTE: 0,
      CONVENIÊNCIA: 0,
      BUFFET: 0
    };
    compras.forEach(c => {
      if (c.estabelecimento_id === 1) mapa.RESTAURANTE += c.valor;
      else if (c.estabelecimento_id === 2) mapa.CONVENIÊNCIA += c.valor;
      else if (c.estabelecimento_id === 3) mapa.BUFFET += c.valor;
    });

    const total = mapa.RESTAURANTE + mapa.CONVENIÊNCIA + mapa.BUFFET;
    const maxVal = Math.max(mapa.RESTAURANTE, mapa.CONVENIÊNCIA, mapa.BUFFET, 1);

    return [
      {
        nome: 'RESTAURANTE',
        icone: '🍽️',
        valor: mapa.RESTAURANTE,
        cor: '#F59E0B',
        barClass: 'bg-amber-500',
        percent: total > 0 ? (mapa.RESTAURANTE / total) * 100 : 0,
        barPercent: (mapa.RESTAURANTE / maxVal) * 100
      },
      {
        nome: 'CONVENIÊNCIA',
        icone: '🏪',
        valor: mapa.CONVENIÊNCIA,
        cor: '#10B981',
        barClass: 'bg-emerald-500',
        percent: total > 0 ? (mapa.CONVENIÊNCIA / total) * 100 : 0,
        barPercent: (mapa.CONVENIÊNCIA / maxVal) * 100
      },
      {
        nome: 'BUFFET',
        icone: '🎉',
        valor: mapa.BUFFET,
        cor: '#6366F1',
        barClass: 'bg-indigo-500',
        percent: total > 0 ? (mapa.BUFFET / total) * 100 : 0,
        barPercent: (mapa.BUFFET / maxVal) * 100
      }
    ];
  }, [compras]);

  if (compras.length === 0) {
    return (
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-8 text-center text-slate-400 text-sm my-4">
        ⚠️ Não há dados suficientes para gerar os gráficos analíticos.
      </div>
    );
  }

  // Gera os arcos SVG do Donut Chart
  let cumulativeAngle = 0;
  const donutArcs = dadosCategoria.lista.map(item => {
    const angle = (item.percentual / 100) * 360;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const r = 80;
    const cx = 100;
    const cy = 100;

    const startRad = (startAngle - 90) * (Math.PI / 180);
    const endRad = (endAngle - 90) * (Math.PI / 180);

    const x1 = cx + r * Math.cos(startRad);
    const y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad);
    const y2 = cy + r * Math.sin(endRad);

    const largeArc = angle > 180 ? 1 : 0;
    const d = `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;

    return {
      ...item,
      d,
      startAngle,
      endAngle
    };
  });

  return (
    <div className="space-y-6 my-2">
      <div>
        <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
          <span>📈 Painel Analítico de Gastos & Boletos</span>
        </h3>
        <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
          Distribuição proporcional por categoria, modalidades de quitação e balanço entre unidades.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Gráfico de Categoria */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span>🎯 Gastos por Categoria</span>
            <span className="text-xs text-slate-400 font-mono">
              Total: {formatBRL(dadosCategoria.total)}
            </span>
          </h4>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-2">
            {/* SVG Donut */}
            <div className="relative w-48 h-48 shrink-0">
              <svg viewBox="0 0 200 200" className="w-full h-full transform -rotate-90">
                <circle cx="100" cy="100" r="80" fill="transparent" stroke="#1E293B" strokeWidth="26" />
                {donutArcs.map((arc, i) => (
                  <circle
                    key={i}
                    cx="100"
                    cy="100"
                    r="80"
                    fill="transparent"
                    stroke={arc.cor}
                    strokeWidth={hoveredCat === arc.categoria ? "32" : "26"}
                    strokeDasharray={`${(arc.percentual / 100) * 502.65} 502.65`}
                    strokeDashoffset={`${-(arc.startAngle / 360) * 502.65}`}
                    className="transition-all duration-200 cursor-pointer"
                    onMouseEnter={() => setHoveredCat(arc.categoria)}
                    onMouseLeave={() => setHoveredCat(null)}
                  />
                ))}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
                <span className="text-[10px] uppercase font-bold text-slate-400">Total</span>
                <span className="text-xs font-black text-slate-100 font-mono">
                  {dadosCategoria.lista.length} cats
                </span>
              </div>
            </div>

            {/* Legenda Lateral */}
            <div className="w-full space-y-1.5 max-h-56 overflow-y-auto pr-1 text-xs">
              {dadosCategoria.lista.map((item, idx) => (
                <div
                  key={idx}
                  onMouseEnter={() => setHoveredCat(item.categoria)}
                  onMouseLeave={() => setHoveredCat(null)}
                  className={`flex items-center justify-between p-1.5 rounded-lg transition ${
                    hoveredCat === item.categoria ? 'bg-slate-800' : 'hover:bg-slate-800/50'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0"
                      style={{ backgroundColor: item.cor }}
                    />
                    <span className="truncate text-slate-300 font-medium">{item.categoria}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 font-mono">
                    <span className="text-slate-400">{item.percentual.toFixed(1)}%</span>
                    <strong className="text-slate-200">{formatBRL(item.valor)}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 2. Gráfico por Forma de Pagamento */}
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider flex items-center justify-between">
            <span>💳 Formas de Pagamento</span>
            <span className="text-xs text-slate-400 font-mono">À Vista vs Boletos</span>
          </h4>

          <div className="space-y-3 pt-2">
            {dadosPagamento.lista.map((item, idx) => (
              <div key={idx} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-300">{item.forma}</span>
                  <span className="font-mono font-bold text-slate-200">{formatBRL(item.valor)}</span>
                </div>
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.percentualBarra}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 3. Comparativo entre as 3 Unidades (Visão Consolidada) */}
      {unidadeSelecionada === 0 && (
        <div className="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg space-y-4">
          <h4 className="text-sm font-extrabold text-slate-200 uppercase tracking-wider">
            🏢 Comparativo de Gastos entre as 3 Unidades do Grupo Carlão
          </h4>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            {dadosUnidade.map((item, idx) => (
              <div
                key={idx}
                className="bg-slate-900/90 border border-slate-800 rounded-xl p-4 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-base flex items-center gap-1.5 font-bold" style={{ color: item.cor }}>
                    <span>{item.icone}</span>
                    <span>{item.nome}</span>
                  </span>
                  <span className="text-xs font-mono font-bold text-slate-400">
                    {item.percent.toFixed(1)}%
                  </span>
                </div>

                <div className="text-2xl font-black text-slate-100 font-mono">
                  {formatBRL(item.valor)}
                </div>

                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${item.barClass} rounded-full transition-all duration-500`}
                    style={{ width: `${item.barPercent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
