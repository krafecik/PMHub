# Plano Funcional Detalhado – Módulo 4 Planejamento & Roadmap

## 1. Personas e User Stories Priorizadas

| Persona | User Story | Critérios de Aceite |
| --- | --- | --- |
| PM | Como PM, quero transformar uma hipótese validada em épico com features filhas para garantir rastreabilidade Discovery → Planejamento. | Campo `hipotese_relacionada` obrigatório, checklist pré-planejamento completo, critérios de aceite preenchidos. |
| PM | Como PM, quero estimar esforço das features e visualizar capacidade por squad para decidir o quarter viável. | Estimativa em pontos/hora, validação automática vs capacidade do squad, alertas acima de 110%. |
| PM | Como PM, quero simular cenários alterando capacidade e prioridade para negociar compromissos trimestrais. | Simulador com sliders, comparação entre cenários, registros no log de decisões. |
| CPO | Como CPO, quero visualizar um roadmap timeline drag-and-drop com cores de confiabilidade para comunicar prioridades. | Timeline com estados Committed/Targeted/Aspirational, modo apresentação, filtros por produto/squad. |
| Tech Lead | Como Tech Lead, quero registrar dependências e riscos técnicos para que bloqueios apareçam automaticamente no mapa. | Dependências com tipo/risco, notificações para itens críticos, integração com simulador. |
| Engineering Manager | Como EM, quero revisar e aprovar capacidade trimestral por squad garantindo buffers configuráveis. | Tela de capacidade com histórico, campos de buffer e validação de carga ≤110%. |
| Stakeholder (Viewer) | Como Stakeholder, quero acessar visão de alto nível dos épicos, health e datas para acompanhar compromissos. | Dashboard só leitura com filtros, modal de ajuda explicando métricas e legendas. |

## 2. Métricas de Sucesso e KPIs do Módulo

- Capacidade alocada ≤ 110% em 100% dos quarters aprovados.
- 100% dos épicos publicados possuem critérios de aceite e health atualizado semanalmente.
- SLA de atualização do roadmap ≤ 7 dias (alerta automático se exceder).
- Redução de pelo menos 30% no tempo de preparação do planning trimestral (baseline Discovery).
- 90% dos acessos registram uso do botão de ajuda contextual em até 3 interações (garante aprendizagem).

## 3. Integrações Intermodulares

| Fonte | Destino | Artefato | Detalhes |
| --- | --- | --- | --- |
| Módulo 3 (Discovery) | Planejamento | Hipóteses validadas + decisões | Endpoint `/v1/discovery/decisions/:id` alimenta criação de épicos; sincronizar status para health automático. |
| Módulo 5 (Documentação) | Planejamento | PRDs/RFCs | Links obrigatórios no card de épico para handoff; webhook `documento.aprovado` atualiza checklist. |
| Módulo 6 (Validação & GTM) | Planejamento | Planos de lançamento | Features aprovadas geram tarefas no plano de validação; baseline de métricas alimenta simulador. |
| Módulo 2 (Triagem) | Planejamento | Tags de prioridade e segmentos | Usado como contexto para priorização automática (impacto × esforço). |

## 4. Regras de Ajuda Contextual

- Todas as telas do módulo possuem botão `Ajuda` persistente na AppShell (ícone `HelpCircle`).
- Conteúdo carregado de `planejamento-help.json` via i18n (`pt-BR`, fallback `en-US`).
- Modal indica: propósito da tela, como usar cada controle crítico, checklist de DoR/DoD, links para documentação.
- Eventos de abertura/fechamento são logados com `trace_id`, `id_tenant`, `id_usuario` para métricas de adoção.

## 5. Fluxos-Chave Consolidado

1. **Planning Trimestral**: iniciar ciclo → validar pré-requisitos (OKRs, backlog, dívidas) → registrar participantes → checklist concluído.
2. **Gestão de Épicos e Features**: criar épico > associar hipóteses/documentos > decompor features > estimar > revisar riscos > aprovar.
3. **Dependências & Riscos**: Tech Leads registram dependências (hard/soft) → sistema monta gráfico e alertas pro roadmap.
4. **Roadmap Timeline**: arrastar épicos/ features, ajustar datas e estado de comprometimento, disparar modo apresentação.
5. **Simulador de Cenários**: selecionar cenário → ajustar capacidade/buffers → recomputar cronograma → salvar/ comparar → gerar log de decisão.
6. **Commitment Final**: consolidar épicos por categoria (Committed/Targeted/Aspirational) → colher assinaturas digitais → emitir webhook `po_handoff.created`.

## 6. Artefatos a Gerar

- APIs REST `/v1/planejamento/*` cobrindo commands/queries descritos.
- Modelos Prisma para épicos, features, dependências, capacidade, cenários e commitments (com histórico).
- Projeções read-model (timeline, capacidade, simulador) para consultas rápidas.
- Componentes Next.js (cards, timeline, gráficos) respeitando design tokens e dark mode.
- Serviços de heurística (prioridade, risco, dependências ocultas) com telemetria e explicabilidade.
- CRUD multi-tenant para catálogos (Squads e Planning Cycles) acessível via `/planejamento/configuracao`, com ajuda contextual e validações completas.

Este documento consolida os requisitos necessários para iniciar implementação do módulo conforme diretrizes do plano aprovado.

