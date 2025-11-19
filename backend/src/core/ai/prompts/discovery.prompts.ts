export const buildDiscoveryHipotesesPrompt = (payload: {
  problema: string;
  insights: Array<{ id: string; descricao: string; impacto?: string; confianca?: string }>;
}) => `Você é um especialista em Product Discovery.
Gere hipóteses claras e testáveis a partir do problema descrito e dos insights coletados.

Problema:
${payload.problema}

Insights:
${payload.insights
  .map(
    (insight, index) =>
      `${index + 1}. ${insight.descricao} (Impacto: ${insight.impacto ?? 'não informado'}, Confiança: ${
        insight.confianca ?? 'não informada'
      })`,
  )
  .join('\n')}

Retorne um JSON com a chave "hipoteses", contendo itens com "titulo", "descricao", "impactoEsperado", "comoValidar" e "prioridade".
`;

export const buildDiscoveryCorrelacaoPrompt = (payload: {
  insightPrincipal: string;
  outrosInsights: Array<{ id: string; descricao: string }>;
}) => `Você é um analista de produto.
Avalie como o insight principal abaixo pode se correlacionar com os demais insights.

Insight principal:
${payload.insightPrincipal}

Outros insights:
${payload.outrosInsights.map((item, index) => `${index + 1}. ${item.descricao}`).join('\n')}

Retorne um JSON com "correlacoes": lista de objetos com "id", "grauCorrelacao" (0-100) e "comentario".
`;

export const buildDiscoveryMvpPrompt = (payload: {
  problema: string;
  hipoteses: Array<{ titulo: string; status: string }>;
  restricoes?: string[];
}) => `Você é um consultor de experimentação.
Sugira três MVPs ou experimentos para validar as hipóteses deste discovery.

Problema: ${payload.problema}

Hipóteses:
${payload.hipoteses
  .map((hipotese, index) => `${index + 1}. ${hipotese.titulo} (Status: ${hipotese.status})`)
  .join('\n')}

Restrições conhecidas: ${(payload.restricoes ?? []).join(', ') || 'nenhuma'}

Retorne um JSON com "mvps": lista de objetos contendo "nome", "descricao", "hipotesesAlvo" (lista de IDs ou títulos) e "metricas".
`;

export const buildDiscoveryResumoExecutivoPrompt = (payload: {
  problema: string;
  principaisInsights: string[];
  hipotesesValidadas: string[];
  recomendacoes: string[];
}) => `Gere um resumo executivo de discovery.

Problema:
${payload.problema}

Insights relevantes:
${payload.principaisInsights.map((item) => `- ${item}`).join('\n')}

Hipóteses validadas:
${payload.hipotesesValidadas.map((item) => `- ${item}`).join('\n') || '- Nenhuma ainda'}

Recomendações:
${payload.recomendacoes.map((item) => `- ${item}`).join('\n')}

Retorne um texto de até 4 parágrafos, focado em fornecer contexto executivo.
`;
