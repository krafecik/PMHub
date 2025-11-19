export const buildTriagemDuplicacaoPrompt = (payload: {
  demandaTitulo: string;
  demandaDescricao: string;
  candidatos: Array<{ id: string; titulo: string; descricao: string }>;
}) => `Você é um assistente especializado em triagem de demandas de produto.
Avalie se a demanda "${payload.demandaTitulo}" com a descrição abaixo é duplicada das candidatas listadas.

Descrição da demanda principal:
${payload.demandaDescricao || 'Descrição não informada.'}

Candidatas:
${payload.candidatos
  .map(
    (candidato, index) =>
      `${index + 1}. ID ${candidato.id} - ${candidato.titulo}\n${candidato.descricao || 'Sem descrição.'}`,
  )
  .join('\n\n')}

Retorne um JSON com a chave "duplicatas", que é uma lista contendo objetos com "id", "similaridade" (0-100) e "justificativa".
`;

export const buildTriagemEncaminhamentoPrompt = (payload: {
  demandaTitulo: string;
  demandaDescricao: string;
  tipo?: string;
  origem?: string;
  impacto?: string;
  urgencia?: string;
}) => `Você é um Product Manager sênior em fase de triagem inicial.
Sua tarefa é analisar EXCLUSIVAMENTE o texto bruto da demanda que acabou de chegar (Título e Descrição) para sugerir o primeiro encaminhamento lógico.

CONTEXTO IMPORTANTE:
- Esta é apenas a entrada da demanda (Inbox).
- Não assuma que dados aprofundados (métricas, ROI, cronogramas) deveriam estar presentes agora.
- Teremos etapas futuras dedicadas para enriquecimento, Discovery e especificação técnica.

DADOS DA DEMANDA (INPUT):
Título: ${payload.demandaTitulo}
Descrição: ${payload.demandaDescricao || 'Sem descrição detalhada no momento.'}
Tipo Classificado: ${payload.tipo ?? 'Não classificado'}
Origem: ${payload.origem ?? 'Não informada'}
Impacto Preliminar: ${payload.impacto ?? 'Não estimado'}
Urgência Preliminar: ${payload.urgencia ?? 'Não estimada'}

DIRETRIZES DE ANÁLISE:
1. Se a descrição for vaga ou insuficiente para entender o problema -> Sugira "SOLICITAR_INFO".
2. Se o problema for claro e parecer um problema real de produto -> Sugira "ENVIAR_DISCOVERY".
3. Se for obviamente um bug, suporte ou algo operacional -> Sugira "ARQUIVAR" ou o fluxo pertinente.
4. Se for uma iniciativa estratégica enorme já evidente -> Sugira "VIRAR_EPICO".

Retorne APENAS um JSON válido com este formato exato:
{
  "acaoRecomendada": "ENVIAR_DISCOVERY" | "SOLICITAR_INFO" | "ARQUIVAR" | "VIRAR_EPICO" | "AGUARDAR",
  "justificativa": "Explicação concisa de 1 ou 2 frases focada na clareza do input atual.",
  "checklist": [
    "Item 1 para verificar nesta fase inicial",
    "Item 2 para verificar nesta fase inicial"
  ]
}
`;
