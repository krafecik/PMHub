export const buildDocumentacaoPrdPrompt = (payload: {
  titulo: string;
  resumoExecutivo: string;
  contexto: string;
  objetivos: string[];
  requisitosFuncionais: string[];
  requisitosNaoFuncionais: string[];
  riscos?: string[];
}) => `Você é um Product Manager escrevendo o primeiro rascunho de um PRD.

Título: ${payload.titulo}
Resumo executivo: ${payload.resumoExecutivo}

Contexto:
${payload.contexto}

Objetivos:
${payload.objetivos.map((objetivo) => `- ${objetivo}`).join('\n')}

Requisitos funcionais conhecidos:
${payload.requisitosFuncionais.map((item) => `- ${item}`).join('\n')}

Requisitos não funcionais:
${payload.requisitosNaoFuncionais.map((item) => `- ${item}`).join('\n')}

Riscos identificados:
${payload.riscos?.map((item) => `- ${item}`).join('\n') || '- Nenhum risco registrado'}

Retorne um JSON com seções:
- "objetivo"
- "contexto"
- "escopoFuncional" (lista)
- "requisitosNaoFuncionais" (lista)
- "regrasNegocio" (lista)
- "fluxos" (lista com descrições textuais)
- "criteriosAceite" (lista)
- "riscos" (lista)
`;

export const buildDocumentacaoRegrasNegocioPrompt = (payload: {
  descricaoDocumento: string;
  eventosChave: string[];
}) => `Você é um analista de negócio.
Gere regras de negócio claras e numeradas a partir do documento abaixo.

Descrição:
${payload.descricaoDocumento}

Eventos chave:
${payload.eventosChave.map((evento) => `- ${evento}`).join('\n')}

Retorne um JSON com "regras", lista de objetos com "codigo" (ex: RN001), "descricao" e "tipo".
`;

export const buildDocumentacaoConsistenciaPrompt = (payload: {
  prd: string;
  rfc?: string;
  specs?: string;
}) => `Você é um auditor de documentação.
Verifique inconsistências entre os materiais fornecidos.

PRD:
${payload.prd}

RFC:
${payload.rfc ?? 'Não há RFC disponível'}

Specs:
${payload.specs ?? 'Não há specs disponíveis'}

Retorne um JSON com "inconsistencias": lista contendo "descricao", "severidade" (ALTA, MEDIA, BAIXA) e "impacto".
`;

export const buildDocumentacaoCenariosPrompt = (payload: {
  objetivo: string;
  personas: string[];
  fluxosPrincipais: string[];
}) => `Você é um UX Writer.
Gere cenários de uso a partir das informações fornecidas.

Objetivo:
${payload.objetivo}

Personas:
${payload.personas.map((persona) => `- ${persona}`).join('\n')}

Fluxos principais:
${payload.fluxosPrincipais.map((fluxo) => `- ${fluxo}`).join('\n')}

Retorne um JSON com "cenarios", cada item contendo "titulo", "persona" e "narrativa".
`;

export const buildDocumentacaoGherkinPrompt = (payload: {
  feature: string;
  criteriosAceite: string[];
}) => `Você é um QA engineer.
Transforme os critérios de aceite em cenários Gherkin.

Feature: ${payload.feature}

Critérios de aceite:
${payload.criteriosAceite.map((criterio) => `- ${criterio}`).join('\n')}

Retorne um JSON com "cenarios", cada item contendo "titulo" e "steps" (array de strings, já formatado como Given/When/Then).
`;

export const buildDocumentacaoReleaseNotesPrompt = (payload: {
  releaseNome: string;
  entregas: string[];
  notasTecnicas?: string[];
}) => `Você é responsável por gerar release notes claras.

Release: ${payload.releaseNome}

Entregas:
${payload.entregas.map((item) => `- ${item}`).join('\n')}

Notas técnicas:
${payload.notasTecnicas?.map((item) => `- ${item}`).join('\n') || '- Nenhuma'}

Produza um texto com seções "Novidades", "Melhorias" e "Notas Técnicas".
`;
