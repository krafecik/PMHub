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



