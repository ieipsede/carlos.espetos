import React, { useState, useRef, useEffect } from 'react';
import { Compra, FormaPagamento, StatusCompra } from '../types';
import { CATEGORIAS_PADRAO, formatBRL } from '../services/db';
import { ArrowLeft, Save, Calendar, FileText, Building2, Tag, DollarSign, CreditCard } from 'lucide-react';

interface PurchaseFormProps {
  unidadeInicial: number;
  onVoltar: () => void;
  onSalvar: (novasCompras: Omit<Compra, 'id'>[], msgSucesso: string) => void;
}

export const PurchaseForm: React.FC<PurchaseFormProps> = ({
  unidadeInicial,
  onVoltar,
  onSalvar
}) => {
  const formRef = useRef<HTMLFormElement>(null);

  const hoje = new Date().toISOString().split('T')[0];
  const quinzeDiasDepois = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const [unidade, setUnidade] = useState<number>(unidadeInicial === 0 ? 1 : unidadeInicial);
  const [fornecedor, setFornecedor] = useState('');
  const [descricao, setDescricao] = useState('');
  const [categoria, setCategoria] = useState(CATEGORIAS_PADRAO[0]);
  const [valorTotal, setValorTotal] = useState<number | ''>('');
  const [formaPagamento, setFormaPagamento] = useState<FormaPagamento>('BOLETO');
  const [dataCompra, setDataCompra] = useState(hoje);
  const [vencimentoBase, setVencimentoBase] = useState(quinzeDiasDepois);
  const [status, setStatus] = useState<StatusCompra>('PENDENTE');
  const [qtdParcelas, setQtdParcelas] = useState<number>(1);
  const [intervaloDias, setIntervaloDias] = useState<number>(30);
  const [observacoes, setObservacoes] = useState('');
  const [numeroNF, setNumeroNF] = useState('');
  const [erro, setErro] = useState<string | null>(null);

  const ehAPrazo = formaPagamento === 'BOLETO' || formaPagamento === 'FATURADO';

  // Navegação inteligente por tecla ENTER entre campos
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      const target = e.target as HTMLElement;
      if (target.tagName === 'BUTTON') return;
      if (target.tagName === 'TEXTAREA' && e.shiftKey) return;

      e.preventDefault();
      if (!formRef.current) return;

      const elements = Array.from(
        formRef.current.querySelectorAll<HTMLElement>(
          'input:not([type="hidden"]):not([disabled]), select:not([disabled]), textarea:not([disabled]), button[type="submit"]:not([disabled])'
        )
      );

      const currentIndex = elements.indexOf(target);
      if (currentIndex > -1 && currentIndex < elements.length - 1) {
        elements[currentIndex + 1].focus();
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErro(null);

    if (unidade <= 0) {
      setErro('⚠️ Por favor, selecione uma unidade antes de salvar.');
      return;
    }
    if (!fornecedor.trim()) {
      setErro("⚠️ O campo 'Fornecedor / Empresa' é obrigatório.");
      return;
    }
    if (!descricao.trim()) {
      setErro("⚠️ O campo 'Descrição do Item / Compra' é obrigatório.");
      return;
    }
    const val = typeof valorTotal === 'number' ? valorTotal : parseFloat(valorTotal || '0');
    if (isNaN(val) || val <= 0) {
      setErro('⚠️ O valor total da compra deve ser preenchido e maior que zero (R$ 0,00).');
      return;
    }

    const novasCompras: Omit<Compra, 'id'>[] = [];
    const parcelarDeFato = ehAPrazo && qtdParcelas > 1;

    const baseDate = new Date(`${dataCompra}T00:00:00`);
    const vencBaseDate = new Date(`${vencimentoBase}T00:00:00`);

    if (parcelarDeFato) {
      const valorBase = Math.round((val / qtdParcelas) * 100) / 100;
      const diferencaCentavos = Math.round((val - valorBase * qtdParcelas) * 100) / 100;

      for (let i = 1; i <= qtdParcelas; i++) {
        const valParc = i === qtdParcelas ? valorBase + diferencaCentavos : valorBase;
        const vencParc = new Date(vencBaseDate);
        vencParc.setDate(vencParc.getDate() + (i - 1) * intervaloDias);

        const descFinal = `${descricao.trim()} (${i}/${qtdParcelas})`;
        const nfFinal = numeroNF.trim() ? `${numeroNF.trim()} - Parc. ${i}/${qtdParcelas}` : `Parc. ${i}/${qtdParcelas}`;
        const obsFinal = `Boleto/Parcela ${i} de ${qtdParcelas}. ${observacoes.trim()}`.trim();

        novasCompras.push({
          estabelecimento_id: unidade,
          data: dataCompra,
          vencimento: vencParc.toISOString().split('T')[0],
          descricao: descFinal,
          fornecedor: fornecedor.trim(),
          categoria,
          valor: parseFloat(valParc.toFixed(2)),
          forma_pagamento: formaPagamento,
          status,
          numero_nf: nfFinal,
          observacoes: obsFinal
        });
      }
    } else {
      const vencFinal = ehAPrazo ? vencimentoBase : dataCompra;
      novasCompras.push({
        estabelecimento_id: unidade,
        data: dataCompra,
        vencimento: vencFinal,
        descricao: descricao.trim(),
        fornecedor: fornecedor.trim(),
        categoria,
        valor: parseFloat(val.toFixed(2)),
        forma_pagamento: formaPagamento,
        status,
        numero_nf: numeroNF.trim() || null,
        observacoes: observacoes.trim() || null
      });
    }

    const nomesUnidades: Record<number, string> = {
      1: 'Restaurante',
      2: 'Conveniência',
      3: 'Buffet'
    };
    const nomeDestino = nomesUnidades[unidade] || 'Unidade';
    const msg = parcelarDeFato
      ? `✅ Sucesso! ${qtdParcelas} boletos cadastrados para ${nomeDestino}!`
      : `✅ Sucesso! Compra cadastrada com sucesso no ${nomeDestino}!`;

    onSalvar(novasCompras, msg);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Topo da Tela Isolada de Cadastro */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-100 flex items-center gap-2">
            <span>📝 Cadastrar Nova Compra / Boletos</span>
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-0.5">
            Tela de cadastro isolada. Pressione <strong>ENTER</strong> ou <strong>TAB</strong> para navegar entre os campos.
          </p>
        </div>

        <button
          onClick={onVoltar}
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel</span>
        </button>
      </div>

      {erro && (
        <div className="bg-red-950/40 border border-red-500/40 text-red-200 p-4 rounded-xl text-sm font-semibold">
          {erro}
        </div>
      )}

      <form ref={formRef} onKeyDown={handleKeyDown} onSubmit={handleSubmit} className="space-y-6">
        {/* Seletor de Estabelecimento */}
        <div className="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl space-y-3">
          <label className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-400" />
            <span>🏢 Estabelecimento para Lançamento *</span>
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <button
              type="button"
              onClick={() => setUnidade(1)}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                unidade === 1
                  ? 'border-amber-500 bg-amber-500/10 text-amber-300 shadow-md shadow-amber-950/20 ring-1 ring-amber-500'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-2xl">🍽️</span>
              <div>
                <div className="font-extrabold text-sm text-slate-100">1. RESTAURANTE</div>
                <div className="text-[11px] text-slate-400">Cozinha & Preparo</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUnidade(2)}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                unidade === 2
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-300 shadow-md shadow-emerald-950/20 ring-1 ring-emerald-500'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-2xl">🏪</span>
              <div>
                <div className="font-extrabold text-sm text-slate-100">2. CONVENIÊNCIA</div>
                <div className="text-[11px] text-slate-400">Bebidas & Tabacaria</div>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setUnidade(3)}
              className={`p-3.5 rounded-xl border text-left transition flex items-center gap-3 ${
                unidade === 3
                  ? 'border-indigo-500 bg-indigo-500/10 text-indigo-300 shadow-md shadow-indigo-950/20 ring-1 ring-indigo-500'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
              }`}
            >
              <span className="text-2xl">🎉</span>
              <div>
                <div className="font-extrabold text-sm text-slate-100">3. BUFFET</div>
                <div className="text-[11px] text-slate-400">Eventos & Recepções</div>
              </div>
            </button>
          </div>
        </div>

        {/* Campos Principais em 2 Colunas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#111827] border border-[#1F2937] p-5 sm:p-6 rounded-2xl">
          {/* Coluna 1 */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                🏭 Fornecedor / Empresa *
              </label>
              <input
                type="text"
                required
                value={fornecedor}
                onChange={e => setFornecedor(e.target.value)}
                placeholder="Ex: Frigorífico Boi Nobre, Ambev, Atacadão..."
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                📦 Descrição Principal do Item / Compra *
              </label>
              <textarea
                required
                rows={2}
                value={descricao}
                onChange={e => setDescricao(e.target.value)}
                placeholder="Ex: Picanha maturada, Fardos de cerveja..."
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                🏷️ Categoria *
              </label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {CATEGORIAS_PADRAO.map(cat => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Coluna 2 */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                💰 Valor Total da Compra (R$) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                value={valorTotal}
                onChange={e => setValorTotal(e.target.value === '' ? '' : parseFloat(e.target.value))}
                placeholder="0,00"
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                💳 Forma de Pagamento *
              </label>
              <select
                value={formaPagamento}
                onChange={e => setFormaPagamento(e.target.value as FormaPagamento)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="BOLETO">Boleto Bancário (Suporta múltiplos boletos)</option>
                <option value="FATURADO">A Prazo / Faturado (Suporta parcelamento)</option>
                <option value="PIX">Pix (À vista)</option>
                <option value="CARTAO_CREDITO">Cartão de Crédito</option>
                <option value="CARTAO_DEBITO">Cartão de Débito</option>
                <option value="DINHEIRO">Dinheiro em Espécie</option>
              </select>
            </div>

            {/* Condicional de Datas */}
            {ehAPrazo ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    📅 Data Compra *
                  </label>
                  <input
                    type="date"
                    required
                    value={dataCompra}
                    onChange={e => setDataCompra(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                    ⏰ 1º Vencimento *
                  </label>
                  <input
                    type="date"
                    required
                    value={vencimentoBase}
                    onChange={e => setVencimentoBase(e.target.value)}
                    className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                  📅 Data da Compra *
                </label>
                <input
                  type="date"
                  required
                  value={dataCompra}
                  onChange={e => setDataCompra(e.target.value)}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="text-[11px] text-slate-400 mt-1 italic">
                  ℹ️ Forma à vista: vencimento e quitação automáticos na data da compra.
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                📌 Situação Inicial *
              </label>
              <select
                value={status}
                onChange={e => setStatus(e.target.value as StatusCompra)}
                className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="PENDENTE">PENDENTE (A pagar)</option>
                <option value="PAGO">PAGO (Já quitado)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Parcelamento e Boletos Múltiplos (Exibido se Boleto ou Faturado) */}
        {ehAPrazo && (
          <div className="bg-[#111827] border border-[#1F2937] p-5 sm:p-6 rounded-2xl space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
              <span>🔢 Parcelamento / Múltiplos Boletos</span>
              {typeof valorTotal === 'number' && valorTotal > 0 && qtdParcelas > 1 && (
                <span className="text-blue-400 font-mono">
                  {qtdParcelas}x de ~{formatBRL(valorTotal / qtdParcelas)}
                </span>
              )}
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Quantidade de Boletos / Parcelas (1 a 36)
                </label>
                <input
                  type="number"
                  min="1"
                  max="36"
                  value={qtdParcelas}
                  onChange={e => setQtdParcelas(Math.max(1, Math.min(36, parseInt(e.target.value, 10) || 1)))}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Intervalo entre Vencimentos
                </label>
                <select
                  value={intervaloDias}
                  onChange={e => setIntervaloDias(parseInt(e.target.value, 10))}
                  className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value={30}>A cada 30 dias (Padrão comercial 30/60/90...)</option>
                  <option value={15}>A cada 15 dias (Quinzenal)</option>
                  <option value={7}>A cada 7 dias (Semanal)</option>
                  <option value={45}>A cada 45 dias</option>
                  <option value={60}>A cada 60 dias (Bimestral)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Observações e Nota Fiscal */}
        <div className="bg-[#111827] border border-[#1F2937] p-5 sm:p-6 rounded-2xl space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              🗒️ Observações Adicionais
            </label>
            <textarea
              rows={2}
              value={observacoes}
              onChange={e => setObservacoes(e.target.value)}
              placeholder="Detalhes adicionais sobre o pedido, entregador, negociação..."
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
              📄 Nº Nota Fiscal / Pedido
            </label>
            <input
              type="text"
              value={numeroNF}
              onChange={e => setNumeroNF(e.target.value)}
              placeholder="Ex: NF-10842"
              className="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Botão de Envio */}
        <div className="pt-2">
          <button
            type="submit"
            className="w-full py-4 px-6 rounded-2xl font-black text-sm sm:text-base tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 transition transform active:scale-98 flex items-center justify-center gap-2"
          >
            <Save className="w-5 h-5" />
            <span>SALVAR E REGISTRAR COMPRA</span>
          </button>
        </div>
      </form>
    </div>
  );
};
