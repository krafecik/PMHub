# Módulo 3 – Product Discovery  
### Documento completo, profundo e detalhado (UX/UI + processos + fluxos + tabelas + heurísticas)

O Product Discovery é o **coração intelectual** do time de Produto.  
É onde problemas viram entendimento, entendimento vira conhecimento,  
e conhecimento vira **decisão estratégica**.

Este módulo descreve em detalhes:

- Fluxos completos de descoberta  
- Hipóteses e validações  
- Entrevistas, pesquisas, análises e sínteses  
- Insights e repositórios inteligentes  
- MVPs/experimentos com métricas  
- UX/UI completas das telas  
- Tabelas do banco para suportar tudo  
- Regras, comportamentos e microinterações  

---

# 🎯 1. Objetivo Geral do Módulo

Transformar uma demanda triada em:

- Um problema bem compreendido  
- Hipóteses claras  
- Evidências reais  
- Insights acionáveis  
- Decisão baseada em dados  
- MVPs ou experimentos validados  
- Proposta final de solução  

O Discovery **não é para validar ideias**.  
É para **entender o problema e reduzir incerteza**.

---

# 👤 2. Personas Envolvidas

## 🧑‍💼 Product Manager (PM)
Lidera o processo, conduz entrevistas, escreve hipóteses, análises e sínteses.

## 🎨 UX Researcher / Designer
Coleta dados qualitativos, ajuda em entrevistas e jornadas de usuário.

## 👥 Stakeholders
Diretores, clientes, especialistas, usuários internos.

## 🤖 Sistema (IA de suporte)
Sugere hipóteses, correlaciona insights, sugere duplicações, gera resumos.

---

# 🧠 3. Princípios de UX/UI do Módulo

1. **Todo o Discovery precisa ser rastreável** (LinkedIn-style activity log)  
2. **Tudo deve ser pesquisável** por título, tags, problemas, insights e hipóteses  
3. **UX focada em trabalho intelectual**, não burocrático  
4. **Autosave contínuo**  
5. **Linha do tempo do discovery** clara e navegável  
6. **Criação rápida de hipóteses e evidências**  
7. **Templates reutilizáveis**  
8. **Assistente de IA para insights, síntese, entrevistas e priorização**  
9. **Indicação visual clara do progresso (barras)**  

---

# 🗂️ 4. Estrutura do Módulo (Telas e Fluxos)

O módulo é dividido em **6 grandes áreas**:

1. **Painel de Discovery**  
2. **Página do Problema**  
3. **Hipóteses**  
4. **Pesquisas e Entrevistas**  
5. **Evidências e Insights**  
6. **MVP / Experimentos**  
7. **Decisão Final**  

---

# 🖥️ 5. Painel de Discovery

Tela principal onde o PM vê todos os discovery ativos.

```
┌──────────────────────────────────────────────────────────────┐
│ 🔬 Product Discovery                               [+ Novo]   │
├──────────────────────────────────────────────────────────────┤
│ Filtros: Produto [▼] PM [▼] Status [▼] Tags [▼]              │
│ Buscar: [________________________________] 🔍                │
├──────────────────────────────────────────────────────────────┤
│ Cards de Discovery                                           │
└──────────────────────────────────────────────────────────────┘
```

## Card de Discovery (versão rica)

```
┌──────────────────────────────────────────────────────────────┐
│ #D-32 • Onboarding confuso                         ERP Core   │
│ PM: Ana • Status: Em Pesquisa • Criado há 3 dias             │
│ Hipóteses: 4   Evidências: 12   Entrevistas: 3               │
│ Insights: 5    MVP: Não iniciado                             │
├──────────────────────────────────────────────────────────────┤
│ “70% dos usuários abandonam onboarding no passo 3.”           │
│ Tags: [Onboarding] [Conversão] [UX]                           │
│ Sugerido: “Relacionado ao Discovery D-18 (Checkout)”         │
├──────────────────────────────────────────────────────────────┤
│ [Abrir] [💬 Resumo] [📄 Criar Hipótese] [🎤 Nova Entrevista]   │
└──────────────────────────────────────────────────────────────┘
```

---

# 📄 6. Página do Problema (Visão Completa)

Essa é a página principal de cada discovery.

```
┌──────────────────────────────────────────────────────────────┐
│ #D-32 – Onboarding confuso                         [⋯] [X]   │
│ Produto: ERP Core | Status: Em Pesquisa                      │
│ Criado: 12/11/2025 | PM: Ana                                 │
├──────────────────────────────────────────────────────────────┤
│ Abas: Problema | Hipóteses | Pesquisas | Evidências | MVP | Decisão │
├──────────────────────────────────────────────────────────────┤
```

## 6.1. Aba “Problema”

```
🧩 Problema
Título:
[Usuários abandonam onboarding no passo 3]

Descrição:
[Rich text editor]

Contexto:
[Dados, prints, links, histórico]

Público afetado:
[Novos usuários] [Clientes médios] [Persona: “Carlos”]

Volume impactado:
[70% dos novos clientes]

Severidade:
[Alta ▼]

Como foi identificado:
[Analytics] [Entrevistas] [Suporte]

Evolução do entendimento:
[Log cronológico automático]
```

---

# 🧪 7. Hipóteses

Tela criada para PM formalizar hipóteses.

## 7.1. Lista de hipóteses

```
┌──────────────────────────────────────────────┐
│ Hipóteses (4)                    [+ Nova]    │
├──────────────────────────────────────────────┤
│ H1 • Usuários não enxergam o botão “Avançar” │
│ Evidências: 3  Status: Em Teste              │
│ Impacto estimado: Alto                       │
│ Prioridade: Alta                             │
├──────────────────────────────────────────────┤
│ H2 • Explicação do passo 3 é insuficiente    │
│ Evidências: 2  Status: Pendente              │
└──────────────────────────────────────────────┘
```

## 7.2. Tela de edição de hipótese

```
Título:
[Usuários não enxergam botão “Avançar”]

Descrição:
[Texto rich]

Como validar:
[Teste A/B com posição do botão]

Métrica alvo:
[+15% na taxa de conclusão do onboarding]

Impacto esperado:
[Alta ▼]

Status:
Em Teste / Validada / Refutada / Arquivada
```

---

# 🎤 8. Pesquisas e Entrevistas

## 8.1. Central de Pesquisas

```
Calendário   |   Lista   |   Tarefas de Recrutamento
```

### Card de pesquisa

```
Entrevistas – Onboarding
Método: Entrevista guiada
Progressão: 3/8 participantes
Próxima sessão: Hoje às 14h
[Ver detalhes]
```

## 8.2. Tela de uma pesquisa

```
Objetivo:
“Entender o comportamento no passo 3.”

Roteiro:
[Arquivo roteiro.pdf]

Participantes:
Lista com status, gravações, notas

Insights associados:
[3 insights vinculados]
```

---

# 🎥 9. Entrevista individual

A entrevista tem sua própria tela com gravação, notas e marcações.

```
┌──────────────────────────────────────────────┐
│ 📹 Entrevista – João Silva                                │
│ Perfil: Novo Cliente | Data: 14/01 às 14h                 │
├──────────────────────────────────────────────┤
│ Transcrição (IA):                                       │
│ “Fiquei perdido no passo 3…”                            │
│                                                        │
│ Notas: [campo para PM escrever]                         │
│ Tags: [Passo 3] [Confusão] [UX]                          │
│                                                        │
│ Botões: [+ Criar insight] [+ Criar evidência]           │
└──────────────────────────────────────────────┘
```

---

# 🧾 10. Evidências e Insights

## 10.1. Evidências

Evidências são **fatos**, não opiniões.

Tipos:

- Dados
- Prints
- Vídeos
- Feedbacks
- Logs
- Transcrições
- Resultados de teste
- Comparações com benchmark

### Tela de evidências

```
Evidência #12
Tipo: Dados (Analytics)
Descrição: “70% abandonam no passo 3”
Arquivo: analytics.png
Vinculada a: Hipótese H1, H2
Tags: [Conversão] [Onboarding]
```

---

## 10.2. Insights

Insights são **interpretações**.

Tela de insight:

```
💡 Insight #24
“Usuários acham que o passo 3 é opcional”
Fonte: Entrevista – João Silva
Evidências: 4 associadas
Impacto: Alto
Confiança: Média
Status: Validado
```

---

# 🧪 11. MVP / Experimentos

## 11.1. Lista de experimentos

```
┌──────────────────────────────────────────────┐
│ Experimentação (3)                [+ Novo]    │
├──────────────────────────────────────────────┤
│ MVP A – Simplificar passo 3                  │
│ O quê: retirar textos irrelevantes           │
│ Métrica: taxa de conclusão                   │
│ Status: Em Execução                          │
├──────────────────────────────────────────────┤
│ MVP B – Botão avançar fixo                  │
│ Status: Planejado                            │
└──────────────────────────────────────────────┘
```

## 11.2. Tela do experimento

```
Título:
[MVP A – Simplificar passo 3]

Hipótese associada:
[H2 – Explicação insuficiente]

Descrição:
[Remover textos irrelevantes e reorganizar informações]

Métrica de sucesso:
[+15% na taxa de conclusão]

Grupo:
Controle / Variante A

Resultados:
- Controle: 32%
- Variante A: 48%
p-value: < 0.01

Status: Validado
```

---

# 🧮 12. Decisão Final do Discovery

A decisão final tem formato de **quadro executivo**.

```
🎯 Conclusão do Discovery

Status Final:
[Aprovado] [Rejeitado] [Retomar depois] [Criar épico]

Resumo:
[Parágrafo gerado automaticamente por IA + edição humana]

Principais aprendizados:
• ...
• ...
• ...

Recomendações:
• Redesenhar passo 3
• Criar auto-save
• Novo fluxo de instrução

Materiais anexos:
[PRD sugerido] [Jornada] [Insights]
```

---

# 🧱 13. Tabelas de Banco (versão aprofundada)

## 13.1. Tabela Discovery

| Campo | Tipo |
|--------|--------|
| id_discovery | UUID |
| id_demanda | FK |
| titulo | varchar |
| descricao | text |
| produto_id | FK |
| status | enum(EM_PESQUISA, VALIDANDO, FECHADO, CANCELADO) |
| criado_por | FK |
| criado_em | datetime |
| atualizado_em | datetime |

---

## 13.2. Tabela Hipotese

| Campo | Tipo |
|--------|--------|
| id_hipotese | UUID |
| id_discovery | FK |
| titulo | varchar |
| descricao | text |
| como_validar | text |
| impacto | enum |
| prioridade | enum |
| status | enum |
| criado_em | datetime |

---

## 13.3. Tabela Pesquisa

| Campo | Tipo |
|--------|--------|
| id_pesquisa | UUID |
| id_discovery | FK |
| metodo | enum |
| objetivo | text |
| status | enum(planejada, em_andamento, concluida) |
| criado_em | datetime |

---

## 13.4. Tabela Entrevista

| Campo | Tipo |
|--------|--------|
| id_entrevista | UUID |
| id_pesquisa | FK |
| participante | varchar |
| perfil | varchar |
| data_hora | datetime |
| transcricao | text |
| notas | text |
| tags | json |
| criado_em | datetime |

---

## 13.5. Tabela Evidencia

| Campo | Tipo |
|--------|--------|
| id_evidencia | UUID |
| id_hipotese | FK |
| id_discovery | FK |
| tipo | enum |
| descricao | text |
| arquivo_url | varchar |
| criado_em | datetime |

---

## 13.6. Tabela Insight

| Campo | Tipo |
|--------|--------|
| id_insight | UUID |
| id_discovery | FK |
| descricao | text |
| impacto | enum |
| confianca | enum |
| status | enum |
| criado_em | datetime |

---

## 13.7. Tabela Experimento

| Campo | Tipo |
|--------|--------|
| id_experimento | UUID |
| id_discovery | FK |
| titulo | varchar |
| descricao | text |
| metrica | varchar |
| status | enum |
| resultados_json | json |
| criado_em | datetime |

---

# 📊 14. Heurísticas Avançadas (Sistema Inteligente)

- IA sugere hipóteses com base em insights anteriores  
- IA correlaciona insights de múltiplas pesquisas  
- IA sugere MVPs usuais (ex: protótipo, teste A/B, fake door)  
- Sistema reconhece padrões de problemas recorrentes  
- Recomendações para “descobertas rápidas” (quick wins)  

---

# 🧭 15. Critérios de Sucesso

- 90% dos discoveries concluídos com decisão clara  
- Pelo menos 1 experimento executado por discovery relevante  
- Insights reutilizáveis entre discoveries  
- Taxa de acerto das hipóteses acima de 40%  
- Redução de “retrabalho de solução”  

---



🧩 16. Considerações Finais e Diretrizes de Excelência do Módulo de Product Discovery

O módulo de Product Discovery apresentado acima não é apenas um agrupamento de telas, práticas e fluxos. Ele representa uma filosofia operacional de Produto, onde a busca sistemática pela compreensão do problema é um ativo estratégico da organização.
Este módulo estabelece as bases para transformar decisões intuitivas em decisões fundamentadas, e a operação de Produto em um mecanismo de entrega contínua de valor.

1. Discovery como disciplina institucional

A partir da implementação deste módulo, o Discovery deixa de depender de disciplina individual dos PMs e passa a ser sustentado por:

Processos claros

Ferramentas adequadas

Histórico automatizado

Repositórios ricos em insights

IA como catalisador de qualidade

Com isso, todo discovery torna-se auditável, estruturado e governável.

2. Repositório vivo de conhecimento organizacional

Cada entrevista, evidência, insight e experimento deixa de ser um artefato isolado e passa a compor um acervo duradouro.
Esse repositório é essencial para:

Evitar retrabalho

Comparar descobertas de épocas diferentes

Ampliar a maturidade do time

Acelerar futuros discoveries

Criar aprendizado institucional cumulativo

O módulo transforma conhecimento tácito em conhecimento explícito, acessível e reutilizável.

3. Redução de risco como objetivo central

O sucesso do Discovery não é medir quantidade de telas criadas ou entrevistas realizadas, mas sim:

Diminuir incertezas

Eliminar hipóteses fracas

Priorizar somente aquilo que tem impacto mensurável

Validar problemas antes de pensar em solução

Materializar evidências que suportam decisões

Cada etapa do módulo foi desenhada com foco em reduzir desperdício de engenharia.

4. Governança do ciclo de vida das ideias

Com o módulo implementado, a organização passa a operar com uma regra simples:

Nenhuma ideia entra no roadmap sem passar pelo Discovery.

Esse mecanismo institucional elimina decisões emocionais, interrupções de diretores e “sugestões urgentes”, criando um fluxo previsível de:

Levantamento do problema

Entendimento profundo

Testes e experimentação

Decisão baseada em dados

Transição para Delivery

Isso reforça a autonomia do time de Produto e protege a engenharia de demandas mal fundamentadas.

5. Integração nativa com UX Research

O módulo foi desenhado para aproximar PMs e Designers, tornando natural:

Conduzir entrevistas

Analisar transcrições

Criar evidências a partir de pesquisas

Consolidar insights

Propor experimentos com base em comportamento real

Essa aproximação garante que o Discovery seja mais humano, mais empírico e mais centrado no usuário.

6. IA como copiloto estratégico

A inteligência artificial integrada ao módulo não substitui o PM.
Ela amplifica a sua capacidade analítica através de:

Sugestões de hipóteses

Correlação automática de evidências

Sínteses de entrevistas

Geração de insights

Análises comparativas

Detecção de duplicidade entre discoveries

Elaboração de resumos executivos

O foco é entregar mais clareza, mais velocidade e mais confiabilidade ao processo decisório.

7. Padronização de qualidade e tomada de decisão

A forma como o módulo foi projetado garante consistência entre discoveries, permitindo que:

Todos os PMs sigam o mesmo nível de profundidade

Diretores tenham visibilidade clara

Decisões sejam comparáveis entre si

Métricas de confiança sejam calibradas

Experimentos sejam repetíveis

O resultado é um processo previsível, replicável e auditável.

8. Preparação para o PRD e para o Delivery

A etapa final de “Decisão Final” e o quadro executivo fornecem insumos diretos para:

Construção de épicos e histórias

Estimativas iniciais

Alinhamento com engenharia

Kick-off técnico

Criação do PRD ou lean-PRD

O Discovery se transforma em entrada natural do Delivery, reduzindo falhas de entendimento e evitando reescrita de requisitos.

📘 Conclusão Geral

Este módulo estabelece um padrão elevado para a prática de Product Discovery dentro da organização.
Ele combina processos maduros, visão estratégica, rigor metodológico, suporte de IA e uma experiência de uso canalizada para o trabalho intelectual do PM.

Com essa estrutura, cada discovery deixa de ser um esforço isolado e passa a ser parte de um sistema integrado, escalável e inteligente — capaz de transformar a cultura de Produto e aumentar significativamente a assertividade das decisões.

Este documento representa, portanto:

O blueprint oficial de como a empresa descobre, valida e prioriza problemas.
O ponto de partida para uma operação de Produto mais científica, mais estratégica e mais orientada a impacto real.