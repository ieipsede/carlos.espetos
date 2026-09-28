import React, { useState, useEffect, useMemo } from 'react';
import { Compra, StatusCompra, ViewMode } from './types';
import {
  getComprasFromStorage,
  updateStatusCompra,
  deleteCompra,
  addMultiplasCompras,
  zerarBancoDados,
  popularDadosIniciais
} from './services/db';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { MetricsCards } from './components/MetricsCards';
import { NextDueCard } from './components/NextDueCard';
import { RecordsTable } from './components/RecordsTable';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { PurchaseForm } from './components/PurchaseForm';
import { PhpSourceModal } from './components/PhpSourceModal';
import { ClearDatabaseModal } from './components/ClearDatabaseModal';
import { CheckCircle2, X } from 'lucide-react';

export const App: React.FC = () => {
  const [compras, setCompras] = useState<Compra[]>([]);
  const [unidadeSelecionada, setUnidadeSelecionada] = useState<number>(0);
  const [viewMode, setViewMode] = useState<ViewMode>('painel');
  const [activeTab, setActiveTab] = useState<'vencimento' | 'records' | 'charts'>('vencimento');
  const [isPhpModalOpen, setIsPhpModalOpen] = useState(false);
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [msgSucesso, setMsgSucesso] = useState<string | null>(null);

  // Inicializa dados do localStorage
  useEffect(() => {
    const dados = getComprasFromStorage();
    setCompras(dados);
  }, []);

  // Filtra as compras de acordo com a unidade selecionada (0 = todas)
  const comprasFiltradas = useMemo(() => {
    if (unidadeSelecionada === 0) return compras;
    return compras.filter(c => c.estabelecimento_id === unidadeSelecionada);
  }, [compras, unidadeSelecionada]);

  // Ação de Limpar Todos os Dados (DELETE FROM compras) e recarregar zerado
  const handleConfirmClear = () => {
    try {
      const formData = new FormData();
      formData.append('action', 'limpar_dados');
      fetch('/index.php', { method: 'POST', body: formData }).catch(() => {});
    } catch {
      // Ignora erro em modo SPA puro
    }
    zerarBancoDados();
    setIsClearModalOpen(false);
    window.location.reload();
  };

  // Ação de Dar Baixa em um lançamento
  const handleDarBaixa = (id: number) => {
    const item = compras.find(c => c.id === id);
    const atualizados = updateStatusCompra(id, 'PAGO');
    setCompras(atualizados);
    setMsgSucesso(`✅ Pagamento confirmado! Compra #${id} de ${item?.fornecedor || 'fornecedor'} quitada com sucesso!`);
  };

  // Alternar Status entre PAGO e PENDENTE
  const handleToggleStatus = (id: number, currentStatus: StatusCompra) => {
    const novoStatus: StatusCompra = currentStatus === 'PAGO' ? 'PENDENTE' : 'PAGO';
    const atualizados = updateStatusCompra(id, novoStatus);
    setCompras(atualizados);
    if (novoStatus === 'PAGO') {
      setMsgSucesso(`✅ Lançamento #${id} marcado como PAGO!`);
    } else {
      setMsgSucesso(`ℹ️ Lançamento #${id} reaberto como PENDENTE.`);
    }
  };

  // Excluir lançamento
  const handleDeleteCompra = (id: number) => {
    const atualizados = deleteCompra(id);
    setCompras(atualizados);
    setMsgSucesso(`🗑️ Lançamento #${id} excluído com sucesso!`);
  };

  // Salvar nova compra (ou boletos parcelados)
  const handleSalvarCompra = (novasCompras: Omit<Compra, 'id'>[], mensagem: string) => {
    const atualizados = addMultiplasCompras(novasCompras);
    setCompras(atualizados);
    setViewMode('painel');
    setUnidadeSelecionada(0);
    setMsgSucesso(mensagem);
  };

  return (
    <div className="min-h-screen bg-[#0A0E17] text-[#E2E8F0] selection:bg-blue-600 selection:text-white">
      <div className="max-w-[1300px] mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Cabeçalho Oficial Carlão */}
        <Header 
          onOpenPhpModal={() => setIsPhpModalOpen(true)}
          onOpenClearModal={() => setIsClearModalOpen(true)}
        />

        {/* Mensagem de Feedback Flutuante / Banner */}
        {msgSucesso && (
          <div className="my-4 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl flex items-center justify-between shadow-lg shadow-emerald-950/30">
            <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>{msgSucesso}</span>
            </div>
            <button
              onClick={() => setMsgSucesso(null)}
              className="text-emerald-400 hover:text-white p-1 rounded transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* FLUXO 1: TELA DE CADASTRO ISOLADA */}
        {viewMode === 'cadastro' ? (
          <PurchaseForm
            unidadeInicial={unidadeSelecionada}
            onVoltar={() => {
              setViewMode('painel');
              setUnidadeSelecionada(0);
            }}
            onSalvar={handleSalvarCompra}
          />
        ) : (
          /* FLUXO 2: TELA PRINCIPAL (PAINEL & MÉTRICAS) */
          <div className="space-y-4">
            {/* Barra de Navegação de Unidades + Botão Nova Compra */}
            <Navigation
              unidadeSelecionada={unidadeSelecionada}
              onSelectUnidade={id => setUnidadeSelecionada(id)}
              onOpenCadastro={() => setViewMode('cadastro')}
            />

            {/* Cards de Métricas */}
            <MetricsCards compras={comprasFiltradas} />

            {/* Abas Principais */}
            <div className="border-b border-slate-800">
              <nav className="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
                <button
                  onClick={() => setActiveTab('vencimento')}
                  className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'vencimento'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>🔔</span>
                  <span>Próximo Vencimento & Dar Baixa</span>
                </button>

                <button
                  onClick={() => setActiveTab('records')}
                  className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'records'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>📋</span>
                  <span>Todos os Registros & Filtros</span>
                </button>

                <button
                  onClick={() => setActiveTab('charts')}
                  className={`py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap flex items-center gap-2 ${
                    activeTab === 'charts'
                      ? 'border-blue-500 text-blue-400'
                      : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span>📈</span>
                  <span>Análise por Categoria</span>
                </button>
              </nav>
            </div>

            {/* Conteúdo da Aba Ativa */}
            <div className="pt-2">
              {activeTab === 'vencimento' && (
                <NextDueCard
                  compras={comprasFiltradas}
                  onDarBaixa={handleDarBaixa}
                  onGoToRecordsTab={() => setActiveTab('records')}
                />
              )}

              {activeTab === 'records' && (
                <RecordsTable
                  compras={comprasFiltradas}
                  onToggleStatus={handleToggleStatus}
                  onDeleteCompra={handleDeleteCompra}
                  onOpenClearModal={() => setIsClearModalOpen(true)}
                />
              )}

              {activeTab === 'charts' && (
                <AnalyticsCharts
                  compras={comprasFiltradas}
                  unidadeSelecionada={unidadeSelecionada}
                />
              )}
            </div>
          </div>
        )}

        {/* Rodapé Oficial */}
        <footer className="mt-12 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            <strong className="text-slate-400">CARLÃO - SISTEMA INTEGRADO DE GESTÃO DE COMPRAS</strong>
            <div>Unidades: 🍽️ Restaurante | 🏪 Conveniência | 🎉 Buffet</div>
          </div>
        </footer>

        {/* Modal de Código PHP */}
        <PhpSourceModal
          isOpen={isPhpModalOpen}
          onClose={() => setIsPhpModalOpen(false)}
        />

        {/* Modal de Zerar Dados (DELETE FROM compras) */}
        <ClearDatabaseModal
          isOpen={isClearModalOpen}
          onClose={() => setIsClearModalOpen(false)}
          onConfirmClear={handleConfirmClear}
          totalRegistros={compras.length}
        />
      </div>
    </div>
  );
};
export default App;
