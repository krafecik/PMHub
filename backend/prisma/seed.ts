/* eslint-disable no-console */
import 'dotenv/config';
import { PrismaClient, AuthProvider, TenantRole, Prisma } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

type CatalogItemSeed = {
  slug: string;
  label: string;
  descricao?: string;
  metadata?: Record<string, unknown>;
  ordem?: number;
  ativo?: boolean;
};

type CatalogDefinition = {
  slug: string;
  nome: string;
  descricao?: string;
  items: CatalogItemSeed[];
};

const CATALOG_DEFINITIONS: CatalogDefinition[] = [
  {
    slug: 'tipo_demanda',
    nome: 'Tipos de demanda',
    descricao: 'Classificação das demandas capturadas.',
    items: [
      { slug: 'ideia', label: 'Ideia', metadata: { legacyValue: 'IDEIA' } },
      { slug: 'problema', label: 'Problema', metadata: { legacyValue: 'PROBLEMA' } },
      { slug: 'oportunidade', label: 'Oportunidade', metadata: { legacyValue: 'OPORTUNIDADE' } },
      { slug: 'outro', label: 'Outro', metadata: { legacyValue: 'OUTRO' } }
    ]
  },
  {
    slug: 'origem_demanda',
    nome: 'Origens de demanda',
    descricao: 'Fontes internas ou externas das demandas.',
    items: [
      { slug: 'cliente', label: 'Cliente', metadata: { legacyValue: 'CLIENTE' } },
      { slug: 'suporte', label: 'Suporte', metadata: { legacyValue: 'SUPORTE' } },
      { slug: 'diretoria', label: 'Diretoria', metadata: { legacyValue: 'DIRETORIA' } },
      { slug: 'cs', label: 'Customer Success', metadata: { legacyValue: 'CS' } },
      { slug: 'vendas', label: 'Vendas', metadata: { legacyValue: 'VENDAS' } },
      { slug: 'interno', label: 'Interno', metadata: { legacyValue: 'INTERNO' } }
    ]
  },
  {
    slug: 'prioridade_nivel',
    nome: 'Prioridade',
    descricao: 'Níveis padrão de prioridade.',
    items: [
      { slug: 'baixa', label: 'Baixa', metadata: { legacyValue: 'BAIXA' } },
      { slug: 'media', label: 'Média', metadata: { legacyValue: 'MEDIA' } },
      { slug: 'alta', label: 'Alta', metadata: { legacyValue: 'ALTA' } },
      { slug: 'critica', label: 'Crítica', metadata: { legacyValue: 'CRITICA' } }
    ]
  },
  {
    slug: 'status_demanda',
    nome: 'Status da demanda',
    descricao: 'Ciclo de vida da demanda.',
    items: [
      { slug: 'novo', label: 'Novo', metadata: { legacyValue: 'NOVO', allowedTransitions: ['rascunho', 'triagem', 'arquivado'], isEditable: true } },
      { slug: 'rascunho', label: 'Rascunho', metadata: { legacyValue: 'RASCUNHO', allowedTransitions: ['novo', 'triagem', 'arquivado'], isEditable: true } },
      { slug: 'triagem', label: 'Triagem', metadata: { legacyValue: 'TRIAGEM', allowedTransitions: ['arquivado'], isEditable: false } },
      { slug: 'arquivado', label: 'Arquivado', metadata: { legacyValue: 'ARQUIVADO', allowedTransitions: [], isEditable: false, isTerminal: true } }
    ]
  },
  {
    slug: 'tipo_usuario',
    nome: 'Tipos de usuário',
    descricao: 'Classificação dos perfis cadastrados no tenant.',
    items: [
      { slug: 'interno', label: 'Interno', metadata: { legacyValue: 'INTERNO' } },
      { slug: 'externo', label: 'Externo', metadata: { legacyValue: 'EXTERNO' } },
      { slug: 'cliente', label: 'Cliente', metadata: { legacyValue: 'CLIENTE' } }
    ]
  },
  {
    slug: 'cargo_usuario',
    nome: 'Cargos / funções',
    descricao: 'Funções comuns dos stakeholders.',
    items: [
      { slug: 'cpo', label: 'CPO' },
      { slug: 'pm', label: 'Product Manager' },
      { slug: 'stakeholder', label: 'Stakeholder' },
      { slug: 'executivo', label: 'Executivo' }
    ]
  },
  {
    slug: 'segmento_cliente',
    nome: 'Segmentos de cliente',
    descricao: 'Segmentação utilizada em relatórios e priorização.',
    items: [
      { slug: 'enterprise', label: 'Enterprise' },
      { slug: 'mid_market', label: 'Mid-market' },
      { slug: 'smb', label: 'SMB' },
      { slug: 'freemium', label: 'Freemium' }
    ]
  },
  {
    slug: 'tipo_anexo',
    nome: 'Tipos de anexo',
    descricao: 'Categorias para uploads vinculados a demandas e discovery.',
    items: [
      { slug: 'documento', label: 'Documento', metadata: { mimeGroup: 'application' } },
      { slug: 'imagem', label: 'Imagem', metadata: { mimeGroup: 'image' } },
      { slug: 'video', label: 'Vídeo', metadata: { mimeGroup: 'video' } },
      { slug: 'audio', label: 'Áudio', metadata: { mimeGroup: 'audio' } }
    ]
  },
  {
    slug: 'status_triagem',
    nome: 'Status da triagem',
    descricao: 'Fluxo operacional da triagem.',
    items: [
      { slug: 'pendente_triagem', label: 'Pendente de triagem', metadata: { legacyValue: 'PENDENTE_TRIAGEM', allowedTransitions: ['aguardando_info', 'pronto_discovery', 'evoluiu_epico', 'arquivado_triagem', 'duplicado'] } },
      { slug: 'aguardando_info', label: 'Aguardando informações', metadata: { legacyValue: 'AGUARDANDO_INFO', allowedTransitions: ['retomado_triagem', 'arquivado_triagem'] } },
      { slug: 'retomado_triagem', label: 'Retomado triagem', metadata: { legacyValue: 'RETOMADO_TRIAGEM', allowedTransitions: ['aguardando_info', 'pronto_discovery', 'evoluiu_epico', 'arquivado_triagem', 'duplicado'] } },
      { slug: 'pronto_discovery', label: 'Pronto para discovery', metadata: { legacyValue: 'PRONTO_DISCOVERY', allowedTransitions: [], isTerminal: true } },
      { slug: 'evoluiu_epico', label: 'Evoluiu para épico', metadata: { legacyValue: 'EVOLUIU_EPICO', allowedTransitions: [], isTerminal: true } },
      { slug: 'arquivado_triagem', label: 'Arquivado na triagem', metadata: { legacyValue: 'ARQUIVADO_TRIAGEM', allowedTransitions: [], isTerminal: true } },
      { slug: 'duplicado', label: 'Marcado como duplicado', metadata: { legacyValue: 'DUPLICADO', allowedTransitions: [], isTerminal: true } }
    ]
  },
  {
    slug: 'motivo_arquivamento',
    nome: 'Motivos de arquivamento',
    descricao: 'Motivos padrão ao arquivar uma demanda na triagem.',
    items: [
      { slug: 'sem_contexto', label: 'Sem contexto suficiente' },
      { slug: 'fora_escopo', label: 'Fora do escopo do produto' },
      { slug: 'duplicada', label: 'Demanda duplicada' }
    ]
  },
  {
    slug: 'tipo_solicitacao_info',
    nome: 'Tipos de solicitação de informação',
    descricao: 'Classificação dos pedidos de esclarecimento enviados ao solicitante.',
    items: [
      { slug: 'detalhamento', label: 'Detalhamento do problema' },
      { slug: 'evidencias', label: 'Envio de evidências' },
      { slug: 'impacto', label: 'Informar impacto / volume' }
    ]
  },
  {
    slug: 'impacto_nivel',
    nome: 'Impacto',
    descricao: 'Escala de impacto percebido.',
    items: [
      { slug: 'baixo', label: 'Baixo', metadata: { legacyValue: 'BAIXO' } },
      { slug: 'medio', label: 'Médio', metadata: { legacyValue: 'MEDIO' } },
      { slug: 'alto', label: 'Alto', metadata: { legacyValue: 'ALTO' } },
      { slug: 'critico', label: 'Crítico', metadata: { legacyValue: 'CRITICO' } }
    ]
  },
  {
    slug: 'urgencia_nivel',
    nome: 'Urgência',
    descricao: 'Escala de urgência.',
    items: [
      { slug: 'baixa', label: 'Baixa', metadata: { legacyValue: 'BAIXA' } },
      { slug: 'media', label: 'Média', metadata: { legacyValue: 'MEDIA' } },
      { slug: 'alta', label: 'Alta', metadata: { legacyValue: 'ALTA' } }
    ]
  },
  {
    slug: 'complexidade_nivel',
    nome: 'Complexidade',
    descricao: 'Escala de complexidade estimada.',
    items: [
      { slug: 'baixa', label: 'Baixa', metadata: { legacyValue: 'BAIXA' } },
      { slug: 'media', label: 'Média', metadata: { legacyValue: 'MEDIA' } },
      { slug: 'alta', label: 'Alta', metadata: { legacyValue: 'ALTA' } }
    ]
  },
  {
    slug: 'status_discovery',
    nome: 'Status do discovery',
    descricao: 'Estado atual do discovery.',
    items: [
      { slug: 'em_pesquisa', label: 'Em pesquisa', metadata: { legacyValue: 'EM_PESQUISA' } },
      { slug: 'validando', label: 'Validando', metadata: { legacyValue: 'VALIDANDO' } },
      { slug: 'fechado', label: 'Fechado', metadata: { legacyValue: 'FECHADO' } },
      { slug: 'cancelado', label: 'Cancelado', metadata: { legacyValue: 'CANCELADO' } }
    ]
  },
  {
    slug: 'severidade_problema',
    nome: 'Severidade do problema',
    descricao: 'Classificação da gravidade percebida no discovery.',
    items: [
      { slug: 'baixa', label: 'Baixa' },
      { slug: 'media', label: 'Média' },
      { slug: 'alta', label: 'Alta' },
      { slug: 'critica', label: 'Crítica' }
    ]
  },
  {
    slug: 'status_hipotese',
    nome: 'Status da hipótese',
    descricao: 'Estados da hipótese.',
    items: [
      { slug: 'pendente', label: 'Pendente', metadata: { legacyValue: 'PENDENTE' } },
      { slug: 'em_teste', label: 'Em teste', metadata: { legacyValue: 'EM_TESTE' } },
      { slug: 'validada', label: 'Validada', metadata: { legacyValue: 'VALIDADA' } },
      { slug: 'refutada', label: 'Refutada', metadata: { legacyValue: 'REFUTADA' } },
      { slug: 'arquivada', label: 'Arquivada', metadata: { legacyValue: 'ARQUIVADA' } }
    ]
  },
  {
    slug: 'impacto_hipotese',
    nome: 'Impacto esperado da hipótese',
    descricao: 'Escala de impacto utilizada na priorização de hipóteses.',
    items: [
      { slug: 'baixo', label: 'Baixo' },
      { slug: 'medio', label: 'Médio' },
      { slug: 'alto', label: 'Alto' },
      { slug: 'estrategico', label: 'Estratégico' }
    ]
  },
  {
    slug: 'prioridade_hipotese',
    nome: 'Prioridade da hipótese',
    descricao: 'Nível de prioridade calculado para hipóteses.',
    items: [
      { slug: 'baixa', label: 'Baixa' },
      { slug: 'media', label: 'Média' },
      { slug: 'alta', label: 'Alta' },
      { slug: 'critica', label: 'Crítica' }
    ]
  },
  {
    slug: 'metodo_pesquisa',
    nome: 'Métodos de pesquisa',
    descricao: 'Abordagens de pesquisa.',
    items: [
      { slug: 'entrevista_guiada', label: 'Entrevista guiada', metadata: { legacyValue: 'ENTREVISTA_GUIADA' } },
      { slug: 'entrevista_livre', label: 'Entrevista livre', metadata: { legacyValue: 'ENTREVISTA_LIVRE' } },
      { slug: 'survey', label: 'Survey', metadata: { legacyValue: 'SURVEY' } },
      { slug: 'focus_group', label: 'Focus group', metadata: { legacyValue: 'FOCUS_GROUP' } },
      { slug: 'observacao', label: 'Observação', metadata: { legacyValue: 'OBSERVACAO' } },
      { slug: 'teste_usabilidade', label: 'Teste de usabilidade', metadata: { legacyValue: 'TESTE_USABILIDADE' } },
      { slug: 'card_sorting', label: 'Card sorting', metadata: { legacyValue: 'CARD_SORTING' } },
      { slug: 'diario_uso', label: 'Diário de uso', metadata: { legacyValue: 'DIARIO_USO' } }
    ]
  },
  {
    slug: 'status_pesquisa',
    nome: 'Status da pesquisa',
    descricao: 'Etapas da pesquisa.',
    items: [
      { slug: 'planejada', label: 'Planejada', metadata: { legacyValue: 'PLANEJADA' } },
      { slug: 'em_andamento', label: 'Em andamento', metadata: { legacyValue: 'EM_ANDAMENTO' } },
      { slug: 'concluida', label: 'Concluída', metadata: { legacyValue: 'CONCLUIDA' } },
      { slug: 'cancelada', label: 'Cancelada', metadata: { legacyValue: 'CANCELADA' } }
    ]
  },
  {
    slug: 'tipo_evidencia',
    nome: 'Tipos de evidência',
    descricao: 'Classificação de evidências.',
    items: [
      { slug: 'dados_analytics', label: 'Dados (analytics)', metadata: { legacyValue: 'DADOS_ANALYTICS' } },
      { slug: 'print', label: 'Print', metadata: { legacyValue: 'PRINT' } },
      { slug: 'video', label: 'Vídeo', metadata: { legacyValue: 'VIDEO' } },
      { slug: 'audio', label: 'Áudio', metadata: { legacyValue: 'AUDIO' } },
      { slug: 'feedback_usuario', label: 'Feedback de usuário', metadata: { legacyValue: 'FEEDBACK_USUARIO' } },
      { slug: 'log_sistema', label: 'Log de sistema', metadata: { legacyValue: 'LOG_SISTEMA' } },
      { slug: 'transcricao', label: 'Transcrição', metadata: { legacyValue: 'TRANSCRICAO' } },
      { slug: 'resultado_teste', label: 'Resultado de teste', metadata: { legacyValue: 'RESULTADO_TESTE' } },
      { slug: 'benchmark', label: 'Benchmark', metadata: { legacyValue: 'BENCHMARK' } },
      { slug: 'documento', label: 'Documento', metadata: { legacyValue: 'DOCUMENTO' } }
    ]
  },
  {
    slug: 'status_insight',
    nome: 'Status do insight',
    descricao: 'Maturidade do insight.',
    items: [
      { slug: 'rascunho', label: 'Rascunho', metadata: { legacyValue: 'RASCUNHO' } },
      { slug: 'validado', label: 'Validado', metadata: { legacyValue: 'VALIDADO' } },
      { slug: 'refutado', label: 'Refutado', metadata: { legacyValue: 'REFUTADO' } },
      { slug: 'em_analise', label: 'Em análise', metadata: { legacyValue: 'EM_ANALISE' } }
    ]
  },
  {
    slug: 'confianca_nivel',
    nome: 'Nível de confiança',
    descricao: 'Confiança atribuída aos insights.',
    items: [
      { slug: 'baixa', label: 'Baixa', metadata: { legacyValue: 'BAIXA' } },
      { slug: 'media', label: 'Média', metadata: { legacyValue: 'MEDIA' } },
      { slug: 'alta', label: 'Alta', metadata: { legacyValue: 'ALTA' } },
      { slug: 'muito_alta', label: 'Muito alta', metadata: { legacyValue: 'MUITO_ALTA' } }
    ]
  },
  {
    slug: 'tipo_experimento',
    nome: 'Tipos de experimento',
    descricao: 'Formatos de experimentos.',
    items: [
      { slug: 'mvp', label: 'MVP', metadata: { legacyValue: 'MVP' } },
      { slug: 'teste_ab', label: 'Teste A/B', metadata: { legacyValue: 'TESTE_A_B' } },
      { slug: 'fake_door', label: 'Fake door', metadata: { legacyValue: 'FAKE_DOOR' } },
      { slug: 'prototipo', label: 'Protótipo', metadata: { legacyValue: 'PROTOTIPO' } },
      { slug: 'feature_toggle', label: 'Feature toggle', metadata: { legacyValue: 'FEATURE_TOGGLE' } }
    ]
  },
  {
    slug: 'status_experimento',
    nome: 'Status do experimento',
    descricao: 'Progresso do experimento.',
    items: [
      { slug: 'planejado', label: 'Planejado', metadata: { legacyValue: 'PLANEJADO' } },
      { slug: 'em_execucao', label: 'Em execução', metadata: { legacyValue: 'EM_EXECUCAO' } },
      { slug: 'concluido', label: 'Concluído', metadata: { legacyValue: 'CONCLUIDO' } },
      { slug: 'cancelado', label: 'Cancelado', metadata: { legacyValue: 'CANCELADO' } }
    ]
  },
  {
    slug: 'decisao_final_discovery',
    nome: 'Decisão final',
    descricao: 'Resultados possíveis após concluir o discovery.',
    items: [
      { slug: 'aprovado', label: 'Aprovado', metadata: { legacyValue: 'APROVADO' } },
      { slug: 'rejeitado', label: 'Rejeitado', metadata: { legacyValue: 'REJEITADO' } },
      { slug: 'retomar_depois', label: 'Retomar depois', metadata: { legacyValue: 'RETOMAR_DEPOIS' } },
      { slug: 'criar_epico', label: 'Criar épico', metadata: { legacyValue: 'CRIAR_EPICO' } }
    ]
  },
  {
    slug: 'decisao_discovery',
    nome: 'Decisão parcial',
    descricao: 'Situações intermediárias registradas durante o discovery.',
    items: [
      { slug: 'aguardando_validacoes', label: 'Aguardando validações complementares' },
      { slug: 'necessita_recursos', label: 'Necessita recursos adicionais' },
      { slug: 'pausado', label: 'Pausado temporariamente' }
    ]
  },
  {
    slug: 'identificacao_origem',
    nome: 'Como identificado',
    descricao: 'Origem da identificação do problema.',
    items: [
      { slug: 'analytics', label: 'Analytics' },
      { slug: 'entrevistas', label: 'Entrevistas' },
      { slug: 'suporte', label: 'Suporte' },
      { slug: 'pesquisa_quantitativa', label: 'Pesquisa quantitativa' },
      { slug: 'pesquisa_qualitativa', label: 'Pesquisa qualitativa' }
    ]
  },
  {
    slug: 'publico_alvo',
    nome: 'Público afetado',
    descricao: 'Segmentos ou personas impactadas.',
    items: [
      { slug: 'novos_clientes', label: 'Novos clientes' },
      { slug: 'clientes_medios', label: 'Clientes médios' },
      { slug: 'persona_carlos', label: 'Persona Carlos' },
      { slug: 'usuarios_internos', label: 'Usuários internos' }
    ]
  },
  {
    slug: 'metrica_sucesso_discovery',
    nome: 'Métricas de sucesso',
    descricao: 'Indicadores monitorados para validar experimentos.',
    items: [
      { slug: 'taxa_adocao', label: 'Taxa de adoção' },
      { slug: 'retencao', label: 'Retenção' },
      { slug: 'nps', label: 'NPS' },
      { slug: 'ticket_medio', label: 'Ticket médio' }
    ]
  },
  {
    slug: 'persona_participante',
    nome: 'Personas de participantes',
    descricao: 'Personas usadas para entrevistas e pesquisas.',
    items: [
      { slug: 'persona_carlos', label: 'Carlos - CFO' },
      { slug: 'persona_larissa', label: 'Larissa - PM' },
      { slug: 'persona_joao', label: 'João - Analista CS' }
    ]
  },
  {
    slug: 'frameworks_priorizacao',
    nome: 'Frameworks de priorização',
    descricao: 'Modelos de cálculo utilizados para priorizar hipóteses e demandas.',
    items: [
      { slug: 'ice', label: 'ICE', metadata: { fields: ['impacto', 'confianca', 'esforco'] } },
      { slug: 'rice', label: 'RICE', metadata: { fields: ['alcance', 'impacto', 'confianca', 'esforco'] } },
      { slug: 'wsjf', label: 'WSJF', metadata: { fields: ['custo_atraso', 'duration'] } }
    ]
  },
  {
    slug: 'templates_notificacao',
    nome: 'Templates de notificação',
    descricao: 'Modelos padrão para mensagens enviadas aos stakeholders.',
    items: [
      { slug: 'triagem_pendente', label: 'Triagem pendente', metadata: { channel: 'email', subject: 'Nova demanda aguardando triagem' } },
      { slug: 'discovery_handoff', label: 'Discovery pronto', metadata: { channel: 'email', subject: 'Discovery pronto para planejamento' } }
    ]
  },
  {
    slug: 'tipos_workflow',
    nome: 'Tipos de workflow',
    descricao: 'Configurações adicionais de pipelines e boards.',
    items: [
      { slug: 'padrao', label: 'Padrão' },
      { slug: 'experimentacao', label: 'Experimentação contínua' },
      { slug: 'fast_track', label: 'Fast track executivo' }
    ]
  },
  {
    slug: 'campos_customizados',
    nome: 'Campos customizados',
    descricao: 'Campos adicionais configuráveis por tenant.',
    items: [
      { slug: 'okr_relacionado', label: 'OKR relacionado', metadata: { entity: 'demanda', type: 'select' } },
      { slug: 'canal_aquisicao', label: 'Canal de aquisição', metadata: { entity: 'discovery', type: 'multiselect' } }
    ]
  },
  {
    slug: 'integracoes_externas',
    nome: 'Integrações externas',
    descricao: 'Conectores de ingestão integrados.',
    items: [
      { slug: 'zendesk', label: 'Zendesk' },
      { slug: 'jira', label: 'Jira' },
      { slug: 'slack', label: 'Slack' },
      { slug: 'teams', label: 'Microsoft Teams' }
    ]
  },
  {
    slug: 'planejamento_squad_status',
    nome: 'Status de squad (Planejamento)',
    descricao: 'Estados possíveis para squads utilizados no módulo de planejamento.',
    items: [
      {
        slug: 'ativo',
        label: 'Ativo',
        metadata: { legacyValue: 'ACTIVE', badgeVariant: 'success', order: 1 }
      },
      {
        slug: 'inativo',
        label: 'Inativo',
        metadata: { legacyValue: 'INACTIVE', badgeVariant: 'secondary', order: 2 }
      }
    ]
  },
  {
    slug: 'planejamento_cenario_status',
    nome: 'Status de cenário (Planejamento)',
    descricao: 'Estados utilizados para simulações de cenários no planejamento.',
    items: [
      {
        slug: 'draft',
        label: 'Rascunho',
        metadata: {
          legacyValue: 'DRAFT',
          badgeVariant: 'outline',
          allowedTransitions: ['published', 'archived'],
        }
      },
      {
        slug: 'published',
        label: 'Publicado',
        metadata: {
          legacyValue: 'PUBLISHED',
          badgeVariant: 'default',
          allowedTransitions: ['archived'],
        }
      },
      {
        slug: 'archived',
        label: 'Arquivado',
        metadata: {
          legacyValue: 'ARCHIVED',
          badgeVariant: 'secondary',
          isTerminal: true,
        }
      }
    ]
  },
  {
    slug: 'planning_cycle_status',
    nome: 'Status de planning cycle',
    descricao: 'Etapas macro do ciclo de planejamento.',
    items: [
      {
        slug: 'not_started',
        label: 'Não iniciado',
        metadata: { legacyValue: 'NOT_STARTED', badgeVariant: 'outline', order: 1 }
      },
      {
        slug: 'preparation',
        label: 'Preparação',
        metadata: { legacyValue: 'PREPARATION', badgeVariant: 'info', order: 2 }
      },
      {
        slug: 'alignment',
        label: 'Alinhamento',
        metadata: { legacyValue: 'ALIGNMENT', badgeVariant: 'secondary', order: 3 }
      },
      {
        slug: 'commitment',
        label: 'Commitment',
        metadata: { legacyValue: 'COMMITMENT', badgeVariant: 'warning', order: 4 }
      },
      {
        slug: 'closed',
        label: 'Encerrado',
        metadata: { legacyValue: 'CLOSED', badgeVariant: 'success', order: 5, isTerminal: true }
      }
    ]
  },
  {
    slug: 'planejamento_commitment_tier',
    nome: 'Tiers de commitment',
    descricao: 'Níveis de compromisso utilizados na consolidação do planejamento.',
    items: [
      {
        slug: 'committed',
        label: 'Committed',
        metadata: { legacyValue: 'COMMITTED', order: 1 }
      },
      {
        slug: 'targeted',
        label: 'Targeted',
        metadata: { legacyValue: 'TARGETED', order: 2 }
      },
      {
        slug: 'aspirational',
        label: 'Aspirational',
        metadata: { legacyValue: 'ASPIRATIONAL', order: 3 }
      }
    ]
  },
  {
    slug: 'automacao_campos',
    nome: 'Campos disponíveis para automação',
    descricao: 'Campos do contexto de demanda/triagem utilizados em condições e ações automáticas.',
    items: [
      {
        slug: 'titulo',
        label: 'Título da demanda',
        metadata: { legacyValue: 'titulo', path: 'demanda.titulo', valueType: 'string', inputType: 'text', order: 1 }
      },
      {
        slug: 'descricao',
        label: 'Descrição da demanda',
        metadata: { legacyValue: 'descricao', path: 'demanda.descricao', valueType: 'string', inputType: 'textarea', order: 2 }
      },
      {
        slug: 'tipo',
        label: 'Tipo da demanda',
        metadata: {
          legacyValue: 'tipo',
          path: 'demanda.tipo',
          valueType: 'string',
          inputType: 'select',
          optionsCategory: 'tipo_demanda',
          order: 3
        }
      },
      {
        slug: 'origem',
        label: 'Origem da demanda',
        metadata: {
          legacyValue: 'origem',
          path: 'demanda.origem',
          valueType: 'string',
          inputType: 'select',
          optionsCategory: 'origem_demanda',
          order: 4
        }
      },
      {
        slug: 'status',
        label: 'Status da demanda',
        metadata: {
          legacyValue: 'status',
          path: 'demanda.status',
          valueType: 'string',
          inputType: 'select',
          optionsCategory: 'status_demanda',
          order: 5
        }
      },
      {
        slug: 'prioridade',
        label: 'Prioridade',
        metadata: {
          legacyValue: 'prioridade',
          path: 'demanda.prioridade',
          valueType: 'string',
          inputType: 'select',
          optionsCategory: 'prioridade_nivel',
          order: 6
        }
      },
      {
        slug: 'impacto',
        label: 'Impacto (Triagem)',
        metadata: {
          legacyValue: 'impacto',
          path: 'demanda.triagem.impacto',
          valueType: 'string',
          inputType: 'select',
          optionsCategory: 'impacto_nivel',
          order: 7
        }
      },
      {
        slug: 'urgencia',
        label: 'Urgência (Triagem)',
        metadata: {
          legacyValue: 'urgencia',
          path: 'demanda.triagem.urgencia',
          valueType: 'string',
          inputType: 'select',
          optionsCategory: 'urgencia_nivel',
          order: 8
        }
      },
      {
        slug: 'complexidade',
        label: 'Complexidade (Triagem)',
        metadata: {
          legacyValue: 'complexidade',
          path: 'demanda.triagem.complexidade',
          valueType: 'string',
          inputType: 'select',
          optionsCategory: 'complexidade_nivel',
          order: 9
        }
      },
      {
        slug: 'produto_id',
        label: 'Produto - ID',
        metadata: {
          legacyValue: 'produto.id',
          path: 'demanda.produtoId',
          valueType: 'string',
          inputType: 'text',
          order: 10
        }
      },
      {
        slug: 'produto_nome',
        label: 'Produto - Nome',
        metadata: {
          legacyValue: 'produto.nome',
          path: 'demanda.produto.nome',
          valueType: 'string',
          inputType: 'text',
          order: 11
        }
      },
      {
        slug: 'tags',
        label: 'Tags da demanda',
        metadata: {
          legacyValue: 'tags',
          path: 'demanda.tags',
          valueType: 'array',
          inputType: 'multiselect',
          order: 12
        }
      }
    ]
  },
  {
    slug: 'automacao_operadores',
    nome: 'Operadores de condição (Automação)',
    descricao: 'Operadores suportados na avaliação de condições de automação.',
    items: [
      {
        slug: 'igual',
        label: 'É igual a',
        metadata: { legacyValue: 'IGUAL', requiresValue: true, supportedTypes: ['string', 'number', 'boolean'], order: 1 }
      },
      {
        slug: 'diferente',
        label: 'É diferente de',
        metadata: { legacyValue: 'DIFERENTE', requiresValue: true, supportedTypes: ['string', 'number', 'boolean'], order: 2 }
      },
      {
        slug: 'contem',
        label: 'Contém',
        metadata: { legacyValue: 'CONTEM', requiresValue: true, supportedTypes: ['string'], order: 3 }
      },
      {
        slug: 'nao_contem',
        label: 'Não contém',
        metadata: { legacyValue: 'NAO_CONTEM', requiresValue: true, supportedTypes: ['string'], order: 4 }
      },
      {
        slug: 'maior_que',
        label: 'É maior que',
        metadata: { legacyValue: 'MAIOR_QUE', requiresValue: true, supportedTypes: ['number'], order: 5 }
      },
      {
        slug: 'menor_que',
        label: 'É menor que',
        metadata: { legacyValue: 'MENOR_QUE', requiresValue: true, supportedTypes: ['number'], order: 6 }
      },
      {
        slug: 'maior_igual',
        label: 'É maior ou igual a',
        metadata: { legacyValue: 'MAIOR_OU_IGUAL', requiresValue: true, supportedTypes: ['number'], order: 7 }
      },
      {
        slug: 'menor_igual',
        label: 'É menor ou igual a',
        metadata: { legacyValue: 'MENOR_OU_IGUAL', requiresValue: true, supportedTypes: ['number'], order: 8 }
      },
      {
        slug: 'em',
        label: 'Está em',
        metadata: { legacyValue: 'EM', requiresValue: true, valueMustBeArray: true, supportedTypes: ['string', 'number'], order: 9 }
      },
      {
        slug: 'nao_em',
        label: 'Não está em',
        metadata: { legacyValue: 'NAO_EM', requiresValue: true, valueMustBeArray: true, supportedTypes: ['string', 'number'], order: 10 }
      },
      {
        slug: 'vazio',
        label: 'Está vazio',
        metadata: { legacyValue: 'VAZIO', requiresValue: false, supportedTypes: ['string', 'array'], order: 11 }
      },
      {
        slug: 'nao_vazio',
        label: 'Não está vazio',
        metadata: { legacyValue: 'NAO_VAZIO', requiresValue: false, supportedTypes: ['string', 'array'], order: 12 }
      }
    ]
  },
  {
    slug: 'automacao_acoes',
    nome: 'Tipos de ação (Automação)',
    descricao: 'Ações executadas automaticamente quando as condições são atendidas.',
    items: [
      {
        slug: 'definir_campo',
        label: 'Definir campo',
        metadata: {
          legacyValue: 'DEFINIR_CAMPO',
          requiresField: true,
          requiresValue: true,
          requiresConfig: false,
          order: 1
        }
      },
      {
        slug: 'adicionar_tag',
        label: 'Adicionar tag',
        metadata: {
          legacyValue: 'ADICIONAR_TAG',
          requiresField: false,
          requiresValue: true,
          requiresConfig: false,
          order: 2
        }
      },
      {
        slug: 'remover_tag',
        label: 'Remover tag',
        metadata: {
          legacyValue: 'REMOVER_TAG',
          requiresField: false,
          requiresValue: true,
          requiresConfig: false,
          order: 3
        }
      },
      {
        slug: 'mudar_status',
        label: 'Mudar status',
        metadata: {
          legacyValue: 'MUDAR_STATUS',
          requiresField: false,
          requiresValue: true,
          requiresConfig: false,
          order: 4
        }
      },
      {
        slug: 'mudar_prioridade',
        label: 'Mudar prioridade',
        metadata: {
          legacyValue: 'MUDAR_PRIORIDADE',
          requiresField: false,
          requiresValue: true,
          requiresConfig: false,
          order: 5
        }
      },
      {
        slug: 'definir_impacto',
        label: 'Definir impacto',
        metadata: {
          legacyValue: 'DEFINIR_IMPACTO',
          requiresField: false,
          requiresValue: true,
          requiresConfig: false,
          order: 6
        }
      },
      {
        slug: 'definir_urgencia',
        label: 'Definir urgência',
        metadata: {
          legacyValue: 'DEFINIR_URGENCIA',
          requiresField: false,
          requiresValue: true,
          requiresConfig: false,
          order: 7
        }
      },
      {
        slug: 'definir_complexidade',
        label: 'Definir complexidade',
        metadata: {
          legacyValue: 'DEFINIR_COMPLEXIDADE',
          requiresField: false,
          requiresValue: true,
          requiresConfig: false,
          order: 8
        }
      },
      {
        slug: 'atribuir_pm',
        label: 'Atribuir PM',
        metadata: {
          legacyValue: 'ATRIBUIR_PM',
          requiresField: false,
          requiresValue: true,
          requiresConfig: false,
          order: 9
        }
      },
      {
        slug: 'atribuir_responsavel',
        label: 'Atribuir responsável',
        metadata: {
          legacyValue: 'ATRIBUIR_RESPONSAVEL',
          requiresField: false,
          requiresValue: true,
          requiresConfig: false,
          order: 10
        }
      },
      {
        slug: 'enviar_email',
        label: 'Enviar e-mail',
        metadata: {
          legacyValue: 'ENVIAR_EMAIL',
          requiresField: false,
          requiresValue: false,
          requiresConfig: true,
          configSchema: { destinatario: 'string', assunto: 'string', template: 'string' },
          order: 11
        }
      },
      {
        slug: 'enviar_notificacao',
        label: 'Enviar notificação',
        metadata: {
          legacyValue: 'ENVIAR_NOTIFICACAO',
          requiresField: false,
          requiresValue: false,
          requiresConfig: true,
          configSchema: { usuarioId: 'string', titulo: 'string', mensagem: 'string', tipo: 'string' },
          order: 12
        }
      },
      {
        slug: 'tornar_campo_obrigatorio',
        label: 'Tornar campo obrigatório',
        metadata: {
          legacyValue: 'TORNAR_CAMPO_OBRIGATORIO',
          requiresField: true,
          requiresValue: false,
          requiresConfig: false,
          order: 13
        }
      },
      {
        slug: 'validar_campo',
        label: 'Validar campo',
        metadata: {
          legacyValue: 'VALIDAR_CAMPO',
          requiresField: true,
          requiresValue: false,
          requiresConfig: true,
          configSchema: { tipo: 'string', parametros: 'object' },
          order: 14
        }
      },
      {
        slug: 'chamar_webhook',
        label: 'Chamar webhook',
        metadata: {
          legacyValue: 'CHAMAR_WEBHOOK',
          requiresField: false,
          requiresValue: false,
          requiresConfig: true,
          configSchema: { url: 'string', metodo: 'string', payload: 'object' },
          order: 15
        }
      },
      {
        slug: 'criar_tarefa',
        label: 'Criar tarefa',
        metadata: {
          legacyValue: 'CRIAR_TAREFA',
          requiresField: false,
          requiresValue: false,
          requiresConfig: true,
          configSchema: { titulo: 'string', descricao: 'string', responsavelId: 'string', prazo: 'string' },
          order: 16
        }
      }
    ]
  },
];

async function seedCatalogsForTenant(tenantId: bigint) {
  for (const catalog of CATALOG_DEFINITIONS) {
    const category = await prisma.catalogCategory.upsert({
      where: {
        tenant_id_slug: {
          tenant_id: tenantId,
          slug: catalog.slug
        }
      },
      update: {
        nome: catalog.nome,
        descricao: catalog.descricao ?? null,
        escopo_produto: false
      },
      create: {
        tenant_id: tenantId,
        slug: catalog.slug,
        nome: catalog.nome,
        descricao: catalog.descricao ?? null,
        escopo_produto: false
      }
    });

    for (const [index, item] of catalog.items.entries()) {
      const metadata: Prisma.JsonObject = item.metadata ? (item.metadata as Prisma.JsonObject) : {};

      await prisma.catalogItem.upsert({
        where: {
          tenant_id_category_id_slug: {
            tenant_id: tenantId,
            category_id: category.id,
            slug: item.slug
          }
        },
        update: {
          label: item.label,
          descricao: item.descricao ?? null,
          ordem: item.ordem ?? index,
          ativo: item.ativo ?? true,
          metadados: metadata
        },
        create: {
          tenant_id: tenantId,
          category_id: category.id,
          slug: item.slug,
          label: item.label,
          descricao: item.descricao ?? null,
          ordem: item.ordem ?? index,
          ativo: item.ativo ?? true,
          metadados: metadata
        }
      });
    }
  }
}

async function main() {
  const tenantName = process.env.SEED_TENANT_NAME ?? 'Tenant Demo';

  let tenant = await prisma.tenant.findFirst({
    where: { nome: tenantName }
  });

  if (!tenant) {
    tenant = await prisma.tenant.create({
      data: {
        nome: tenantName
      }
    });
  }

  const adminEmail = process.env.SEED_ADMIN_EMAIL ?? 'admin@cpopm.local';
  const adminPassword = process.env.SEED_ADMIN_PASSWORD ?? 'Admin@123';
  const adminName = process.env.SEED_ADMIN_NAME ?? 'Administrador PM Hub';

  const passwordHash = await hash(adminPassword, 12);

  let adminUser = await prisma.user.findUnique({
    where: { email: adminEmail },
    include: {
      tenants: true
    }
  });

  if (!adminUser) {
    await prisma.user.create({
      data: {
        provider: AuthProvider.LOCAL,
        email: adminEmail,
        nome: adminName,
        password_hash: passwordHash,
        status: 'ACTIVE'
      }
    });
  } else if (!adminUser.password_hash) {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: {
        password_hash: passwordHash,
        nome: adminName,
        status: 'ACTIVE'
      }
    });
  }

  adminUser = await prisma.user.findUniqueOrThrow({
    where: { email: adminEmail },
    include: {
      tenants: true
    }
  });

  const userTenant = await prisma.userTenant.findUnique({
    where: {
      user_id_tenant_id: {
        user_id: adminUser.id,
        tenant_id: tenant.id
      }
    }
  });

  if (!userTenant) {
    await prisma.userTenant.create({
      data: {
        user_id: adminUser.id,
        tenant_id: tenant.id,
        role: TenantRole.CPO
      }
    });
  } else if (userTenant.role !== TenantRole.CPO) {
    await prisma.userTenant.update({
      where: { id: userTenant.id },
      data: { role: TenantRole.CPO }
    });
  }

  await seedCatalogsForTenant(tenant.id);

  console.info('Seed concluído com tenant demo e usuário admin local.');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

