import { Compra, Estabelecimento, StatusCompra } from '../types';

export const ESTABELECIMENTOS: Estabelecimento[] = [
  { id: 1, codigo: 1, nome: "RESTAURANTE", descricao: "Cozinha, Salão & Insumos de Preparo", icone: "🍽️" },
  { id: 2, codigo: 2, nome: "CONVENIÊNCIA", descricao: "Produtos Prontos, Tabacaria & Bebidas Geladas", icone: "🏪" },
  { id: 3, codigo: 3, nome: "BUFFET", descricao: "Eventos, Serviços Corporativos & Recepções", icone: "🎉" }
];

export const CATEGORIAS_PADRAO = [
  "Carnes & Aves",
  "Hortifruti",
  "Bebidas Alcoólicas",
  "Refrigerantes & Sucos",
  "Snacks & Chocolates",
  "Gelo & Carvão",
  "Gás & Energia",
  "Frutos do Mar",
  "Vinhos & Bebidas",
  "Descartáveis & Embalagens",
  "Limpeza & Higiene",
  "Locação de Materiais",
  "Manutenção & Utensílios",
  "Outros"
];

const STORAGE_KEY = 'carlao_compras_db_v1';
const AUTO_INC_KEY = 'carlao_compras_seq_v1';

function formatDate(d: Date): string {
  return d.toISOString().split('T')[0];
}

function addDays(d: Date, days: number): Date {
  const result = new Date(d);
  result.setDate(result.getDate() + days);
  return result;
}

export function gerarMassaInicial(): Compra[] {
  const hoje = new Date();
  const atrasado5d = formatDate(addDays(hoje, -5));
  const atrasado2d = formatDate(addDays(hoje, -2));
  const semana3d = formatDate(addDays(hoje, 3));
  const semana6d = formatDate(addDays(hoje, 6));
  const mes18d = formatDate(addDays(hoje, 18));
  const mes30d = formatDate(addDays(hoje, 30));
  const passadoPago = formatDate(addDays(hoje, -15));
  const hojeStr = formatDate(hoje);

  return [
    // 1. RESTAURANTE
    {
      id: 1,
      estabelecimento_id: 1,
      data: atrasado5d,
      vencimento: atrasado5d,
      descricao: "Carne Bovina Picanha & Alcatra (1/3)",
      fornecedor: "Frigorífico Boi Nobre",
      categoria: "Carnes & Aves",
      valor: 1450.00,
      forma_pagamento: "BOLETO",
      status: "PENDENTE",
      numero_nf: "NF-10492 - Parc. 1/3",
      observacoes: "Boleto em atraso",
      data_registro: new Date().toISOString()
    },
    {
      id: 2,
      estabelecimento_id: 1,
      data: atrasado5d,
      vencimento: semana3d,
      descricao: "Carne Bovina Picanha & Alcatra (2/3)",
      fornecedor: "Frigorífico Boi Nobre",
      categoria: "Carnes & Aves",
      valor: 1450.00,
      forma_pagamento: "BOLETO",
      status: "PENDENTE",
      numero_nf: "NF-10492 - Parc. 2/3",
      observacoes: "Boleto semana atual",
      data_registro: new Date().toISOString()
    },
    {
      id: 3,
      estabelecimento_id: 1,
      data: atrasado5d,
      vencimento: mes18d,
      descricao: "Carne Bovina Picanha & Alcatra (3/3)",
      fornecedor: "Frigorífico Boi Nobre",
      categoria: "Carnes & Aves",
      valor: 1450.00,
      forma_pagamento: "BOLETO",
      status: "PENDENTE",
      numero_nf: "NF-10492 - Parc. 3/3",
      observacoes: "Boleto mês",
      data_registro: new Date().toISOString()
    },
    {
      id: 4,
      estabelecimento_id: 1,
      data: hojeStr,
      vencimento: hojeStr,
      descricao: "Hortifruti da Semana",
      fornecedor: "Ceasa Distribuidora",
      categoria: "Hortifruti",
      valor: 680.50,
      forma_pagamento: "PIX",
      status: "PAGO",
      numero_nf: "NF-9941",
      observacoes: "Compra à vista",
      data_registro: new Date().toISOString()
    },
    {
      id: 5,
      estabelecimento_id: 1,
      data: hojeStr,
      vencimento: semana6d,
      descricao: "Recarga de Gás P45 (4 Cilindros)",
      fornecedor: "Ultragaz Comercial",
      categoria: "Gás & Energia",
      valor: 1120.00,
      forma_pagamento: "FATURADO",
      status: "PENDENTE",
      numero_nf: "NF-22104",
      observacoes: "Vence em 6 dias",
      data_registro: new Date().toISOString()
    },

    // 2. CONVENIÊNCIA
    {
      id: 6,
      estabelecimento_id: 2,
      data: atrasado2d,
      vencimento: atrasado2d,
      descricao: "Cervejas Heineken & Stella Artois (1/3)",
      fornecedor: "Ambev Distribuidora",
      categoria: "Bebidas Alcoólicas",
      valor: 1200.00,
      forma_pagamento: "BOLETO",
      status: "PENDENTE",
      numero_nf: "NF-8820 - Parc. 1/3",
      observacoes: "Atrasado urgente",
      data_registro: new Date().toISOString()
    },
    {
      id: 7,
      estabelecimento_id: 2,
      data: atrasado2d,
      vencimento: semana3d,
      descricao: "Cervejas Heineken & Stella Artois (2/3)",
      fornecedor: "Ambev Distribuidora",
      categoria: "Bebidas Alcoólicas",
      valor: 1200.00,
      forma_pagamento: "BOLETO",
      status: "PENDENTE",
      numero_nf: "NF-8820 - Parc. 2/3",
      observacoes: "Vence semana",
      data_registro: new Date().toISOString()
    },
    {
      id: 8,
      estabelecimento_id: 2,
      data: atrasado2d,
      vencimento: mes30d,
      descricao: "Cervejas Heineken & Stella Artois (3/3)",
      fornecedor: "Ambev Distribuidora",
      categoria: "Bebidas Alcoólicas",
      valor: 1200.00,
      forma_pagamento: "BOLETO",
      status: "PENDENTE",
      numero_nf: "NF-8820 - Parc. 3/3",
      observacoes: "Vence próximo mês",
      data_registro: new Date().toISOString()
    },
    {
      id: 9,
      estabelecimento_id: 2,
      data: passadoPago,
      vencimento: passadoPago,
      descricao: "Gelo Filtrado em Cubos 5kg (100pcts)",
      fornecedor: "Gelo Cristal Polar",
      categoria: "Gelo & Carvão",
      valor: 500.00,
      forma_pagamento: "PIX",
      status: "PAGO",
      numero_nf: "NF-6612",
      observacoes: "Quitado",
      data_registro: new Date().toISOString()
    },

    // 3. BUFFET
    {
      id: 10,
      estabelecimento_id: 3,
      data: passadoPago,
      vencimento: passadoPago,
      descricao: "Camarão Rosa & Salmão Fresco",
      fornecedor: "Pescados & Cia",
      categoria: "Frutos do Mar",
      valor: 2200.00,
      forma_pagamento: "CARTAO_CREDITO",
      status: "PAGO",
      numero_nf: "NF-5011",
      observacoes: "Quitado no cartão",
      data_registro: new Date().toISOString()
    },
    {
      id: 11,
      estabelecimento_id: 3,
      data: hojeStr,
      vencimento: semana6d,
      descricao: "Locação de Louças & Réchauds (1/2)",
      fornecedor: "Requinte Festas e Locações",
      categoria: "Locação de Materiais",
      valor: 950.00,
      forma_pagamento: "BOLETO",
      status: "PENDENTE",
      numero_nf: "NF-4401 - Parc. 1/2",
      observacoes: "Semana corporativa",
      data_registro: new Date().toISOString()
    },
    {
      id: 12,
      estabelecimento_id: 3,
      data: hojeStr,
      vencimento: mes18d,
      descricao: "Locação de Louças & Réchauds (2/2)",
      fornecedor: "Requinte Festas e Locações",
      categoria: "Locação de Materiais",
      valor: 950.00,
      forma_pagamento: "BOLETO",
      status: "PENDENTE",
      numero_nf: "NF-4401 - Parc. 2/2",
      observacoes: "Segunda parcela",
      data_registro: new Date().toISOString()
    },
    {
      id: 13,
      estabelecimento_id: 3,
      data: hojeStr,
      vencimento: mes30d,
      descricao: "Vinhos Finos & Espumantes",
      fornecedor: "Vinícola Grand Reserva",
      categoria: "Vinhos & Bebidas",
      valor: 1750.00,
      forma_pagamento: "FATURADO",
      status: "PENDENTE",
      numero_nf: "NF-3392",
      observacoes: "Casamento próximo mês",
      data_registro: new Date().toISOString()
    }
  ];
}

function enrichCompra(c: Compra): Compra {
  const est = ESTABELECIMENTOS.find(e => e.id === c.estabelecimento_id);
  return {
    ...c,
    codigo_unidade: est?.codigo ?? c.estabelecimento_id,
    unidade: est?.nome ?? 'DESCONHECIDO',
    icone_unidade: est?.icone ?? '📦'
  };
}

export function getComprasFromStorage(): Compra[] {
  if (typeof window === 'undefined') return [];
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    const iniciais = gerarMassaInicial();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(iniciais));
    localStorage.setItem(AUTO_INC_KEY, '14');
    return iniciais.map(enrichCompra);
  }
  try {
    const parsed: Compra[] = JSON.parse(raw);
    return parsed.map(enrichCompra);
  } catch {
    const iniciais = gerarMassaInicial();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(iniciais));
    localStorage.setItem(AUTO_INC_KEY, '14');
    return iniciais.map(enrichCompra);
  }
}

export function saveComprasToStorage(compras: Compra[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(compras));
}

export function getNextId(): number {
  if (typeof window === 'undefined') return Date.now();
  const rawSeq = localStorage.getItem(AUTO_INC_KEY);
  let nextSeq = rawSeq ? parseInt(rawSeq, 10) : 1;
  if (isNaN(nextSeq)) nextSeq = 1;
  localStorage.setItem(AUTO_INC_KEY, (nextSeq + 1).toString());
  return nextSeq;
}

export function addMultiplasCompras(novosItens: Omit<Compra, 'id'>[]): Compra[] {
  const atuais = getComprasFromStorage();
  const paraAdicionar: Compra[] = novosItens.map(item => ({
    ...item,
    id: getNextId(),
    data_registro: new Date().toISOString()
  }));

  const atualizado = [...atuais, ...paraAdicionar];
  saveComprasToStorage(atualizado);
  return atualizado.map(enrichCompra);
}

export function updateStatusCompra(compraId: number, novoStatus: StatusCompra): Compra[] {
  const atuais = getComprasFromStorage();
  const atualizado = atuais.map(c => (c.id === compraId ? { ...c, status: novoStatus } : c));
  saveComprasToStorage(atualizado);
  return atualizado.map(enrichCompra);
}

export function deleteCompra(compraId: number): Compra[] {
  const atuais = getComprasFromStorage();
  const atualizado = atuais.filter(c => c.id !== compraId);
  saveComprasToStorage(atualizado);
  return atualizado.map(enrichCompra);
}

export function zerarBancoDados(): Compra[] {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
    localStorage.setItem(AUTO_INC_KEY, '1');
  }
  return [];
}

export function popularDadosIniciais(): Compra[] {
  const massa = gerarMassaInicial();
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(massa));
    localStorage.setItem(AUTO_INC_KEY, '14');
  }
  return massa.map(enrichCompra);
}

export function formatBRL(valor: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2
  }).format(valor || 0);
}

export function parseDate(isoString: string): Date {
  const [year, month, day] = isoString.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

export function formatBRDate(isoString: string): string {
  if (!isoString) return '--/--/----';
  const parts = isoString.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoString;
}

export function exportToCSV(compras: Compra[]): void {
  const headers = [
    'ID',
    'Unidade',
    'Data Compra',
    'Vencimento Boleto',
    'Descrição / Boleto Parcela',
    'Fornecedor',
    'Categoria',
    'Valor Parcela',
    'Forma Pagto',
    'Situação',
    'Nº NF / Parcela',
    'Observações'
  ];

  const rows = compras.map(c => [
    c.id,
    c.unidade || '',
    formatBRDate(c.data),
    formatBRDate(c.vencimento),
    `"${(c.descricao || '').replace(/"/g, '""')}"`,
    `"${(c.fornecedor || '').replace(/"/g, '""')}"`,
    `"${(c.categoria || '').replace(/"/g, '""')}"`,
    formatBRL(c.valor),
    c.forma_pagamento,
    c.status,
    `"${(c.numero_nf || '').replace(/"/g, '""')}"`,
    `"${(c.observacoes || '').replace(/"/g, '""')}"`
  ]);

  const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const now = new Date();
  const timestamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}${String(now.getSeconds()).padStart(2, '0')}`;
  link.setAttribute('href', url);
  link.setAttribute('download', `boletos_compras_carlao_${timestamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
