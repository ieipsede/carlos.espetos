<?php
/**
 * =============================================================================
 * SISTEMA INTEGRADO DE GESTÃO DE COMPRAS - GRUPO CARLÃO
 * Backend PHP Serverless compatível com Vercel (api/index.php) e Servidores Web
 * 
 * Unidades:
 *  1. RESTAURANTE  (Cozinha, Salão & Insumos de Preparo)
 *  2. CONVENIÊNCIA (Produtos Prontos, Tabacaria & Bebidas Geladas)
 *  3. BUFFET       (Eventos, Serviços Corporativos & Recepções)
 * =============================================================================
 */

// Inicia sessão para mensagens flash e controle de estado
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Configurações de fuso horário e exibição de erros
date_default_timezone_set('America/Sao_Paulo');
error_reporting(E_ALL);
ini_set('display_errors', '0');

// Detecção de ambiente Vercel Serverless
// Na Vercel, o sistema de arquivos raiz é somente-leitura. O diretório /tmp é gravável.
$isVercel = (getenv('VERCEL') === '1' || isset($_ENV['VERCEL']) || isset($_SERVER['VERCEL']));
if ($isVercel) {
    define('DB_FILE', sys_get_temp_dir() . '/gestao_compras.db');
} else {
    define('DB_FILE', dirname(__DIR__) . '/gestao_compras.db');
}

// Categorias padrão
$CATEGORIAS_PADRAO = [
    "Carnes & Aves", "Hortifruti", "Bebidas Alcoólicas", "Refrigerantes & Sucos",
    "Snacks & Chocolates", "Gelo & Carvão", "Gás & Energia", "Frutos do Mar",
    "Vinhos & Bebidas", "Descartáveis & Embalagens", "Limpeza & Higiene",
    "Locação de Materiais", "Manutenção & Utensílios", "Outros"
];

$FORMAS_PAGAMENTO = [
    "BOLETO" => "Boleto Bancário (Suporta múltiplos boletos)",
    "FATURADO" => "A Prazo / Faturado (Suporta parcelamento)",
    "PIX" => "Pix (À vista)",
    "CARTAO_CREDITO" => "Cartão de Crédito",
    "CARTAO_DEBITO" => "Cartão de Débito",
    "DINHEIRO" => "Dinheiro em Espécie"
];

// -----------------------------------------------------------------------------
// CONEXÃO E INICIALIZAÇÃO DO BANCO DE DADOS (PDO SQLITE)
// -----------------------------------------------------------------------------
function getDB() {
    static $pdo = null;
    if ($pdo === null) {
        $pdo = new PDO('sqlite:' . DB_FILE);
        $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
        $pdo->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
    }
    return $pdo;
}

function initDatabase() {
    $db = getDB();

    // 1. Tabela estabelecimentos
    $db->exec("CREATE TABLE IF NOT EXISTS estabelecimentos (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        codigo INTEGER UNIQUE NOT NULL,
        nome TEXT NOT NULL,
        descricao TEXT,
        icone TEXT
    )");

    // 2. Tabela compras
    $db->exec("CREATE TABLE IF NOT EXISTS compras (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        estabelecimento_id INTEGER NOT NULL,
        data TEXT NOT NULL,
        vencimento TEXT,
        descricao TEXT NOT NULL,
        fornecedor TEXT NOT NULL,
        categoria TEXT NOT NULL,
        valor REAL NOT NULL,
        forma_pagamento TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'PENDENTE',
        numero_nf TEXT,
        observacoes TEXT,
        data_registro TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (estabelecimento_id) REFERENCES estabelecimentos (id)
    )");

    // 3. Tabela configuracoes_sistema
    $db->exec("CREATE TABLE IF NOT EXISTS configuracoes_sistema (
        chave TEXT PRIMARY KEY,
        valor TEXT
    )");

    // Popula as 3 unidades se não existirem
    $countEst = $db->query("SELECT COUNT(*) FROM estabelecimentos")->fetchColumn();
    if ($countEst == 0) {
        $stmt = $db->prepare("INSERT INTO estabelecimentos (codigo, nome, descricao, icone) VALUES (?, ?, ?, ?)");
        $stmt->execute([1, "RESTAURANTE", "Cozinha, Salão & Insumos de Preparo", "🍽️"]);
        $stmt->execute([2, "CONVENIÊNCIA", "Produtos Prontos, Tabacaria & Bebidas Geladas", "🏪"]);
        $stmt->execute([3, "BUFFET", "Eventos, Serviços Corporativos & Recepções", "🎉"]);
    }

    // Verifica se seed inicial já foi executado
    $seedFeito = $db->query("SELECT COUNT(*) FROM configuracoes_sistema WHERE chave = 'seed_executado'")->fetchColumn();
    if ($seedFeito == 0) {
        $countCompras = $db->query("SELECT COUNT(*) FROM compras")->fetchColumn();
        if ($countCompras == 0) {
            inserirMassaInicial($db);
        }
        $db->exec("INSERT OR REPLACE INTO configuracoes_sistema (chave, valor) VALUES ('seed_executado', '1')");
    }
}

function inserirMassaInicial($db) {
    $hoje = new DateTime();

    $atrasado5d = (clone $hoje)->modify('-5 days')->format('Y-m-d');
    $atrasado2d = (clone $hoje)->modify('-2 days')->format('Y-m-d');
    $semana3d   = (clone $hoje)->modify('+3 days')->format('Y-m-d');
    $semana6d   = (clone $hoje)->modify('+6 days')->format('Y-m-d');
    $mes18d     = (clone $hoje)->modify('+18 days')->format('Y-m-d');
    $mes30d     = (clone $hoje)->modify('+30 days')->format('Y-m-d');
    $passadoPago= (clone $hoje)->modify('-15 days')->format('Y-m-d');
    $hojeStr    = $hoje->format('Y-m-d');

    $comprasIniciais = [
        // 1. RESTAURANTE
        [1, $atrasado5d, $atrasado5d, "Carne Bovina Picanha & Alcatra (1/3)", "Frigorífico Boi Nobre", "Carnes & Aves", 1450.00, "BOLETO", "PENDENTE", "NF-10492 - Parc. 1/3", "Boleto em atraso"],
        [1, $atrasado5d, $semana3d,   "Carne Bovina Picanha & Alcatra (2/3)", "Frigorífico Boi Nobre", "Carnes & Aves", 1450.00, "BOLETO", "PENDENTE", "NF-10492 - Parc. 2/3", "Boleto semana atual"],
        [1, $atrasado5d, $mes18d,     "Carne Bovina Picanha & Alcatra (3/3)", "Frigorífico Boi Nobre", "Carnes & Aves", 1450.00, "BOLETO", "PENDENTE", "NF-10492 - Parc. 3/3", "Boleto mês"],
        [1, $hojeStr,    $hojeStr,    "Hortifruti da Semana", "Ceasa Distribuidora", "Hortifruti", 680.50, "PIX", "PAGO", "NF-9941", "Compra à vista"],
        [1, $hojeStr,    $semana6d,   "Recarga de Gás P45 (4 Cilindros)", "Ultragaz Comercial", "Gás & Energia", 1120.00, "FATURADO", "PENDENTE", "NF-22104", "Vence em 6 dias"],

        // 2. CONVENIÊNCIA
        [2, $atrasado2d, $atrasado2d, "Cervejas Heineken & Stella Artois (1/3)", "Ambev Distribuidora", "Bebidas Alcoólicas", 1200.00, "BOLETO", "PENDENTE", "NF-8820 - Parc. 1/3", "Atrasado urgente"],
        [2, $atrasado2d, $semana3d,   "Cervejas Heineken & Stella Artois (2/3)", "Ambev Distribuidora", "Bebidas Alcoólicas", 1200.00, "BOLETO", "PENDENTE", "NF-8820 - Parc. 2/3", "Vence semana"],
        [2, $atrasado2d, $mes30d,     "Cervejas Heineken & Stella Artois (3/3)", "Ambev Distribuidora", "Bebidas Alcoólicas", 1200.00, "BOLETO", "PENDENTE", "NF-8820 - Parc. 3/3", "Vence próximo mês"],
        [2, $passadoPago,$passadoPago,"Gelo Filtrado em Cubos 5kg (100pcts)", "Gelo Cristal Polar", "Gelo & Carvão", 500.00, "PIX", "PAGO", "NF-6612", "Quitado"],

        // 3. BUFFET
        [3, $passadoPago,$passadoPago,"Camarão Rosa & Salmão Fresco", "Pescados & Cia", "Frutos do Mar", 2200.00, "CARTAO_CREDITO", "PAGO", "NF-5011", "Quitado no cartão"],
        [3, $hojeStr,    $semana6d,   "Locação de Louças & Réchauds (1/2)", "Requinte Festas e Locações", "Locação de Materiais", 950.00, "BOLETO", "PENDENTE", "NF-4401 - Parc. 1/2", "Semana corporativa"],
        [3, $hojeStr,    $mes18d,     "Locação de Louças & Réchauds (2/2)", "Requinte Festas e Locações", "Locação de Materiais", 950.00, "BOLETO", "PENDENTE", "NF-4401 - Parc. 2/2", "Segunda parcela"],
        [3, $hojeStr,    $mes30d,     "Vinhos Finos & Espumantes", "Vinícola Grand Reserva", "Vinhos & Bebidas", 1750.00, "FATURADO", "PENDENTE", "NF-3392", "Casamento próximo mês"]
    ];

    $stmt = $db->prepare("INSERT INTO compras (
        estabelecimento_id, data, vencimento, descricao, fornecedor,
        categoria, valor, forma_pagamento, status, numero_nf, observacoes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    foreach ($comprasIniciais as $row) {
        $stmt->execute($row);
    }
}

function formatBRL($val) {
    return 'R$ ' . number_format((float)$val, 2, ',', '.');
}

function formatDataBR($iso) {
    if (!$iso) return '--/--/----';
    $parts = explode('-', $iso);
    if (count($parts) === 3) {
        return "{$parts[2]}/{$parts[1]}/{$parts[0]}";
    }
    return $iso;
}

initDatabase();

// -----------------------------------------------------------------------------
// ROTEAMENTO & CONTROLADOR DE REQUISIÇÕES (HTTP ROUTER)
// -----------------------------------------------------------------------------
$db = getDB();
$action = $_REQUEST['action'] ?? '';
$unidadeAtual = isset($_GET['unidade']) ? (int)$_GET['unidade'] : 0;
$tabAtual = $_GET['tab'] ?? 'vencimento';
$viewMode = $_GET['view'] ?? 'painel';

// ROTA BASE PARA REDIRECIONAMENTOS
$baseUrl = strtok($_SERVER["REQUEST_URI"], '?');

// 1. ROTA POST: DAR BAIXA EM COMPRA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'dar_baixa') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id > 0) {
        $stmt = $db->prepare("UPDATE compras SET status = 'PAGO' WHERE id = ?");
        $stmt->execute([$id]);
        $_SESSION['flash_msg'] = "✅ Pagamento confirmado! Compra #{$id} quitada com sucesso!";
        $_SESSION['flash_type'] = 'success';
    }
    header("Location: {$baseUrl}?unidade={$unidadeAtual}&tab={$tabAtual}");
    exit;
}

// 2. ROTA POST: ALTERNAR STATUS (PAGO / PENDENTE)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'toggle_status') {
    $id = (int)($_POST['id'] ?? 0);
    $statusAtual = $_POST['status_atual'] ?? 'PENDENTE';
    $novoStatus = ($statusAtual === 'PAGO') ? 'PENDENTE' : 'PAGO';

    if ($id > 0) {
        $stmt = $db->prepare("UPDATE compras SET status = ? WHERE id = ?");
        $stmt->execute([$novoStatus, $id]);
        $_SESSION['flash_msg'] = "Lançamento #{$id} alterado para {$novoStatus}.";
        $_SESSION['flash_type'] = 'info';
    }
    header("Location: {$baseUrl}?unidade={$unidadeAtual}&tab=records");
    exit;
}

// 3. ROTA POST: EXCLUIR COMPRA
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'excluir') {
    $id = (int)($_POST['id'] ?? 0);
    if ($id > 0) {
        $stmt = $db->prepare("DELETE FROM compras WHERE id = ?");
        $stmt->execute([$id]);
        $_SESSION['flash_msg'] = "🗑️ Registro #{$id} excluído com sucesso!";
        $_SESSION['flash_type'] = 'success';
    }
    header("Location: {$baseUrl}?unidade={$unidadeAtual}&tab=records");
    exit;
}

// 3.1 ROTA POST: ZERAR DADOS (DELETE FROM compras)
if ($_SERVER['REQUEST_METHOD'] === 'POST' && ($action === 'zerar_db' || $action === 'limpar_dados')) {
    $db->exec("DELETE FROM compras;");
    try {
        $db->exec("DELETE FROM sqlite_sequence WHERE name = 'compras';");
    } catch (\Exception $e) {}
    $db->exec("INSERT OR REPLACE INTO configuracoes_sistema (chave, valor) VALUES ('seed_executado', '1');");
    $db->exec("INSERT OR REPLACE INTO configuracoes_sistema (chave, valor) VALUES ('banco_limpo', '1');");

    $_SESSION['flash_msg'] = "🗑️ Todos os registros foram apagados com sucesso! O banco de dados está zerado.";
    $_SESSION['flash_type'] = 'info';
    header("Location: {$baseUrl}?unidade=0&tab=records");
    exit;
}

// 4. ROTA POST: CADASTRAR COMPRA / BOLETOS PARCELADOS
if ($_SERVER['REQUEST_METHOD'] === 'POST' && $action === 'salvar_compra') {
    $estabelecimento_id = (int)($_POST['estabelecimento_id'] ?? 0);
    $fornecedor = trim($_POST['fornecedor'] ?? '');
    $descricao = trim($_POST['descricao'] ?? '');
    $categoria = trim($_POST['categoria'] ?? 'Carnes & Aves');
    $valorTotal = (float)str_replace(',', '.', str_replace('.', '', $_POST['valor'] ?? '0'));
    $formaPagamento = trim($_POST['forma_pagamento'] ?? 'BOLETO');
    $dataCompra = trim($_POST['data_compra'] ?? date('Y-m-d'));
    $statusInicial = trim($_POST['status'] ?? 'PENDENTE');
    $qtdParcelas = max(1, min(36, (int)($_POST['qtd_parcelas'] ?? 1)));
    $intervaloDias = (int)($_POST['intervalo_dias'] ?? 30);
    if ($intervaloDias <= 0) $intervaloDias = 30;
    $observacoes = trim($_POST['observacoes'] ?? '');
    $numeroNF = trim($_POST['numero_nf'] ?? '');

    $ehAPrazo = in_array($formaPagamento, ['BOLETO', 'FATURADO']);
    $parcelarDeFato = $ehAPrazo && ($qtdParcelas > 1);

    $vencimentosCustom = $_POST['vencimentos'] ?? [];
    if (!is_array($vencimentosCustom)) {
        $vencimentosCustom = [];
    }

    if ($estabelecimento_id <= 0) {
        $_SESSION['flash_erro'] = "⚠️ Por favor, selecione um estabelecimento válido.";
        header("Location: {$baseUrl}?view=cadastro&unidade={$estabelecimento_id}");
        exit;
    }
    if (empty($fornecedor) || empty($descricao) || $valorTotal <= 0) {
        $_SESSION['flash_erro'] = "⚠️ Preencha todos os campos obrigatórios (Fornecedor, Descrição e Valor maior que zero).";
        header("Location: {$baseUrl}?view=cadastro&unidade={$estabelecimento_id}");
        exit;
    }

    $stmt = $db->prepare("INSERT INTO compras (
        estabelecimento_id, data, vencimento, descricao, fornecedor,
        categoria, valor, forma_pagamento, status, numero_nf, observacoes
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");

    if ($parcelarDeFato) {
        $valorBase = round($valorTotal / $qtdParcelas, 2);
        $diferencaCentavos = round($valorTotal - ($valorBase * $qtdParcelas), 2);
        $dataCompraObj = new DateTime($dataCompra);

        for ($i = 1; $i <= $qtdParcelas; $i++) {
            $valParc = ($i === $qtdParcelas) ? ($valorBase + $diferencaCentavos) : $valorBase;

            // Usa a data customizada preenchida pelo usuário se existir; caso contrário, data calculada
            if (!empty($vencimentosCustom[$i - 1])) {
                $vencIso = trim($vencimentosCustom[$i - 1]);
            } else {
                $dtVenc = clone $dataCompraObj;
                $diasAdd = $i * $intervaloDias;
                $dtVenc->modify("+{$diasAdd} days");
                $vencIso = $dtVenc->format('Y-m-d');
            }

            $descFinal = "{$descricao} ({$i}/{$qtdParcelas})";
            $nfFinal = !empty($numeroNF) ? "{$numeroNF} - Parc. {$i}/{$qtdParcelas}" : "Parc. {$i}/{$qtdParcelas}";
            $obsFinal = trim("Boleto/Parcela {$i} de {$qtdParcelas}. {$observacoes}");

            $stmt->execute([
                $estabelecimento_id, $dataCompra, $vencIso, $descFinal, $fornecedor,
                $categoria, $valParc, $formaPagamento, $statusInicial, $nfFinal, $obsFinal
            ]);
        }
        $_SESSION['flash_msg'] = "✅ Sucesso! {$qtdParcelas} boletos cadastrados com sucesso!";
    } else {
        if ($ehAPrazo) {
            if (!empty($vencimentosCustom[0])) {
                $vencFinal = trim($vencimentosCustom[0]);
            } else {
                $dtVenc = new DateTime($dataCompra);
                $dtVenc->modify("+{$intervaloDias} days");
                $vencFinal = $dtVenc->format('Y-m-d');
            }
        } else {
            $vencFinal = $dataCompra;
        }
        $stmt->execute([
            $estabelecimento_id, $dataCompra, $vencFinal, $descricao, $fornecedor,
            $categoria, $valorTotal, $formaPagamento, $statusInicial, $numeroNF, $observacoes
        ]);
        $_SESSION['flash_msg'] = "✅ Sucesso! Compra cadastrada com sucesso!";
    }

    $_SESSION['flash_type'] = 'success';
    header("Location: {$baseUrl}?unidade=0&view=painel");
    exit;
}

// 5. ROTA GET: EXPORTAR CSV
if ($action === 'exportar_csv') {
    $whereSql = "";
    $params = [];
    if ($unidadeAtual > 0) {
        $whereSql = "WHERE c.estabelecimento_id = ?";
        $params[] = $unidadeAtual;
    }

    $sql = "SELECT c.*, e.nome as unidade_nome
            FROM compras c
            JOIN estabelecimentos e ON c.estabelecimento_id = e.id
            {$whereSql}
            ORDER BY c.vencimento ASC, c.id DESC";
    $stmt = $db->prepare($sql);
    $stmt->execute($params);
    $rows = $stmt->fetchAll();

    header('Content-Type: text/csv; charset=utf-8');
    header('Content-Disposition: attachment; filename="boletos_compras_carlao_' . date('Ymd_His') . '.csv"');

    echo "\xEF\xBB\xBF";
    $output = fopen('php://output', 'w');

    fputcsv($output, [
        'ID', 'Unidade', 'Data Compra', 'Vencimento Boleto', 'Descrição / Boleto Parcela',
        'Fornecedor', 'Categoria', 'Valor Parcela (R$)', 'Forma Pagto', 'Situação', 'Nº NF / Parcela', 'Observações'
    ], ';');

    foreach ($rows as $r) {
        fputcsv($output, [
            $r['id'],
            $r['unidade_nome'],
            formatDataBR($r['data']),
            formatDataBR($r['vencimento']),
            $r['descricao'],
            $r['fornecedor'],
            $r['categoria'],
            number_format($r['valor'], 2, ',', '.'),
            $r['forma_pagamento'],
            $r['status'],
            $r['numero_nf'],
            $r['observacoes']
        ], ';');
    }
    fclose($output);
    exit;
}

// -----------------------------------------------------------------------------
// CONSULTA DE DADOS PARA A INTERFACE
// -----------------------------------------------------------------------------
$queryWhere = "";
$queryParams = [];
if ($unidadeAtual > 0) {
    $queryWhere = "WHERE c.estabelecimento_id = ?";
    $queryParams[] = $unidadeAtual;
}

$stmtCompras = $db->prepare("
    SELECT c.*, e.nome as unidade, e.icone as icone_unidade, e.codigo as codigo_unidade
    FROM compras c
    JOIN estabelecimentos e ON c.estabelecimento_id = e.id
    {$queryWhere}
    ORDER BY c.vencimento ASC, c.id DESC
");
$stmtCompras->execute($queryParams);
$compras = $stmtCompras->fetchAll();

// Métricas
$totalCompras = 0;
$qtdLancamentos = count($compras);
$totalPago = 0;
$qtdPago = 0;
$totalPendente = 0;
$qtdPendente = 0;

foreach ($compras as $c) {
    $totalCompras += $c['valor'];
    if ($c['status'] === 'PAGO') {
        $totalPago += $c['valor'];
        $qtdPago++;
    } else {
        $totalPendente += $c['valor'];
        $qtdPendente++;
    }
}

// Próximo Vencimento
$proximoPendente = null;
foreach ($compras as $c) {
    if ($c['status'] === 'PENDENTE') {
        $proximoPendente = $c;
        break;
    }
}

// Mensagens Flash
$flashMsg = $_SESSION['flash_msg'] ?? null;
$flashType = $_SESSION['flash_type'] ?? 'info';
$flashErro = $_SESSION['flash_erro'] ?? null;
unset($_SESSION['flash_msg'], $_SESSION['flash_type'], $_SESSION['flash_erro']);
?>
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CARLÃO - Sistema Integrado de Gestão de Compras (PHP Vercel)</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body {
            background-color: #0A0E17;
            color: #E2E8F0;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        }
        .brand-gradient {
            background: linear-gradient(135deg, #60A5FA 0%, #3B82F6 40%, #A855F7 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            text-shadow: 0 0 30px rgba(59, 130, 246, 0.45);
        }
    </style>
</head>
<body class="min-h-screen">
    <div class="max-w-[1300px] mx-auto px-4 sm:px-6 py-6">

        <!-- CABEÇALHO DO SISTEMA -->
        <header class="text-center pt-2 pb-4 relative">
            <div class="absolute right-0 top-2 flex items-center gap-2">
                <form method="POST" action="<?= $baseUrl ?>?action=zerar_db" onsubmit="return confirm('Tem certeza que deseja apagar todos os registros de compras?');" class="inline">
                    <button type="submit" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/50 hover:text-white transition shadow-sm" title="Zerar todos os registros de compras">
                        <span>🗑️</span>
                        <span>Zerar Dados</span>
                    </button>
                </form>
            </div>
            <h1 class="text-4xl sm:text-5xl md:text-6xl font-black tracking-widest uppercase brand-gradient mb-1">CARLÃO</h1>
            <div class="text-slate-400 text-xs sm:text-sm font-semibold tracking-widest uppercase mb-5">
                SISTEMA INTEGRADO DE GESTÃO DE COMPRAS
            </div>

            <!-- BADGES DAS 3 UNIDADES -->
            <div class="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 mb-6">
                <div class="bg-gray-900 border border-amber-500/50 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-200 inline-flex items-center gap-2 shadow-lg shadow-amber-950/20">
                    <span class="text-base">🍽️</span>
                    <strong class="text-amber-300">1. RESTAURANTE</strong>
                    <span class="text-slate-400 hidden md:inline text-[11px]">(Cozinha, Salão & Insumos de Preparo)</span>
                </div>
                <div class="bg-gray-900 border border-emerald-500/50 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-200 inline-flex items-center gap-2 shadow-lg shadow-emerald-950/20">
                    <span class="text-base">🏪</span>
                    <strong class="text-emerald-300">2. CONVENIÊNCIA</strong>
                    <span class="text-slate-400 hidden md:inline text-[11px]">(Produtos Prontos, Tabacaria & Bebidas Geladas)</span>
                </div>
                <div class="bg-gray-900 border border-indigo-500/50 px-3.5 py-1.5 rounded-full text-xs font-semibold text-gray-200 inline-flex items-center gap-2 shadow-lg shadow-indigo-950/20">
                    <span class="text-base">🎉</span>
                    <strong class="text-indigo-300">3. BUFFET</strong>
                    <span class="text-slate-400 hidden md:inline text-[11px]">(Eventos, Serviços Corporativos & Recepções)</span>
                </div>
            </div>
        </header>

        <!-- MENSAGENS FLASH -->
        <?php if ($flashMsg): ?>
            <div class="mb-5 bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-lg">
                <span><?= htmlspecialchars($flashMsg) ?></span>
                <button onclick="this.parentElement.remove()" class="text-emerald-400 hover:text-white">&times;</button>
            </div>
        <?php endif; ?>

        <?php if ($flashErro): ?>
            <div class="mb-5 bg-red-950/40 border border-red-500/40 text-red-200 px-4 py-3 rounded-2xl flex items-center justify-between text-xs sm:text-sm font-semibold shadow-lg">
                <span><?= htmlspecialchars($flashErro) ?></span>
                <button onclick="this.parentElement.remove()" class="text-red-400 hover:text-white">&times;</button>
            </div>
        <?php endif; ?>

        <?php if ($viewMode === 'cadastro'): ?>
            <!-- =============================================================== -->
            <!-- FLUXO 1: TELA DE CADASTRO ISOLADA                                -->
            <!-- =============================================================== -->
            <div class="max-w-4xl mx-auto space-y-6">
                <div class="flex items-center justify-between pb-4 border-b border-slate-800">
                    <div>
                        <h2 class="text-xl sm:text-2xl font-black text-slate-100">📝 Cadastrar Nova Compra / Boletos</h2>
                        <p class="text-slate-400 text-xs sm:text-sm mt-0.5">
                            Tela de cadastro isolada. Pressione <strong>ENTER</strong> ou <strong>TAB</strong> para navegar entre os campos.
                        </p>
                    </div>
                    <a href="<?= $baseUrl ?>?unidade=0&view=painel" class="px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800 transition">
                        🌐 Voltar à Visão Consolidada
                    </a>
                </div>

                <form id="form-cadastro" method="POST" action="<?= $baseUrl ?>?action=salvar_compra" class="space-y-6">
                    <!-- Seletor de Estabelecimento -->
                    <div class="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl space-y-3">
                        <label class="text-xs font-bold uppercase tracking-wider text-slate-300 block">
                            🏢 Estabelecimento para Lançamento *
                        </label>
                        <div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <label class="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-amber-500 flex items-center gap-3 cursor-pointer">
                                <input type="radio" name="estabelecimento_id" value="1" <?= ($unidadeAtual == 1 || $unidadeAtual == 0) ? 'checked' : '' ?> class="text-amber-500 focus:ring-amber-500">
                                <div>
                                    <div class="font-extrabold text-sm text-slate-100">🍽️ 1. RESTAURANTE</div>
                                    <div class="text-[11px] text-slate-400">Cozinha & Preparo</div>
                                </div>
                            </label>
                            <label class="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-emerald-500 flex items-center gap-3 cursor-pointer">
                                <input type="radio" name="estabelecimento_id" value="2" <?= ($unidadeAtual == 2) ? 'checked' : '' ?> class="text-emerald-500 focus:ring-emerald-500">
                                <div>
                                    <div class="font-extrabold text-sm text-slate-100">🏪 2. CONVENIÊNCIA</div>
                                    <div class="text-[11px] text-slate-400">Bebidas & Tabacaria</div>
                                </div>
                            </label>
                            <label class="p-3.5 rounded-xl border border-slate-800 bg-slate-900 hover:border-indigo-500 flex items-center gap-3 cursor-pointer">
                                <input type="radio" name="estabelecimento_id" value="3" <?= ($unidadeAtual == 3) ? 'checked' : '' ?> class="text-indigo-500 focus:ring-indigo-500">
                                <div>
                                    <div class="font-extrabold text-sm text-slate-100">🎉 3. BUFFET</div>
                                    <div class="text-[11px] text-slate-400">Eventos & Recepções</div>
                                </div>
                            </label>
                        </div>
                    </div>

                    <!-- Campos em 2 Colunas -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#111827] border border-[#1F2937] p-5 sm:p-6 rounded-2xl">
                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                    🏭 Fornecedor / Empresa *
                                </label>
                                <input type="text" name="fornecedor" required placeholder="Ex: Frigorífico Boi Nobre, Ambev..."
                                       class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                    📦 Descrição Principal do Item / Compra *
                                </label>
                                <textarea name="descricao" rows="2" required placeholder="Ex: Picanha maturada, Fardos de cerveja..."
                                          class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500"></textarea>
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                    🏷️ Categoria *
                                </label>
                                <select name="categoria" class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100">
                                    <?php foreach ($CATEGORIAS_PADRAO as $cat): ?>
                                        <option value="<?= htmlspecialchars($cat) ?>"><?= htmlspecialchars($cat) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                        </div>

                        <div class="space-y-4">
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                    💰 Valor Total da Compra (R$) *
                                </label>
                                <input type="number" step="0.01" min="0.01" name="valor" required placeholder="0,00"
                                       class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-100 focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                    💳 Forma de Pagamento *
                                </label>
                                <select id="forma-pagto" name="forma_pagamento" onchange="toggleParcelas()" class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100">
                                    <?php foreach ($FORMAS_PAGAMENTO as $key => $rotulo): ?>
                                        <option value="<?= $key ?>"><?= htmlspecialchars($rotulo) ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>

                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                    📅 Data da Compra *
                                </label>
                                <input type="date" name="data_compra" value="<?= date('Y-m-d') ?>" required
                                       class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                                <div class="text-[11px] text-slate-400 mt-1 italic">
                                    ℹ️ O vencimento é calculado automaticamente com base na data de compra e no intervalo selecionado (ex: a cada 30 dias).
                                </div>
                            </div>

                            <div>
                                <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                    📌 Situação Inicial *
                                </label>
                                <select name="status" class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100">
                                    <option value="PENDENTE">PENDENTE (A pagar)</option>
                                    <option value="PAGO">PAGO (Já quitado)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <!-- Bloco de Parcelamento Condicional -->
                    <div id="box-parcelamento" class="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl space-y-4">
                        <h4 class="text-xs font-bold uppercase tracking-wider text-slate-300">
                            🔢 Parcelamento / Múltiplos Boletos
                        </h4>
                        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div>
                                <label class="block text-xs text-slate-400 mb-1">Quantidade de Boletos / Parcelas (1 a 36)</label>
                                <input type="number" id="qtd-parcelas" name="qtd_parcelas" min="1" max="36" value="1" onchange="renderizarDatasParcelas()" oninput="renderizarDatasParcelas()"
                                       class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                            </div>
                            <div>
                                <label class="block text-xs text-slate-400 mb-1">Intervalo entre Vencimentos</label>
                                <select id="intervalo-dias" name="intervalo_dias" onchange="renderizarDatasParcelas()" class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100 focus:ring-2 focus:ring-blue-500">
                                    <option value="30">A cada 30 dias (Padrão comercial 30/60/90...)</option>
                                    <option value="15">A cada 15 dias (Quinzenal)</option>
                                    <option value="7">A cada 7 dias (Semanal)</option>
                                    <option value="45">A cada 45 dias</option>
                                    <option value="60">A cada 60 dias (Bimestral)</option>
                                </select>
                            </div>
                        </div>

                        <!-- Lista Dinâmica de Datas Individuais por Parcela/Boleto -->
                        <div id="box-datas-individuais" class="pt-4 border-t border-slate-800 space-y-3">
                            <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                                <label class="text-xs font-bold uppercase tracking-wider text-blue-400 block">
                                    📅 Vencimento Individual por Parcela / Boleto
                                </label>
                                <span class="text-[11px] text-slate-400">Datas calculadas automaticamente (ajuste manual livre)</span>
                            </div>
                            <p class="text-[11px] text-slate-400 leading-relaxed">
                                O sistema pré-preenche as datas com base na data da compra + intervalo de 30 dias (ou selecionado). Você pode alterar a data individual de cada parcela abaixo se o boleto real tiver vencimento diferente:
                            </p>
                            <div id="grid-vencimentos" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                <!-- Preenchido dinamicamente via JavaScript -->
                            </div>
                        </div>
                    </div>

                    <!-- Observações e Nota Fiscal -->
                    <div class="bg-[#111827] border border-[#1F2937] p-5 rounded-2xl space-y-4">
                        <div>
                            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                🗒️ Observações Adicionais
                            </label>
                            <textarea name="observacoes" rows="2" placeholder="Detalhes adicionais..."
                                      class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100"></textarea>
                        </div>
                        <div>
                            <label class="block text-xs font-bold uppercase tracking-wider text-slate-300 mb-1.5">
                                📄 Nº Nota Fiscal / Pedido
                            </label>
                            <input type="text" name="numero_nf" placeholder="Ex: NF-10842"
                                   class="w-full bg-[#0F172A] border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-slate-100">
                        </div>
                    </div>

                    <button type="submit" class="w-full py-4 px-6 rounded-2xl font-black text-sm tracking-wider uppercase bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl transition">
                        💾 SALVAR E REGISTRAR COMPRA
                    </button>
                </form>
            </div>

            <script>
                function renderizarDatasParcelas() {
                    const dataCompraInput = document.querySelector('input[name="data_compra"]');
                    const qtdInput = document.getElementById('qtd-parcelas');
                    const intervaloSelect = document.getElementById('intervalo-dias');
                    const grid = document.getElementById('grid-vencimentos');
                    if (!grid) return;

                    const qtd = Math.max(1, Math.min(36, parseInt(qtdInput ? qtdInput.value : 1) || 1));
                    const intervalo = parseInt(intervaloSelect ? intervaloSelect.value : 30) || 30;
                    const dataCompraVal = dataCompraInput ? dataCompraInput.value : '';

                    // Salvar valores já editados pelo usuário
                    const inputsAtuais = grid.querySelectorAll('input[name="vencimentos[]"]');
                    const valoresSalvos = [];
                    inputsAtuais.forEach(inp => valoresSalvos.push(inp.value));

                    grid.innerHTML = '';

                    const baseDate = dataCompraVal ? new Date(dataCompraVal + 'T00:00:00') : new Date();

                    for (let i = 1; i <= qtd; i++) {
                        const itemDate = new Date(baseDate);
                        itemDate.setDate(itemDate.getDate() + (i * intervalo));
                        const y = itemDate.getFullYear();
                        const m = String(itemDate.getMonth() + 1).padStart(2, '0');
                        const d = String(itemDate.getDate()).padStart(2, '0');
                        const defaultDate = `${y}-${m}-${d}`;

                        const valorFinal = (valoresSalvos[i - 1]) ? valoresSalvos[i - 1] : defaultDate;

                        const card = document.createElement('div');
                        card.className = 'bg-[#0F172A] border border-slate-700/80 rounded-xl p-3 space-y-1.5 focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500 transition';
                        card.innerHTML = `
                            <div class="flex items-center justify-between text-xs">
                                <span class="font-extrabold text-slate-200">
                                    📄 ${qtd > 1 ? 'Boleto ' + i + '/' + qtd : 'Boleto / Parcela Única'}
                                </span>
                                <span class="text-[10px] text-blue-400 font-mono">+${i * intervalo}d</span>
                            </div>
                            <input type="date" name="vencimentos[]" value="${valorFinal}" required
                                   class="w-full bg-[#111827] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs sm:text-sm text-slate-100 font-mono focus:outline-none focus:border-blue-500">
                        `;
                        grid.appendChild(card);
                    }
                }

                function toggleParcelas() {
                    const sel = document.getElementById('forma-pagto').value;
                    const ehPrazo = (sel === 'BOLETO' || sel === 'FATURADO');
                    document.getElementById('box-parcelamento').style.display = ehPrazo ? 'block' : 'none';
                    if (ehPrazo) {
                        renderizarDatasParcelas();
                    }
                }

                const dtCompraEl = document.querySelector('input[name="data_compra"]');
                if (dtCompraEl) {
                    dtCompraEl.addEventListener('change', renderizarDatasParcelas);
                }

                toggleParcelas();

                // Navegação com tecla ENTER entre campos de formulário
                document.getElementById('form-cadastro').addEventListener('keydown', function(e) {
                    if (e.key === 'Enter') {
                        const target = e.target;
                        if (target.tagName === 'BUTTON' || target.type === 'submit') return;
                        if (target.tagName === 'TEXTAREA' && e.shiftKey) return;
                        e.preventDefault();

                        const inputs = Array.from(this.querySelectorAll('input:not([type="hidden"]), select, textarea, button[type="submit"]'));
                        const index = inputs.indexOf(target);
                        if (index > -1 && index < inputs.length - 1) {
                            inputs[index + 1].focus();
                        }
                    }
                });
            </script>

        <?php else: ?>
            <!-- =============================================================== -->
            <!-- FLUXO 2: TELA PRINCIPAL (PAINEL & MÉTRICAS)                     -->
            <!-- =============================================================== -->
            <!-- BARRA DE NAVEGAÇÃO -->
            <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-4 mb-4 border-b border-slate-800">
                <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 flex-1">
                    <a href="<?= $baseUrl ?>?unidade=0&tab=<?= $tabAtual ?>" 
                       class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition <?= ($unidadeAtual == 0) ? 'bg-blue-600 text-white ring-2 ring-blue-400' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' ?>">
                        <span>🌐 CONSOLIDADA</span>
                    </a>
                    <a href="<?= $baseUrl ?>?unidade=1&tab=<?= $tabAtual ?>" 
                       class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition <?= ($unidadeAtual == 1) ? 'bg-amber-600 text-white ring-2 ring-amber-400' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' ?>">
                        <span>🍽️ RESTAURANTE</span>
                    </a>
                    <a href="<?= $baseUrl ?>?unidade=2&tab=<?= $tabAtual ?>" 
                       class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition <?= ($unidadeAtual == 2) ? 'bg-emerald-600 text-white ring-2 ring-emerald-400' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' ?>">
                        <span>🏪 CONVENIÊNCIA</span>
                    </a>
                    <a href="<?= $baseUrl ?>?unidade=3&tab=<?= $tabAtual ?>" 
                       class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm tracking-wide transition <?= ($unidadeAtual == 3) ? 'bg-indigo-600 text-white ring-2 ring-indigo-400' : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800' ?>">
                        <span>🎉 BUFFET</span>
                    </a>
                </div>

                <a href="<?= $baseUrl ?>?view=cadastro&unidade=<?= $unidadeAtual ?>" 
                   class="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl font-extrabold text-xs sm:text-sm tracking-wide bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-600/30 transition">
                    <span>➕ NOVA COMPRA</span>
                </a>
            </div>

            <!-- CARDS DE MÉTRICAS -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div class="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg">
                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">💳 Total de Compras</div>
                    <div class="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono"><?= formatBRL($totalCompras) ?></div>
                    <div class="text-xs text-slate-500 mt-1">Valor total acumulado</div>
                </div>

                <div class="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg">
                    <div class="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">📦 Lançamentos / Boletos</div>
                    <div class="text-2xl sm:text-3xl font-extrabold text-slate-100 font-mono"><?= $qtdLancamentos ?></div>
                    <div class="text-xs text-slate-500 mt-1">Movimentações cadastradas</div>
                </div>

                <div class="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg">
                    <div class="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">✅ Liquidado (Pago)</div>
                    <div class="text-2xl sm:text-3xl font-extrabold text-emerald-400 font-mono"><?= formatBRL($totalPago) ?></div>
                    <div class="text-xs text-slate-500 mt-1"><?= $qtdPago ?> despesas quitadas</div>
                </div>

                <div class="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 shadow-lg">
                    <div class="text-amber-400 text-xs font-bold uppercase tracking-wider mb-1">⏳ A Pagar (Pendente)</div>
                    <div class="text-2xl sm:text-3xl font-extrabold text-amber-400 font-mono"><?= formatBRL($totalPendente) ?></div>
                    <div class="text-xs text-slate-500 mt-1"><?= $qtdPendente ?> contas pendentes</div>
                </div>
            </div>

            <!-- ABAS DO PAINEL -->
            <div class="border-b border-slate-800 mb-4">
                <nav class="flex space-x-2 sm:space-x-4 overflow-x-auto pb-px">
                    <a href="<?= $baseUrl ?>?unidade=<?= $unidadeAtual ?>&tab=vencimento" 
                       class="py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap <?= ($tabAtual === 'vencimento') ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200' ?>">
                        🔔 Próximo Vencimento & Dar Baixa
                    </a>
                    <a href="<?= $baseUrl ?>?unidade=<?= $unidadeAtual ?>&tab=records" 
                       class="py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap <?= ($tabAtual === 'records') ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200' ?>">
                        📋 Todos os Registros & Filtros
                    </a>
                    <a href="<?= $baseUrl ?>?unidade=<?= $unidadeAtual ?>&tab=charts" 
                       class="py-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition whitespace-nowrap <?= ($tabAtual === 'charts') ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200' ?>">
                        📈 Análise por Categoria
                    </a>
                </nav>
            </div>

            <!-- CONTEÚDO DAS ABAS -->
            <?php if ($tabAtual === 'vencimento'): ?>
                <!-- ABA 1: PRÓXIMO VENCIMENTO & DAR BAIXA -->
                <?php if (!$proximoPendente): ?>
                    <div class="bg-[#0F172A] border border-emerald-500/40 rounded-2xl p-8 text-center my-4 shadow-xl">
                        <div class="text-4xl mb-3">🎉</div>
                        <h3 class="text-xl font-extrabold text-emerald-400 mb-1">Excelente! Nenhuma pendência!</h3>
                        <p class="text-slate-300 text-sm">Não há contas ou boletos pendentes para a unidade selecionada. Tudo quitado!</p>
                    </div>
                <?php else: 
                    $hojeDate = new DateTime(date('Y-m-d'));
                    $vencDate = new DateTime($proximoPendente['vencimento']);
                    $diff = (int)$hojeDate->diff($vencDate)->format('%r%a');

                    if ($diff < 0) {
                        $atraso = abs($diff);
                        $badge = "🚨 VENCIDO (Atrasado há {$atraso} dia" . ($atraso > 1 ? 's' : '') . ")";
                        $urgencia = "Urgente - Exige Pagamento Imediato";
                        $corBadge = "bg-red-500 text-white";
                        $corValor = "text-red-400";
                        $cardBg = "bg-red-950/20 border-red-500/40 border-l-red-500";
                    } elseif ($diff === 0) {
                        $badge = "🚨 VENCE HOJE!";
                        $urgencia = "Atenção - Vencimento na data de hoje";
                        $corBadge = "bg-red-500 text-white";
                        $corValor = "text-red-400";
                        $cardBg = "bg-red-950/20 border-red-500/40 border-l-red-500";
                    } elseif ($diff === 1) {
                        $badge = "⚠️ VENCE AMANHÃ!";
                        $urgencia = "Atenção - Vence amanhã";
                        $corBadge = "bg-amber-500 text-slate-950";
                        $corValor = "text-amber-400";
                        $cardBg = "bg-amber-950/20 border-amber-500/40 border-l-amber-500";
                    } elseif ($diff <= 7) {
                        $badge = "⚠️ VENCE EM {$diff} DIAS";
                        $urgencia = "Vencimento nesta semana";
                        $corBadge = "bg-amber-400 text-slate-950";
                        $corValor = "text-amber-300";
                        $cardBg = "bg-amber-950/20 border-amber-500/30 border-l-amber-400";
                    } else {
                        $badge = "📅 VENCE EM {$diff} DIAS";
                        $urgencia = "Programado para as próximas semanas";
                        $corBadge = "bg-blue-600 text-white";
                        $corValor = "text-blue-400";
                        $cardBg = "bg-blue-950/20 border-blue-500/30 border-l-blue-500";
                    }
                ?>
                    <div class="space-y-4">
                        <div class="border border-l-8 <?= $cardBg ?> rounded-2xl p-5 sm:p-7 shadow-xl">
                            <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
                                <span class="text-xs font-black px-3 py-1.5 rounded-md uppercase tracking-wider <?= $corBadge ?>">
                                    <?= $badge ?>
                                </span>
                                <span class="text-xs font-bold text-slate-400"><?= $urgencia ?></span>
                            </div>

                            <div class="flex flex-col md:flex-row md:items-start justify-between gap-6">
                                <div class="flex-1 space-y-3">
                                    <div>
                                        <h2 class="text-2xl sm:text-3xl font-black text-slate-100 mb-1"><?= htmlspecialchars($proximoPendente['fornecedor']) ?></h2>
                                        <p class="text-slate-300 text-base sm:text-lg"><?= htmlspecialchars($proximoPendente['descricao']) ?></p>
                                    </div>
                                    <div class="flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                        <span class="bg-slate-900 border border-slate-800 text-slate-200 px-2.5 py-1 rounded-md font-semibold">
                                            <?= $proximoPendente['icone_unidade'] ?> <?= $proximoPendente['unidade'] ?>
                                        </span>
                                        <span class="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">🏷️ <?= htmlspecialchars($proximoPendente['categoria']) ?></span>
                                        <span class="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">📄 NF: <?= htmlspecialchars($proximoPendente['numero_nf'] ?: 'S/N') ?></span>
                                        <span class="bg-slate-900 border border-slate-800 px-2.5 py-1 rounded-md">💳 <?= htmlspecialchars($proximoPendente['forma_pagamento']) ?></span>
                                    </div>
                                </div>

                                <div class="md:text-right flex flex-col md:items-end justify-between pt-2 border-t md:border-t-0 border-slate-800">
                                    <div class="text-[11px] uppercase tracking-wider font-bold text-slate-400">Valor da Fatura / Boleto</div>
                                    <div class="text-3xl sm:text-4xl font-black tracking-tight <?= $corValor ?> my-1 font-mono">
                                        <?= formatBRL($proximoPendente['valor']) ?>
                                    </div>
                                    <div class="text-xs text-slate-300">
                                        Vencimento: <strong class="text-slate-100"><?= formatDataBR($proximoPendente['vencimento']) ?></strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
                            <form method="POST" action="<?= $baseUrl ?>?action=dar_baixa&unidade=<?= $unidadeAtual ?>" class="md:col-span-2">
                                <input type="hidden" name="id" value="<?= $proximoPendente['id'] ?>">
                                <button type="submit" class="w-full py-3.5 px-6 rounded-xl font-black text-sm bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition">
                                    ✅ DAR BAIXA / CONFIRMAR PAGAMENTO
                                </button>
                            </form>
                            <div class="md:col-span-3 bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 flex items-center justify-between text-xs text-slate-300">
                                <span>Há outros <strong class="text-blue-400"><?= max(0, $qtdPendente - 1) ?> pagamentos pendentes</strong> na fila.</span>
                                <a href="<?= $baseUrl ?>?unidade=<?= $unidadeAtual ?>&tab=records" class="text-blue-400 font-bold underline">Ver todos</a>
                            </div>
                        </div>
                    </div>
                <?php endif; ?>

            <?php elseif ($tabAtual === 'records'): ?>
                <!-- ABA 2: TODOS OS REGISTROS & FILTROS -->
                <div class="space-y-4">
                    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <h3 class="text-lg font-extrabold text-slate-100">📋 Movimentações & Boletos Registrados</h3>
                        <div class="flex items-center gap-2">
                            <form method="POST" action="<?= $baseUrl ?>?action=zerar_db" onsubmit="return confirm('Tem certeza que deseja apagar todos os registros de compras?');" class="inline">
                                <button type="submit" class="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl font-bold text-xs bg-red-950/40 border border-red-500/40 text-red-300 hover:bg-red-900/50 hover:text-white transition shadow-sm" title="Zerar todos os registros de compras">
                                    <span>🗑️</span>
                                    <span>Zerar Dados</span>
                                </button>
                            </form>
                            <a href="<?= $baseUrl ?>?action=exportar_csv&unidade=<?= $unidadeAtual ?>" 
                               class="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition">
                                📥 Exportar Planilha (CSV)
                            </a>
                        </div>
                    </div>

                    <div class="overflow-x-auto border border-[#1E293B] rounded-xl bg-[#0F172A]">
                        <table class="w-full text-left border-collapse text-xs sm:text-sm">
                            <thead>
                                <tr class="border-b border-[#1E293B] bg-slate-900 text-slate-400 text-[11px] uppercase tracking-wider font-bold">
                                    <th class="py-3 px-3">ID</th>
                                    <th class="py-3 px-3">Unidade</th>
                                    <th class="py-3 px-3">Compra</th>
                                    <th class="py-3 px-3">Vencimento</th>
                                    <th class="py-3 px-3">Descrição / Parcela</th>
                                    <th class="py-3 px-3">Fornecedor</th>
                                    <th class="py-3 px-3">Categoria</th>
                                    <th class="py-3 px-3 text-right">Valor</th>
                                    <th class="py-3 px-3">Pagto</th>
                                    <th class="py-3 px-3">Situação</th>
                                    <th class="py-3 px-3">Nº NF</th>
                                    <th class="py-3 px-3 text-center">Ações</th>
                                </tr>
                            </thead>
                            <tbody class="divide-y divide-slate-800">
                                <?php if (empty($compras)): ?>
                                    <tr>
                                        <td colspan="12" class="py-8 text-center text-slate-400">Nenhum lançamento encontrado.</td>
                                    </tr>
                                <?php else: ?>
                                    <?php foreach ($compras as $item): 
                                        $isPago = ($item['status'] === 'PAGO');
                                    ?>
                                        <tr class="hover:bg-slate-800/40 transition">
                                            <td class="py-2.5 px-3 font-mono text-slate-400 font-bold">#<?= $item['id'] ?></td>
                                            <td class="py-2.5 px-3 whitespace-nowrap">
                                                <span class="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs bg-slate-900 border border-slate-800 text-slate-200">
                                                    <?= $item['icone_unidade'] ?> <?= $item['unidade'] ?>
                                                </span>
                                            </td>
                                            <td class="py-2.5 px-3 text-slate-400 whitespace-nowrap"><?= formatDataBR($item['data']) ?></td>
                                            <td class="py-2.5 px-3 font-semibold text-slate-200 whitespace-nowrap"><?= formatDataBR($item['vencimento']) ?></td>
                                            <td class="py-2.5 px-3 max-w-[200px] truncate text-slate-200" title="<?= htmlspecialchars($item['descricao']) ?>"><?= htmlspecialchars($item['descricao']) ?></td>
                                            <td class="py-2.5 px-3 font-medium text-slate-300"><?= htmlspecialchars($item['fornecedor']) ?></td>
                                            <td class="py-2.5 px-3 text-slate-400"><?= htmlspecialchars($item['categoria']) ?></td>
                                            <td class="py-2.5 px-3 text-right font-bold text-slate-100 whitespace-nowrap font-mono"><?= formatBRL($item['valor']) ?></td>
                                            <td class="py-2.5 px-3 text-xs text-slate-400 whitespace-nowrap"><?= htmlspecialchars($item['forma_pagamento']) ?></td>
                                            <td class="py-2.5 px-3 whitespace-nowrap">
                                                <form method="POST" action="<?= $baseUrl ?>?action=toggle_status&unidade=<?= $unidadeAtual ?>" class="inline">
                                                    <input type="hidden" name="id" value="<?= $item['id'] ?>">
                                                    <input type="hidden" name="status_atual" value="<?= $item['status'] ?>">
                                                    <button type="submit" class="px-2.5 py-1 rounded text-xs font-bold <?= $isPago ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30' ?>">
                                                        <?= $item['status'] ?>
                                                    </button>
                                                </form>
                                            </td>
                                            <td class="py-2.5 px-3 text-xs text-slate-400 font-mono"><?= htmlspecialchars($item['numero_nf'] ?: 'S/N') ?></td>
                                            <td class="py-2.5 px-3 text-center whitespace-nowrap">
                                                <form method="POST" action="<?= $baseUrl ?>?action=excluir&unidade=<?= $unidadeAtual ?>" onsubmit="return confirm('Confirma exclusão do lançamento #<?= $item['id'] ?>?')" class="inline">
                                                    <input type="hidden" name="id" value="<?= $item['id'] ?>">
                                                    <button type="submit" class="text-slate-500 hover:text-red-400 p-1 font-bold" title="Excluir">✕</button>
                                                </form>
                                            </td>
                                        </tr>
                                    <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>

            <?php elseif ($tabAtual === 'charts'): ?>
                <!-- ABA 3: ANÁLISE POR CATEGORIA & PAGAMENTO -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Categorias -->
                    <div class="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 space-y-4">
                        <h4 class="text-sm font-extrabold text-slate-200 uppercase tracking-wider">🎯 Gastos por Categoria</h4>
                        <div class="space-y-3">
                            <?php 
                            $catMap = [];
                            foreach ($compras as $c) {
                                $catMap[$c['categoria']] = ($catMap[$c['categoria']] ?? 0) + $c['valor'];
                            }
                            arsort($catMap);
                            foreach ($catMap as $catNome => $valCat): 
                                $perc = ($totalCompras > 0) ? ($valCat / $totalCompras) * 100 : 0;
                            ?>
                                <div>
                                    <div class="flex items-center justify-between text-xs mb-1">
                                        <span class="text-slate-300 font-medium"><?= htmlspecialchars($catNome) ?></span>
                                        <span class="font-mono text-slate-200 font-bold"><?= formatBRL($valCat) ?> (<?= number_format($perc, 1) ?>%)</span>
                                    </div>
                                    <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-blue-500 rounded-full" style="width: <?= $perc ?>%"></div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>

                    <!-- Formas de Pagamento -->
                    <div class="bg-[#111827] border border-[#1F2937] rounded-2xl p-5 space-y-4">
                        <h4 class="text-sm font-extrabold text-slate-200 uppercase tracking-wider">💳 Formas de Pagamento</h4>
                        <div class="space-y-3">
                            <?php 
                            $pagtoMap = [];
                            foreach ($compras as $c) {
                                $pagtoMap[$c['forma_pagamento']] = ($pagtoMap[$c['forma_pagamento']] ?? 0) + $c['valor'];
                            }
                            arsort($pagtoMap);
                            foreach ($pagtoMap as $pagtoNome => $valPagto): 
                                $percP = ($totalCompras > 0) ? ($valPagto / $totalCompras) * 100 : 0;
                            ?>
                                <div>
                                    <div class="flex items-center justify-between text-xs mb-1">
                                        <span class="text-slate-300 font-medium"><?= htmlspecialchars($pagtoNome) ?></span>
                                        <span class="font-mono text-slate-200 font-bold"><?= formatBRL($valPagto) ?></span>
                                    </div>
                                    <div class="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                                        <div class="h-full bg-emerald-500 rounded-full" style="width: <?= $percP ?>%"></div>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    </div>
                </div>
            <?php endif; ?>

        <?php endif; ?>

        <!-- RODAPÉ -->
        <footer class="mt-12 pt-6 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <div>
                <strong class="text-slate-400">CARLÃO - SISTEMA INTEGRADO DE GESTÃO DE COMPRAS (PHP)</strong>
                <div>Unidades: 🍽️ Restaurante | 🏪 Conveniência | 🎉 Buffet • Ambiente: <?= $isVercel ? 'Vercel Serverless (/tmp/gestao_compras.db)' : 'Servidor Web Local' ?></div>
            </div>
        </footer>

    </div>
</body>
</html>
