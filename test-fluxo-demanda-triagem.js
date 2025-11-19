/**
 * Script de teste do fluxo completo: Cadastro de Demanda + Triagem
 * 
 * Este script testa:
 * 1. Login com credenciais
 * 2. Criação de uma demanda completa
 * 3. Triagem da demanda criada
 * 4. Verificação de problemas
 */

const BASE_URL = 'http://localhost:3055';
const EMAIL = 'claudio@faktory.com.br';
const PASSWORD = '#3beBREs';

let accessToken = '';
let refreshToken = '';
let tenantId = '';
let userId = '';
let demandaId = '';
let produtoId = '';

// Função auxiliar para fazer requisições HTTP
async function fetchAPI(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  if (tenantId) {
    headers['X-Tenant-Id'] = tenantId;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      throw new Error(
        `HTTP ${response.status}: ${data.message || data.error || response.statusText}\n${JSON.stringify(data, null, 2)}`
      );
    }

    return data;
  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Erro de conexão: Verifique se o backend está rodando em ${BASE_URL}`);
    }
    throw error;
  }
}

// 1. Login
async function fazerLogin() {
  console.log('\n🔐 [1/5] Fazendo login...');
  
  try {
    const response = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: EMAIL,
        password: PASSWORD,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Erro no login: ${data.message || JSON.stringify(data)}`);
    }

    accessToken = data.tokens?.accessToken || data.accessToken;
    refreshToken = data.tokens?.refreshToken || data.refreshToken;
    tenantId = data.user?.defaultTenantId || data.tenantId || data.user?.tenants?.[0]?.id;
    userId = data.user?.id || data.userId;

    if (!accessToken) {
      throw new Error('Token de acesso não recebido na resposta do login');
    }

    console.log('✅ Login realizado com sucesso!');
    console.log(`   Tenant ID: ${tenantId}`);
    console.log(`   User ID: ${userId}`);
    return true;
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    throw error;
  }
}

// 2. Buscar produtos disponíveis
async function buscarProdutos() {
  console.log('\n📦 [2/5] Buscando produtos disponíveis...');
  
  try {
    const produtos = await fetchAPI('/produtos');
    
    if (!produtos || produtos.length === 0) {
      throw new Error('Nenhum produto encontrado. É necessário ter pelo menos um produto cadastrado.');
    }

    produtoId = produtos[0].id;
    console.log(`✅ Produto encontrado: ${produtos[0].nome} (ID: ${produtoId})`);
    return produtos;
  } catch (error) {
    console.error('❌ Erro ao buscar produtos:', error.message);
    throw error;
  }
}

// 3. Buscar catálogos (tipos, origens, prioridades, status)
async function buscarCatalogos() {
  console.log('\n📋 [2.5/5] Buscando catálogos...');
  
  try {
    const [tipos, origens, prioridades, status] = await Promise.all([
      fetchAPI('/catalogos/tipo_demanda/itens'),
      fetchAPI('/catalogos/origem_demanda/itens'),
      fetchAPI('/catalogos/prioridade_nivel/itens'),
      fetchAPI('/catalogos/status_demanda/itens'),
    ]);

    const tipoId = tipos?.itens?.[0]?.id || tipos?.[0]?.id;
    const origemId = origens?.itens?.[0]?.id || origens?.[0]?.id;
    const prioridadeId = prioridades?.itens?.[0]?.id || prioridades?.[0]?.id;
    const statusId = status?.itens?.[0]?.id || status?.[0]?.id;

    // Se não encontrar por slug, tentar usar valores legacy
    const tipoSlug = tipos?.itens?.[0]?.slug || tipos?.[0]?.slug || tipos?.itens?.[0]?.metadata?.legacyValue || 'FEATURE';
    const origemSlug = origens?.itens?.[0]?.slug || origens?.[0]?.slug || origens?.itens?.[0]?.metadata?.legacyValue || 'CLIENTE';
    const prioridadeSlug = prioridades?.itens?.[0]?.slug || prioridades?.[0]?.slug || prioridades?.itens?.[0]?.metadata?.legacyValue || 'MEDIA';
    const statusSlug = status?.itens?.[0]?.slug || status?.[0]?.slug || status?.itens?.[0]?.metadata?.legacyValue || 'NOVO';

    console.log(`✅ Catálogos carregados:`);
    console.log(`   Tipo: ${tipoSlug}`);
    console.log(`   Origem: ${origemSlug}`);
    console.log(`   Prioridade: ${prioridadeSlug}`);
    console.log(`   Status: ${statusSlug}`);

    return {
      tipo: tipoId || tipoSlug,
      origem: origemId || origemSlug,
      prioridade: prioridadeId || prioridadeSlug,
      status: statusId || statusSlug,
    };
  } catch (error) {
    console.warn('⚠️  Erro ao buscar catálogos (usando valores padrão):', error.message);
    // Retornar valores padrão caso os catálogos não estejam disponíveis
    return {
      tipo: 'FEATURE',
      origem: 'CLIENTE',
      prioridade: 'MEDIA',
      status: 'NOVO',
    };
  }
}

// 4. Criar demanda completa
async function criarDemanda(catalogos) {
  console.log('\n📝 [3/5] Criando demanda completa...');
  
  const demandaData = {
    titulo: 'Melhorar experiência de onboarding para novos usuários',
    tipo: catalogos.tipo,
    produtoId: produtoId,
    descricao: `Problema identificado: 70% dos novos usuários abandonam o processo de onboarding no passo 3.

Contexto:
- Análise de analytics mostra queda significativa na conversão
- Feedback de usuários indica confusão na interface
- Impacto direto na taxa de ativação de novos clientes

Evidências:
- Screenshots do funil de conversão
- Transcrições de entrevistas com usuários
- Comparação com benchmarks do mercado

Público afetado: Novos usuários, especialmente clientes médios
Volume impactado: Aproximadamente 70% dos novos cadastros
Severidade: Alta`,
    origem: catalogos.origem,
    origemDetalhe: 'Solicitação via suporte técnico - Ticket #1234',
    prioridade: catalogos.prioridade,
    status: catalogos.status,
  };

  try {
    const resultado = await fetchAPI('/demandas/rapida', {
      method: 'POST',
      body: JSON.stringify(demandaData),
    });

    demandaId = resultado.id;
    console.log(`✅ Demanda criada com sucesso!`);
    console.log(`   ID: ${demandaId}`);
    console.log(`   Título: ${demandaData.titulo}`);
    return resultado;
  } catch (error) {
    console.error('❌ Erro ao criar demanda:', error.message);
    throw error;
  }
}

// 5. Verificar se a demanda aparece na triagem
async function verificarDemandaNaTriagem() {
  console.log('\n🔍 [4/5] Verificando se demanda aparece na triagem...');
  
  try {
    const resultado = await fetchAPI('/triagem/demandas-pendentes?page=1&page_size=50');
    
    const demandas = resultado.data || [];
    const demandaEncontrada = demandas.find(d => d.id === demandaId);

    if (demandaEncontrada) {
      console.log(`✅ Demanda encontrada na triagem!`);
      console.log(`   Status de triagem: ${demandaEncontrada.triagem?.statusLabel || 'Pendente'}`);
      return demandaEncontrada;
    } else {
      console.log('⚠️  Demanda não encontrada na lista de pendentes (pode estar em outro status)');
      return null;
    }
  } catch (error) {
    console.error('❌ Erro ao verificar triagem:', error.message);
    throw error;
  }
}

// 6. Fazer triagem da demanda
async function fazerTriagem() {
  console.log('\n🎯 [5/5] Fazendo triagem da demanda...');
  
  try {
    // Primeiro, atualizar status para PENDENTE_TRIAGEM se necessário
    await fetchAPI(`/triagem/demandas/${demandaId}/triar`, {
      method: 'PATCH',
      body: JSON.stringify({
        novoStatus: 'PENDENTE_TRIAGEM',
      }),
    });

    console.log('   ✓ Status atualizado para PENDENTE_TRIAGEM');

    // Agora fazer a triagem completa
    const triagemData = {
      novoStatus: 'PRONTO_DISCOVERY',
      impacto: 'ALTO',
      urgencia: 'MEDIA',
      complexidade: 'MEDIA',
      checklistAtualizacoes: [
        { itemId: 'descricao_completa', completed: true },
        { itemId: 'produto_correto', completed: true },
        { itemId: 'evidencias_fornecidas', completed: true },
        { itemId: 'impacto_definido', completed: true },
        { itemId: 'sem_duplicacoes', completed: true },
      ],
    };

    await fetchAPI(`/triagem/demandas/${demandaId}/triar`, {
      method: 'PATCH',
      body: JSON.stringify(triagemData),
    });

    console.log('   ✓ Triagem realizada com sucesso');
    console.log(`   ✓ Impacto: ${triagemData.impacto}`);
    console.log(`   ✓ Urgência: ${triagemData.urgencia}`);
    console.log(`   ✓ Complexidade: ${triagemData.complexidade}`);
    console.log(`   ✓ Status: ${triagemData.novoStatus}`);

    // Evoluir para Discovery
    console.log('\n   🚀 Evoluindo para Discovery...');
    const discoveryResult = await fetchAPI(`/triagem/demandas/${demandaId}/evoluir-discovery`, {
      method: 'POST',
    });

    console.log(`   ✅ Discovery criado! ID: ${discoveryResult.data?.discoveryId || discoveryResult.discoveryId || 'N/A'}`);

    return true;
  } catch (error) {
    console.error('❌ Erro ao fazer triagem:', error.message);
    throw error;
  }
}

// Função principal
async function executarTeste() {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  TESTE DE FLUXO: CADASTRO DE DEMANDA + TRIAGEM');
  console.log('═══════════════════════════════════════════════════════════');

  try {
    await fazerLogin();
    await buscarProdutos();
    const catalogos = await buscarCatalogos();
    await criarDemanda(catalogos);
    await verificarDemandaNaTriagem();
    await fazerTriagem();

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ✅ TESTE CONCLUÍDO COM SUCESSO!');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`\n📊 Resumo:`);
    console.log(`   • Demanda criada: #${demandaId}`);
    console.log(`   • Triagem realizada com sucesso`);
    console.log(`   • Demanda evoluída para Discovery`);
    console.log(`\n🔗 URLs úteis:`);
    console.log(`   • Frontend: http://localhost:3056`);
    console.log(`   • Ver demanda: http://localhost:3056/demandas/${demandaId}`);
    console.log(`   • Ver triagem: http://localhost:3056/triagem`);
    console.log('\n');
  } catch (error) {
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('  ❌ TESTE FALHOU');
    console.log('═══════════════════════════════════════════════════════════');
    console.error(`\nErro: ${error.message}\n`);
    process.exit(1);
  }
}

// Executar teste
executarTeste();

