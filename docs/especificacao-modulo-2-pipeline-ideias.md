# Especificação do Módulo 2: Pipeline de Ideias e Oportunidades

## 1. Visão Geral do Módulo

### Objetivo
O módulo de Pipeline de Ideias e Oportunidades tem como objetivo centralizar, organizar e processar todas as sugestões e oportunidades de produto vindas de múltiplas fontes, garantindo que nenhuma ideia relevante seja perdida e que o processo de triagem seja eficiente e transparente.

### Escopo
- Captura de ideias de múltiplas origens (clientes, equipe interna, parceiros, diretoria)
- Workflow configurável de triagem e análise
- Avaliação automática com scoring de impacto, esforço e risco
- Histórico completo de decisões e justificativas
- Métricas e análises do pipeline de inovação

### Personas Principais
- **Stakeholders Internos**: Submissão de ideias e acompanhamento
- **Product Managers**: Triagem, análise e decisão sobre ideias
- **CPO**: Visão consolidada e métricas do pipeline
- **Clientes/Parceiros**: Portal simplificado para sugestões

---

## 2. Especificação Detalhada das Telas

### 2.1 Portal de Submissão de Ideias

#### Layout e Componentes

**Versão Pública (Clientes/Parceiros)**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  💡 Portal de Ideias - Faktory                                         │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  Tem uma sugestão para melhorar nossos produtos?                      │
│  Compartilhe sua ideia conosco!                                       │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Título da Ideia *                                               │  │
│  │ [________________________________________________]              │  │
│  │ Ex: "Integração com WhatsApp Business"                         │  │
│  │                                                                  │  │
│  │ Qual problema isso resolve? *                                   │  │
│  │ ┌──────────────────────────────────────────────────────────┐   │  │
│  │ │                                                            │   │  │
│  │ │                                                            │   │  │
│  │ │                                                            │   │  │
│  │ └──────────────────────────────────────────────────────────┘   │  │
│  │                                                                  │  │
│  │ Como você imagina que funcionaria? *                            │  │
│  │ ┌──────────────────────────────────────────────────────────┐   │  │
│  │ │                                                            │   │  │
│  │ │                                                            │   │  │
│  │ └──────────────────────────────────────────────────────────┘   │  │
│  │                                                                  │  │
│  │ Qual o impacto esperado?                                        │  │
│  │ ○ Redução de custos                                            │  │
│  │ ○ Aumento de produtividade                                     │  │
│  │ ○ Melhoria na experiência                                      │  │
│  │ ○ Novo mercado/oportunidade                                    │  │
│  │ ○ Outro: [_________________]                                   │  │
│  │                                                                  │  │
│  │ Anexar arquivos (opcional)                                      │  │
│  │ [Escolher arquivos] Máx: 10MB, Formatos: PDF, JPG, PNG        │  │
│  │                                                                  │  │
│  │ Seus dados (opcional para acompanhamento)                      │  │
│  │ Nome: [_________________] Email: [_________________]           │  │
│  │ Empresa: [_________________]                                    │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [Enviar Ideia]                                                        │
│                                                                         │
│  ✓ Sua ideia será analisada por nossa equipe de produto              │
│  ✓ Você receberá atualizações sobre o status (se fornecer email)     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Versão Interna (Colaboradores)**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  💡 Nova Ideia                                               [Cancelar]│
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  Informações Básicas                                                   │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Título *                                                        │  │
│  │ [________________________________________________]              │  │
│  │                                                                  │  │
│  │ Produto Relacionado *         Categoria *                       │  │
│  │ [Selecione ▼]                [Nova Feature ▼]                  │  │
│  │                                                                  │  │
│  │ Descrição Detalhada *                                           │  │
│  │ ┌──────────────────────────────────────────────────────────┐   │  │
│  │ │ Contexto:                                                 │   │  │
│  │ │                                                            │   │  │
│  │ │ Solução proposta:                                         │   │  │
│  │ │                                                            │   │  │
│  │ │ Benefícios esperados:                                     │   │  │
│  │ └──────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Análise Preliminar                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Origem da Ideia *             Urgência                         │  │
│  │ [Cliente Direto ▼]           [Média ▼]                        │  │
│  │                                                                  │  │
│  │ Estimativa de Impacto (1-10)  Estimativa de Esforço (1-10)    │  │
│  │ [5 ▼]                        [5 ▼]                             │  │
│  │                                                                  │  │
│  │ Riscos Identificados                                            │  │
│  │ ┌──────────────────────────────────────────────────────────┐   │  │
│  │ │                                                            │   │  │
│  │ └──────────────────────────────────────────────────────────┘   │  │
│  │                                                                  │  │
│  │ Stakeholders Interessados      Cliente/Case Específico         │  │
│  │ [+ Adicionar]                 [_____________________]          │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [Anexar Documentos]  [Salvar Rascunho]  [Submeter para Análise]     │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Regras de Negócio
1. **Categorias de Ideias**:
   - Nova Feature
   - Melhoria
   - Correção/Bug
   - Integração
   - Inovação/P&D
   - Processo/Interno
2. **Origens Possíveis**:
   - Cliente Direto
   - Suporte/CS
   - Vendas
   - Parceiro
   - Diretoria
   - Equipe Interna
   - Pesquisa de Mercado
3. **Níveis de Urgência**: Baixa, Média, Alta, Crítica
4. **Auto-save**: Salva rascunho a cada 30 segundos

#### Validações
- Título: mínimo 10, máximo 100 caracteres
- Descrição: mínimo 100 caracteres
- Anexos: máximo 5 arquivos, 10MB cada
- Email válido se fornecido (versão pública)
- Impacto e Esforço: valores de 1 a 10
- Pelo menos uma categoria selecionada

---

### 2.2 Kanban de Triagem

#### Layout e Componentes

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Pipeline de Ideias                    [Filtros ▼] [Vista: Kanban ▼]  │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  Buscar: [_______________] Produto: [Todos ▼] Origem: [Todas ▼]       │
│  Período: [Últimos 30 dias ▼] Responsável: [Todos ▼]                 │
│                                                                         │
│  ┌────────────┬────────────┬────────────┬────────────┬────────────┐  │
│  │ Recebidas  │ Em Análise │ Discovery  │ Aprovadas  │ Rejeitadas │  │
│  │    (15)    │    (8)     │    (5)     │    (3)     │    (28)    │  │
│  ├────────────┼────────────┼────────────┼────────────┼────────────┤  │
│  │ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │  │
│  │ │#ID-245 │ │ │#ID-238 │ │ │#ID-220 │ │ │#ID-215 │ │ │#ID-244 │ │  │
│  │ │        │ │ │   PM   │ │ │   PM   │ │ │   ✓    │ │ │   ✗    │ │  │
│  │ │Integr. │ │ │Chat    │ │ │Mobile  │ │ │API v3  │ │ │Feature │ │  │
│  │ │Zapier  │ │ │24/7    │ │ │Offline │ │ │        │ │ │Complex │ │  │
│  │ │        │ │ │        │ │ │        │ │ │        │ │ │        │ │  │
│  │ │🏷️ API  │ │ │🏷️ Sup  │ │ │🏷️ App  │ │ │🏷️ Int  │ │ │🏷️ UX   │ │  │
│  │ │👤 João │ │ │👤 Ana  │ │ │👤 Luis │ │ │Score:85│ │ │Score:25│ │  │
│  │ │📅 2d   │ │ │📅 5d   │ │ │📅 12d  │ │ │        │ │ │        │ │  │
│  │ └────────┘ │ └────────┘ │ └────────┘ │ └────────┘ │ └────────┘ │  │
│  │            │            │            │            │            │  │
│  │ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │ ┌────────┐ │ [Ver +]  │  │
│  │ │#ID-243 │ │ │#ID-235 │ │ │#ID-218 │ │ │#ID-210 │ │          │  │
│  │ │ Novo   │ │ │   PM   │ │ │   PM   │ │ │   ✓    │ │          │  │
│  │ │Dark    │ │ │Dash-   │ │ │Export  │ │ │Push    │ │          │  │
│  │ │Mode    │ │ │board   │ │ │PDF     │ │ │Notif   │ │          │  │
│  │ │        │ │ │        │ │ │        │ │ │        │ │          │  │
│  │ └────────┘ │ └────────┘ │ └────────┘ │ └────────┘ │          │  │
│  └────────────┴────────────┴────────────┴────────────┴────────────┘  │
│                                                                         │
│  💡 Dica: Arraste os cards entre colunas para mudar o status         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Card Expandido (ao clicar)**
```
┌─────────────────────────────────────────────────────────────────────────┐
│  #ID-245 - Integração com Zapier                              [X]     │
│  ─────────────────────────────────────────────────────────────────     │
│                                                                         │
│  Status: Recebida → [Mover para ▼]                                    │
│  Submetido: 15/01/2025 14:30 por João Silva                          │
│  Produto: API Platform | Categoria: Integração                        │
│                                                                         │
│  Descrição:                                                            │
│  Cliente enterprise solicitou integração nativa com Zapier para       │
│  automatizar fluxos entre nossa plataforma e outras ferramentas.      │
│                                                                         │
│  Análise Automática:                                  Score Total: 72  │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Impacto Potencial    ████████░░  8/10                      │     │
│  │ Esforço Estimado     ████░░░░░░  4/10                      │     │
│  │ Alinhamento Estrat.  █████████░  9/10                      │     │
│  │ Risco Técnico        ███░░░░░░░  3/10                      │     │
│  └─────────────────────────────────────────────────────────────┘     │
│                                                                         │
│  Tags Sugeridas: [+API] [+Integração] [+Enterprise] [+B2B]           │
│                                                                         │
│  Ações Rápidas:                                                        │
│  [Atribuir a mim] [Solicitar mais info] [Agendar discussão]          │
│                                                                         │
│  Comentários (2)                                      [Adicionar ▼]    │
│  ┌─────────────────────────────────────────────────────────────┐     │
│  │ Maria PM • 16/01 09:15                                      │     │
│  │ Interessante! Já temos 3 outros clientes pedindo isso.     │     │
│  │                                                              │     │
│  │ Carlos Dev • 16/01 10:30                                   │     │
│  │ Tecnicamente viável. Estimativa inicial: 2 sprints.        │     │
│  └─────────────────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Regras de Negócio
1. **Workflow de Status**:
   - Recebida → Em Análise → Discovery → Aprovada/Rejeitada
   - Ideias podem pular etapas com justificativa
   - Rejeitadas podem ser reativadas
2. **Cores dos Cards**:
   - Cinza: Recebida
   - Azul: Em Análise
   - Laranja: Discovery
   - Verde: Aprovada
   - Vermelho: Rejeitada
3. **Scoring Automático**:
   - Baseado em palavras-chave, origem, histórico
   - Recalculado quando há novas informações
4. **Tempo em Cada Etapa**:
   - Alertas após 7 dias parado
   - Escalação após 14 dias

#### Validações
- Apenas PMs podem mover cards entre colunas
- Rejeição requer justificativa (mínimo 50 caracteres)
- Discovery requer PM responsável atribuído
- Aprovação requer score mínimo ou override com justificativa

---

### 2.3 Detalhamento de Ideia

#### Layout e Componentes

```
┌─────────────────────────────────────────────────────────────────────────┐
│  #ID-238 - Sistema de Chat 24/7                       [Editar] [...]  │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  ┌─────────────────────────┬───────────────────────────────────────┐  │
│  │ Informações Gerais      │ Linha do Tempo                        │  │
│  │                         │                                       │  │
│  │ Status: Em Análise      │ 15/01 14:30 - Ideia submetida       │  │
│  │ Responsável: Ana Silva  │ 15/01 15:00 - Auto-score: 75        │  │
│  │ Produto: Portal Web     │ 16/01 09:00 - Atribuída para Ana   │  │
│  │ Categoria: Melhoria     │ 16/01 14:00 - Status → Em Análise  │  │
│  │ Origem: Suporte         │ 17/01 10:00 - Comentário adicionado│  │
│  │ Prioridade: Alta        │ 18/01 11:00 - Pesquisa iniciada    │  │
│  └─────────────────────────┴───────────────────────────────────────┘  │
│                                                                         │
│  Descrição Original                                                    │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Muitos clientes reclamam da falta de suporte fora do horário   │  │
│  │ comercial. Precisamos de um sistema de chat que funcione 24/7, │  │
│  │ mesmo que seja parcialmente automatizado com IA.               │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Análise Detalhada                                    [Editar Análise]│
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Impacto no Negócio                               Score: 8/10   │  │
│  │ • Redução de 40% nas reclamações sobre suporte               │  │
│  │ • Potencial aumento de 15% em renovações                     │  │
│  │ • Diferencial competitivo importante                          │  │
│  │                                                                 │  │
│  │ Viabilidade Técnica                              Score: 7/10   │  │
│  │ • Integração com plataformas existentes (Intercom, Zendesk)  │  │
│  │ • Necessidade de treinar modelo de IA para respostas         │  │
│  │ • Infraestrutura de alta disponibilidade necessária          │  │
│  │                                                                 │  │
│  │ Esforço Estimado                                 Score: 6/10   │  │
│  │ • 3-4 meses de desenvolvimento                                │  │
│  │ • 2 devs full-time + 1 especialista IA                       │  │
│  │ • Investimento estimado: R$ 150-200k                         │  │
│  │                                                                 │  │
│  │ Riscos e Mitigações                                           │  │
│  │ • Risco: Respostas inadequadas da IA                         │  │
│  │   Mitigação: Período de treinamento supervisionado           │  │
│  │ • Risco: Custos operacionais altos                           │  │
│  │   Mitigação: Modelo híbrido com escalação para humanos       │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Evidências e Dados de Suporte                         [Adicionar +]  │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 📊 Pesquisa NPS Q4/2024 - 35% citaram suporte como problema   │  │
│  │ 📈 Análise de tickets - 60% fora do horário comercial         │  │
│  │ 📄 Benchmark_Concorrentes.pdf - 8 de 10 já oferecem           │  │
│  │ 🔗 Case Study: Empresa X reduziu churn em 25% com chat 24/7   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Discussões e Decisões                                                │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 💬 Thread Principal (5 mensagens)              [Responder ▼]   │  │
│  │ ┌─────────────────────────────────────────────────────────┐   │  │
│  │ │ João CEO • 18/01 09:00                                  │   │  │
│  │ │ Apoio totalmente. Isso está alinhado com nossa         │   │  │
│  │ │ estratégia de customer experience para 2025.            │   │  │
│  │ │                                                          │   │  │
│  │ │ Ana PM • 18/01 10:30                                   │   │  │
│  │ │ Vou agendar sessões de discovery com 10 clientes      │   │  │
│  │ │ para entender melhor as necessidades específicas.      │   │  │
│  │ └─────────────────────────────────────────────────────────┘   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Próximos Passos:                                                      │
│  • Completar research de mercado até 22/01                            │
│  • Entrevistar 10 clientes chave até 25/01                          │
│  • Preparar business case para aprovação até 30/01                   │
│                                                                         │
│  [Mover para Discovery] [Rejeitar] [Exportar] [Vincular a OKR]       │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Regras de Negócio
1. **Versionamento**: Toda edição cria uma nova versão
2. **Permissões de Edição**:
   - Submissor: apenas até status "Em Análise"
   - PM responsável: qualquer momento
   - Outros PMs: apenas comentários
3. **Anexos**: Máximo 20MB total por ideia
4. **Notificações Automáticas**:
   - Mudança de status
   - Novos comentários
   - Menções (@usuario)

#### Validações
- Score de análise: obrigatório antes de mover para Discovery
- Evidências: pelo menos uma antes de aprovar
- Próximos passos: obrigatórios em status "Em Análise" e "Discovery"
- Vinculação com OKR: obrigatória para aprovação final

---

### 2.4 Dashboard de Métricas do Pipeline

#### Layout e Componentes

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Dashboard - Pipeline de Ideias           Período: [Último Mês ▼] 🔄   │
│  ═══════════════════════════════════════════════════════════════════   │
│                                                                         │
│  KPIs Principais                                                       │
│  ┌─────────────┬─────────────┬─────────────┬─────────────┐           │
│  │ Total       │ Taxa de     │ Tempo Médio │ Ideas per   │           │
│  │ Recebidas   │ Aprovação   │ Análise     │ PM          │           │
│  │             │             │             │             │           │
│  │    156      │   18.5%     │   4.2d      │    12.3     │           │
│  │  ↑ 23%      │  ↑ 2.3%     │  ↓ 0.8d     │  ↑ 3.1      │           │
│  └─────────────┴─────────────┴─────────────┴─────────────┘           │
│                                                                         │
│  Volume por Origem                    │  Funil de Conversão            │
│  ┌─────────────────────────────────┐ │  ┌───────────────────────────┐ │
│  │ Clientes    ████████████  45%  │ │  │ Recebidas      156 █████ │ │
│  │ Suporte     ████████  25%       │ │  │                     ████  │ │
│  │ Vendas      █████  15%          │ │  │ Em Análise     89  ███   │ │
│  │ Interno     ███  10%            │ │  │                     ██    │ │
│  │ Parceiros   ██  5%              │ │  │ Discovery      34  █      │ │
│  └─────────────────────────────────┘ │  │                           │ │
│                                       │  │ Aprovadas      29  █      │ │
│  Tendência Mensal                    │  │                           │ │
│  ┌─────────────────────────────────┐ │  │ Rejeitadas     98  ███   │ │
│  │     ^                           │ │  └───────────────────────────┘ │
│  │ 200 │      ╱╲                   │ │                                │
│  │ 150 │  ╱╲ ╱  ╲  ╱╲              │ │  Top 5 Motivos de Rejeição    │
│  │ 100 │ ╱  ╲    ╲╱  ╲             │ │  ┌───────────────────────────┐ │
│  │  50 │╱                           │ │  │ 1. Fora do escopo   (32%) │ │
│  │   0 └────────────────────────>  │ │  │ 2. Custo/benefício  (28%) │ │
│  │     J  F  M  A  M  J  J  A     │ │  │ 3. Duplicada        (18%) │ │
│  └─────────────────────────────────┘ │  │ 4. Tecnicamente inv.(15%) │ │
│                                       │  │ 5. Baixa prioridade  (7%) │ │
│                                       │  └───────────────────────────┘ │
│                                                                         │
│  Performance por Produto                                               │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ Produto      │ Recebidas │ Aprovadas │ Taxa │ Tempo Médio     │  │
│  │ ─────────────────────────────────────────────────────────────  │  │
│  │ CRM Principal│    67     │    18     │ 27%  │ 3.5 dias  ✅   │  │
│  │ App Mobile   │    45     │    7      │ 16%  │ 5.2 dias  ⚠️   │  │
│  │ Portal Web   │    32     │    3      │ 9%   │ 6.8 dias  🔴   │  │
│  │ API Platform │    12     │    1      │ 8%   │ 4.1 dias  ⚠️   │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  Ideias Mais Votadas (Aguardando Análise)                            │
│  ┌─────────────────────────────────────────────────────────────────┐  │
│  │ 1. 👍 234  Integração com Google Calendar                      │  │
│  │ 2. 👍 189  Modo offline no aplicativo                          │  │
│  │ 3. 👍 156  Dashboard personalizável                            │  │
│  │ 4. 👍 98   Exportação em massa para Excel                     │  │
│  │ 5. 👍 87   Autenticação biométrica                            │  │
│  └─────────────────────────────────────────────────────────────────┘  │
│                                                                         │
│  [Exportar Relatório] [Configurar Alertas] [Ver Detalhes]            │
└─────────────────────────────────────────────────────────────────────────┘
```

#### Regras de Negócio
1. **Métricas Calculadas**:
   - Taxa de Aprovação = (Aprovadas / Recebidas) × 100
   - Tempo Médio = Média de dias entre recebimento e decisão final
   - Ideas per PM = Total recebidas / PMs ativos no período
2. **Indicadores de Performance**:
   - ✅ Verde: Dentro da meta
   - ⚠️ Amarelo: 80-100% da meta
   - 🔴 Vermelho: Abaixo de 80% da meta
3. **Sistema de Votação**:
   - Disponível para ideias públicas
   - 1 voto por usuário por ideia
   - Influencia priorização mas não determina

#### Validações
- Período mínimo: 7 dias
- Período máximo: 365 dias
- Atualização em tempo real para métricas do dia
- Cache de 1 hora para dados históricos

---

## 3. Fluxos de Navegação

### Fluxo Principal - Ciclo de Vida da Ideia
```
Portal Submissão → Kanban (Recebida) → Análise → Discovery → Decisão → Implementação/Arquivo
                                          ↓
                                   Detalhamento
                                          ↓
                                   Métricas/Dashboard
```

### Fluxos Alternativos
1. **Fast Track**: Ideia crítica pula direto para aprovação
2. **Reativação**: Ideia rejeitada é reconsiderada
3. **Merge**: Múltiplas ideias similares são consolidadas

---

## 4. Integrações Entre Módulos

- **Com Estratégia (Módulo 1)**: Ideias aprovadas viram iniciativas no roadmap
- **Com Discovery (Módulo 3)**: Ideias em discovery geram pesquisas
- **Com Documentação (Módulo 5)**: Ideias aprovadas geram PRDs
- **Com Métricas (Módulo 7)**: Acompanhamento pós-implementação

---

## 5. Entregáveis e Relatórios

### Relatórios Disponíveis
1. **Pipeline Report Mensal**: Visão executiva do funil
2. **Origem Analysis**: De onde vêm as melhores ideias
3. **PM Performance**: Eficiência individual na triagem
4. **Innovation Index**: Quantas ideias viraram produtos

### Dashboards Personalizáveis
- Widget de ideias pendentes por PM
- Gráfico de tendências por categoria
- Alertas de ideias paradas
- Top contributors (submissores)

### Exportações
- CSV com todos os dados
- PDF com relatório formatado
- API para integração com BI
- Webhook para eventos do pipeline

---

## 6. Considerações de Performance

- Paginação de 50 ideias por página no Kanban
- Lazy loading de comentários e anexos
- Busca com elasticsearch para grandes volumes
- Score calculado assincronamente
- Cache de métricas agregadas

---

## 7. Gamificação e Engajamento

### Sistema de Pontos
- Submeter ideia: 10 pontos
- Ideia aprovada: 100 pontos
- Ideia implementada: 500 pontos
- Participar em discovery: 50 pontos

### Badges e Conquistas
- 🏅 First Mover: Primeira ideia aprovada
- 🎯 Sharp Shooter: 5 ideias aprovadas
- 💡 Idea Machine: 50 ideias submetidas
- 🏆 Innovation Champion: Ideia com maior impacto do ano

### Leaderboard
- Ranking mensal/trimestral/anual
- Por departamento e geral
- Reconhecimento em all-hands

---

## 8. Configurações e Personalização

### Configurações Globais
- Campos customizados para ideias
- Workflow adaptável por produto
- Critérios de scoring ajustáveis
- Templates de análise

### Notificações
- Email digest diário/semanal
- Push notifications no app
- Slack/Teams integration
- Alertas de SLA

### Permissões
- Visualização pública ou restrita
- Níveis de acesso por função
- Delegação temporária
- Auditoria completa
