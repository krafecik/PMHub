# Matriz de Atributos Configuráveis

> Etapa 1 ― Escopo e Prioridades  
> Versão 2025-11-14

Este documento consolida os catálogos necessários para capturar, qualificar e evoluir demandas. Cada linha indica a criticidade (obrigatório/ opcional), o ponto do sistema que consome o catálogo e observações para implementação posterior.

---

## 1. Captura de Demandas

| Ordem | Slug (`CatalogCategorySlugs`) | Rótulo sugerido | Obrigatório | Consumido por | Observações |
| :---: | ----------------------------- | --------------- | :---------: | ------------- | ----------- |
| C1 | `tipo_demanda` | Tipos de demanda | Sim | `Demanda.tipo_id` | Deve existir ao menos um item ativo para permitir criação de demandas. |
| C2 | `origem_demanda` | Origens de demanda | Sim | `Demanda.origem_id` | Usado por regras automáticas (ex.: origem suporte → urgência média). |
| C3 | `prioridade_nivel` | Prioridades (nível) | Sim | `Demanda.prioridade_id`, SLA dashboard | Metadados (`weight`, `color`) definem ordem e cor para heatmaps. |
| C4 | `status_demanda` | Status da demanda | Sim | `Demanda.status_id` | Workflow orquestrado pela triagem (transições limitadas). |
| C5 | `tipo_usuario` | Tipos de usuário | Opcional | Cadastro de stakeholders / convites | Facilita filtros de comunicação. |
| C6 | `cargo_usuario` | Cargos / funções | Opcional | Perfis de contato | Suporta relatórios de relacionamento. |
| C7 | `segmento_cliente` | Segmentos de cliente | Opcional | Campos customizados (metadata) | Auxilia priorização por segmento. |
| C8 | `tipo_anexo` | Tipos de anexo | Opcional | `Anexo.tipo_id` | Permite restringir uploads por categoria. |
| C9 | `identificacao_origem` | Origem identificada | Opcional | Sugestões do discovery | Alinha nomenclatura com insights (analytics, entrevistas etc.). |

---

## 2. Triagem e Qualificação

| Ordem | Slug | Rótulo | Obrigatório | Consumido por | Observações |
| :---: | ---- | ------ | :---------: | ------------- | ----------- |
| T1 | `status_triagem` | Status de triagem | Sim | `TriagemDemanda.status_id` | Determina se demanda segue para discovery, épico ou arquivamento. |
| T2 | `impacto_nivel` | Impacto percebido | Sim | `TriagemDemanda.impacto_id` | Escala compartilhada com insights/hipóteses. |
| T3 | `urgencia_nivel` | Urgência | Sim | `TriagemDemanda.urgencia_id` | Combina com prioridade para calcular SLA. |
| T4 | `complexidade_nivel` | Complexidade | Sim | `TriagemDemanda.complexidade_id` | Ajuda na estimativa inicial. |
| T5 | `motivo_arquivamento` | Motivos de arquivamento | Opcional | Ação “Arquivar” na triagem | Suporta análises de desperdício. |
| T6 | `tipo_solicitacao_info` | Tipos de follow-up | Opcional | `SolicitacaoInfo.tipo_id` | Permite templates de mensagem por tipo. |

---

## 3. Product Discovery

| Ordem | Slug | Rótulo | Obrigatório | Consumido por | Observações |
| :---: | ---- | ------ | :---------: | ------------- | ----------- |
| D1 | `status_discovery` | Status do discovery | Sim | `Discovery.status_id` | Funil principal do discovery. |
| D2 | `severidade_problema` | Severidade do problema | Sim | `Discovery.severidade_id` | Compartilha escala com impacto/urgência. |
| D3 | `impacto_insight` | Impacto do insight | Sim | `Insight.impacto_id` | Usa mesma escala T2 para consistência. |
| D4 | `confianca_insight` | Confiança do insight | Sim | `Insight.confianca_id` | Pondera priorização de aprendizados. |
| D5 | `status_insight` | Status do insight | Sim | `Insight.status_id` | Workflow de evolução do insight. |
| D6 | `status_hipotese` | Status da hipótese | Sim | `Hipotese.status_id` | Necessário para roadmap e squads. |
| D7 | `impacto_hipotese` | Impacto esperado | Opcional* | `Hipotese.impacto_id` | Requer escala T2; obrigar quando usar ICE/RICE. |
| D8 | `prioridade_hipotese` | Prioridade da hipótese | Sim | `Hipotese.prioridade_id` | Pode depender de `frameworks_priorizacao`. |
| D9 | `metodo_pesquisa` | Métodos de pesquisa | Sim | `Pesquisa.metodo_id` | Define templates, duração e recursos. |
| D10 | `status_pesquisa` | Status da pesquisa | Sim | `Pesquisa.status_id` | Workflow do squad de research. |
| D11 | `tipo_evidencia` | Tipos de evidência | Sim | `Evidencia.tipo_id` | Dirige checklist/validação. |
| D12 | `tipo_experimento` | Tipos de experimento | Sim | `Experimento.tipo_id` | Usado para sugerir checklists específicos. |
| D13 | `status_experimento` | Status do experimento | Sim | `Experimento.status_id` | Exige controle de transições. |
| D14 | `decisao_discovery` | Decisão parcial | Opcional | `Discovery.decisao_parcial_id` | Indica checkpoints intermediários. |
| D15 | `decisao_final_discovery` | Decisão final | Sim | `DecisaoDiscovery.status_final_id` | Pré-requisito para handoff (planejamento). |
| D16 | `metrica_sucesso_discovery` | Métricas de sucesso | Opcional | `Experimento.metricas[]` | Biblioteca de métricas reutilizáveis. |
| D17 | `persona_participante` | Persona participante | Opcional | `Entrevista.participante_persona_id` | Balanceamento de entrevistas. |
| D18 | `publico_alvo` | Público afetado | Opcional | `Discovery.publicos[]` | Usado para comunicação/impacto. |

\* Opcional somente para tenants que não usam frameworks de priorização baseados em impacto.

---

## 4. Catálogos Transversais e Governança

| Ordem | Slug | Rótulo | Obrigatório | Consumido por | Observações |
| :---: | ---- | ------ | :---------: | ------------- | ----------- |
| G1 | `catalogo_tags` | Catálogo de tags | Sim | `Tag`, filtros globais | Suporta hierarquia via metadados (`parentId`). |
| G2 | `frameworks_priorizacao` | Frameworks de priorização | Opcional | Configuração ICE/RICE/WSJF | Determina campos obrigatórios para D7/D8/C3. |
| G3 | `templates_notificacao` | Templates de notificação | Opcional | Automação / Webhooks | Armazena corpo e placeholders. |
| G4 | `tipos_workflow` | Tipos de workflow | Opcional | Governança (futuros pipelines) | Define pipelines adicionais além do padrão. |
| G5 | `campos_customizados` | Campos customizados | Opcional | Extensão de entidades (metadata) | JSON com validações; habilita campos extras por tenant. |
| G6 | `integracoes_externas` | Integrações externas | Opcional | Conectores de ingestão | Identifica fontes externas (ex.: Zendesk, Jira). |

---

## 5. Matriz de Dependências

| Origem | Depende de | Impacto operacional |
| ------ | ---------- | ------------------- |
| `status_demanda` | `status_triagem` | Transições de demanda limitadas pelo resultado da triagem. |
| `status_triagem` | `status_discovery`, `decisao_final_discovery` | Triagem define se demanda gera discovery, épico ou é arquivada. |
| `impacto_nivel` | `impacto_insight`, `impacto_hipotese` | Mesma escala garante consistência de relatórios e priorização. |
| `urgencia_nivel` | `prioridade_nivel` | Automação calcula prioridade inicial combinando urgência e prioridade. |
| `metodo_pesquisa` | `tipo_experimento` | Sugere experimentos coerentes com o método adotado. |
| `tipo_evidencia` | `status_insight`, `status_experimento` | Determina checklists de promoção de fase (ex.: validar insight). |
| `frameworks_priorizacao` | `prioridade_hipotese`, `prioridade_nivel` | Define quais campos são necessários para cálculo de score. |
| `decisao_final_discovery` | `status_experimento`, `metrica_sucesso_discovery` | Só permite decisão final quando experimentos obrigatórios concluem e métricas foram registradas. |

### Regras gerais

- Catálogos obrigatórios devem possuir pelo menos um item ativo para liberar o módulo ao tenant.
- Todos os catálogos são multi-tenant; alguns permitem escopo por produto (`escopoProduto`).
- Metadados em JSON devem suportar cores, pesos, transições e notas de governança.
- Alterações em catálogos críticos (status/fluxos) precisam de versionamento e auditoria.

---

## 6. Próximos Passos (Etapa 2 em diante)

1. Validar nomenclaturas e obrigatoriedade com stakeholders (CPO/PM).
2. Definir seeds mínimos por catálogo obrigatório.
3. Avançar para Etapa 2 ― Modelagem e Migrações, usando esta matriz como fonte oficial.

