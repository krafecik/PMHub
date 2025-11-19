export const buildPlanejamentoPrioridadePrompt = (payload: {
  epico: {
    titulo: string;
    impacto?: string;
    effort?: number;
    status?: string;
    health?: string;
  };
  historico?: string[];
  contextoOrganizacional?: string;
}) => `Você é um CPO analisando um épico para priorização.

Épico: ${payload.epico.titulo}
Impacto estimado: ${payload.epico.impacto ?? 'não informado'}
Esforço (story points ou similar): ${payload.epico.effort ?? 'não informado'}
Status atual: ${payload.epico.status ?? 'não informado'}
Health: ${payload.epico.health ?? 'não informado'}

Histórico relevante:
${(payload.historico ?? []).map((item) => `- ${item}`).join('\n') || '- Nenhum histórico disponível'}

Contexto organizacional:
${payload.contextoOrganizacional ?? 'Não informado'}

Retorne um JSON com "prioridade" (ALTA, MEDIA, BAIXA), "justificativa" e "alertas" (lista de strings).
`;

export const buildPlanejamentoHealthScorePrompt = (payload: {
  epicoTitulo: string;
  indicadores: Record<string, string | number>;
  dependenciasCriticas: string[];
}) => `Você é um Product Operations que precisa atualizar o health score de um épico.

Épico: ${payload.epicoTitulo}

Indicadores internos:
${Object.entries(payload.indicadores)
  .map(([key, value]) => `- ${key}: ${value}`)
  .join('\n')}

Dependências críticas:
${payload.dependenciasCriticas.map((item) => `- ${item}`).join('\n') || '- Nenhuma dependência crítica'}

Retorne um JSON com "health" (GREEN, YELLOW, RED), "justificativa" e "proximosPassos".
`;

export const buildPlanejamentoDependenciasPrompt = (payload: {
  featureTitulo: string;
  descricao: string;
  featuresRelacionadas: Array<{ id: string; titulo: string; descricao: string }>;
}) => `Você é um Tech Lead analisando dependências entre features.

Feature principal: ${payload.featureTitulo}
Descrição: ${payload.descricao}

Features candidatas a dependências:
${payload.featuresRelacionadas
  .map(
    (feature, index) =>
      `${index + 1}. ${feature.titulo} - ${feature.descricao || 'Sem descrição adicional.'}`,
  )
  .join('\n')}

Retorne um JSON com "dependenciasSugeridas": lista de objetos contendo "idFeature", "tipo" (HARD, SOFT, RECURSO), "risco" (ALTO, MEDIO, BAIXO) e "justificativa".
`;

export const buildPlanejamentoRoadmapDraftPrompt = (payload: {
  quarter: string;
  epicos: Array<{ titulo: string; status: string; health: string }>;
  capacidade: Array<{ squad: string; capacidade: number; utilizada: number }>;
}) => `Você é um CPO elaborando uma visão inicial do roadmap.

Quarter alvo: ${payload.quarter}

Épicos disponíveis:
${payload.epicos
  .map(
    (epico, index) =>
      `${index + 1}. ${epico.titulo} (Status: ${epico.status}, Health: ${epico.health})`,
  )
  .join('\n')}

Capacidade das squads:
${payload.capacidade
  .map((entry) => `- ${entry.squad}: capacidade ${entry.capacidade}, utilizada ${entry.utilizada}`)
  .join('\n')}

Gere uma proposta de roadmap em JSON com as seguintes chaves:
- "committed": lista de títulos de épicos
- "targeted": lista de títulos
- "aspirational": lista de títulos
- "comentarios": texto resumindo trade-offs
`;
