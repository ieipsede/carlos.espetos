import React, { useState, useMemo } from 'react';
import { Compra, StatusCompra } from '../types';
import { formatBRL, formatBRDate, exportToCSV, CATEGORIAS_PADRAO } from '../services/db';
import { Search, Download, Trash2, CheckCircle, RotateCcw, AlertTriangle } from 'lucide-react';

interface RecordsTableProps {
  compras: Compra[];
  onToggleStatus: (id: number, currentStatus: StatusCompra) => void;
  onDeleteCompra: (id: number) => void;
}

export const RecordsTable: React.FC<RecordsTableProps> = ({
  compras,
  onToggleStatus,
  onDeleteCompra
}) => {
  const [busca, setBusca] = useState('');
  const [filtroStatus, setFiltroStatus] = useState<string>('TODOS');
  const [filtroCategoria, setFiltroCategoria] = useState<string>('TODAS');
  const [idParaExcluir, setIdParaExcluir] = useState<string>('');
  const [itemConfirmDelete, setItemConfirmDelete] = useState<Compra | null>(null);

  const categoriasDisponiveis = useMemo(() => {
    const cats = new Set<string>();
    CATEGORIAS_PADRAO.forEach(c => cats.add(c));
    compras.forEach(c => {
      if (c.categoria) cats.add(c.categoria);
    });
    return Array.from(cats).sort();
  }, [compras]);

  const filtrados = useMemo(() => {
    return compras.filter(item => {
      if (filtroStatus !== 'TODOS' && item.status !== filtroStatus) {
        return false;
      }
      if (filtroCategoria !== 'TODAS' && item.categoria !== filtroCategoria) {
        return false;
      }
      if (busca.trim()) {
        const termo = busca.toLowerCase();
        const fornecedor = (item.fornecedor || '').toLowerCase();
        const descricao = (item.descricao || '').toLowerCase();
        const nf = (item.numero_nf || '').toLowerCase();
        const cat = (item.categoria || '').toLowerCase();
        if (
          !fornecedor.includes(termo) &&
          !descricao.includes(termo) &&
          !nf.includes(termo) &&
          !cat.includes(termo)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [compras, busca, filtroStatus, filtroCategoria]);

  const handleExcluirPorId = (e: React.FormEvent) => {
    e.preventDefault();
    const idNum = parseInt(idParaExcluir, 10);
    if (isNaN(idNum) || idNum <= 0) return;
    const encontrado = compras.find(c => c.id === idNum);
    if (!encontrado) {
      alert(`Registro com ID #${idNum} não foi encontrado.`);
      return;
    }
    if (confirm(`Confirma a exclusão do registro #${idNum} (${encontrado.fornecedor} - ${encontrado.descricao})?`)) {
      onDeleteCompra(idNum);
      setIdParaExcluir('');
    }
  };

  return (
    <div className="space-y-4 my-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-lg sm:text-xl font-extrabold text-slate-100 flex items-center gap-2">
            <span>📋 Movimentações & Boletos Registrados</span>
          </h3>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Pesquise, filtre, altere o status ou exporte seus lançamentos.
          </p>
        </div>

        <button
          onClick={() => exportToCSV(filtrados)}
          disabled={filtrados.length === 0}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Exportar Planilha (CSV)</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-[#0F172A] border border-[#1E293B] p-3.5 rounded-xl">
        <div className="sm:col-span-2 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={busca}
            onChange={e => setBusca(e.target.value)}
            placeholder="Buscar por Fornecedor, Descrição ou NF..."
            className="w-full bg-[#111827] border border-slate-700 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <select
            value={filtroStatus}
            onChange={e => setFiltroStatus(e.target.value)}
            className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODOS">Status: Todos</option>
            <option value="PENDENTE">Status: PENDENTE</option>
            <option value="PAGO">Status: PAGO</option>
          </select>
        </div>

        <div>
          <select
            value={filtroCategoria}
            onChange={e => setFiltroCategoria(e.target.value)}
            className="w-full bg-[#111827] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="TODAS">Categoria: Todas</option>
            {categoriasDisponiveis.map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabela de Dados */}
      {filtrados.length === 0 ? (
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-8 text-center text-slate-400 text-sm">
          ℹ️ Nenhuma compra ou boleto encontrado para os filtros selecionados.
        </div>
      ) : (
        <div className="overflow-x-auto border border-[#1E293B] rounded-xl bg-[#0F172A]">
          <table className="w-full text-left border-collapse text-xs sm:text-sm">
            <thead>
              <tr className="border-b border-[#1E293B] bg-slate-900/90 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                <th className="py-3 px-3">ID</th>
                <th className="py-3 px-3">Unidade</th>
                <th className="py-3 px-3">Compra</th>
                <th className="py-3 px-3">Vencimento</th>
                <th className="py-3 px-3">Descrição / Parcela</th>
                <th className="py-3 px-3">Fornecedor</th>
                <th className="py-3 px-3">Categoria</th>
                <th className="py-3 px-3 text-right">Valor</th>
                <th className="py-3 px-3">Pagto</th>
                <th className="py-3 px-3">Situação</th>
                <th className="py-3 px-3">Nº NF</th>
                <th className="py-3 px-3 text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filtrados.map(item => {
                const isPago = item.status === 'PAGO';
                return (
                  <tr
                    key={item.id}
                    className="hover:bg-slate-800/40 transition group"
                  >
                    <td className="py-2.5 px-3 font-mono text-slate-400 font-bold">
                      #{item.id}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-slate-900 border border-slate-800 text-slate-200">
                        <span>{item.icone_unidade}</span>
                        <span>{item.unidade}</span>
                      </span>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                      {formatBRDate(item.data)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap font-semibold text-slate-200">
                      {formatBRDate(item.vencimento)}
                    </td>
                    <td className="py-2.5 px-3 max-w-[200px] truncate text-slate-200" title={item.descricao}>
                      {item.descricao}
                    </td>
                    <td className="py-2.5 px-3 max-w-[160px] truncate font-medium text-slate-300" title={item.fornecedor}>
                      {item.fornecedor}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-slate-400">
                      {item.categoria}
                    </td>
                    <td className="py-2.5 px-3 text-right whitespace-nowrap font-bold text-slate-100">
                      {formatBRL(item.valor)}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-xs text-slate-400">
                      {item.forma_pagamento}
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap">
                      <button
                        onClick={() => onToggleStatus(item.id, item.status)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-bold transition ${
                          isPago
                            ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25'
                            : 'bg-amber-500/15 border border-amber-500/30 text-amber-400 hover:bg-amber-500/25'
                        }`}
                        title={isPago ? 'Clique para reabrir (PENDENTE)' : 'Clique para dar baixa (PAGO)'}
                      >
                        {isPago ? (
                          <>
                            <CheckCircle className="w-3 h-3" />
                            <span>PAGO</span>
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-3 h-3" />
                            <span>PENDENTE</span>
                          </>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 whitespace-nowrap text-xs text-slate-400 font-mono">
                      {item.numero_nf || 'S/N'}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <button
                        onClick={() => setItemConfirmDelete(item)}
                        className="text-slate-500 hover:text-red-400 p-1 rounded transition"
                        title="Excluir lançamento"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Linha de Rodapé com Exclusão por ID */}
      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-400">
          Mostrando <strong className="text-slate-200">{filtrados.length}</strong> de <strong className="text-slate-200">{compras.length}</strong> lançamentos.
        </div>

        <form onSubmit={handleExcluirPorId} className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-xs text-slate-400 shrink-0">Excluir por ID:</span>
          <input
            type="number"
            min="1"
            placeholder="Ex: 5"
            value={idParaExcluir}
            onChange={e => setIdParaExcluir(e.target.value)}
            className="w-20 bg-[#111827] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 focus:outline-none focus:ring-1 focus:ring-red-500"
          />
          <button
            type="submit"
            className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/60 transition"
          >
            Excluir
          </button>
        </form>
      </div>

      {/* Modal de confirmação de exclusão */}
      {itemConfirmDelete && (
        <div className="fixed inset-0 bg-black/75 z-50 flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h4 className="text-lg font-bold text-slate-100">Confirmar Exclusão</h4>
            </div>
            <p className="text-sm text-slate-300">
              Tem certeza que deseja excluir o lançamento #{itemConfirmDelete.id}?
            </p>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs space-y-1 text-slate-300">
              <div><strong>Fornecedor:</strong> {itemConfirmDelete.fornecedor}</div>
              <div><strong>Descrição:</strong> {itemConfirmDelete.descricao}</div>
              <div><strong>Valor:</strong> {formatBRL(itemConfirmDelete.valor)}</div>
            </div>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setItemConfirmDelete(null)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  onDeleteCompra(itemConfirmDelete.id);
                  setItemConfirmDelete(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-red-600 hover:bg-red-500 text-white transition"
              >
                Excluir Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
