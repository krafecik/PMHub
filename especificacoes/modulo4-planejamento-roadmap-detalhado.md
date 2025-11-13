# Módulo 4 – Planejamento & Roadmap  
### Documento completo, profundo e altamente detalhado (UX/UI + processos + tabelas + heurísticas + cenários + governança)

O Planejamento & Roadmap é o **cérebro executivo** da área de Produto.  
É aqui que tudo que veio do Discovery se transforma em:

- **épicos**
- **features**
- **estimativas**
- **capacidade**
- **priorização**
- **cenários**
- **dependências**
- **compromissos trimestrais**

Este módulo descreve todos os fluxos necessários para PMs, CPO, Tech Leads e equipes trabalharem num planejamento robusto e rastreável.

---

# 🎯 1. Objetivo Geral do Módulo

Transformar descobertas validadas em um plano estratégico e operacional, que:

- garanta previsibilidade  
- organize prioridades  
- distribua capacidade das equipes  
- permita simulações  
- controle dependências técnicas  
- produza um roadmap coerente e realista  

---

# 👤 2. Personas Envolvidas

## 🧑‍💼 Product Manager (PM)
Cria épicos, features, estimativas, justificativas e prioriza o que entra no ciclo.

## 🧑‍✈️ CPO
Define prioridades estratégicas, valida escopo, garante alinhamento com OKRs.

## 🧑‍💻 Tech Lead
Dá estimativas, identifica riscos técnicos, analisa dependências.

## 🧑‍🔧 Engineering Manager
Garante capacidade técnica e realismo das entregas.

## 🧑‍💼 Stakeholders
Recebem visão de alto nível do roadmap.

---

# 🧠 3. Princípios de UX/UI do Módulo

1. **Roadmap como “linha do tempo” arrastável**  
2. **Épicos são blocos de alto nível e Features são filhos**  
3. **Fluxos de estimativa extremamente simples**  
4. **Capacidade visual clara por squad**  
5. **Sistema sugere riscos e dependências automaticamente**  
6. **Simulador de cenários com sliders e opções**  
7. **Cores para indicar confiabilidade (Committed, Targeted, Aspirational)**  
8. **Modo “Apresentação” para diretoria**  
9. **Histórico completo de decisões e trocas**  

---

# 🗂️ 4. Estrutura do Módulo

1. **Planning Trimestral**  
2. **Gestão de Épicos**  
3. **Gestão de Features**  
4. **Gestão de Dependências**  
5. **Roadmap Timeline (alta visão)**  
6. **Simulador de Cenários**  
7. **Compromissos Trimestrais (Commitment)**  
8. **Controle de capacidade por Squad**  

---

# 🖥️ 5. Tela: Planning Trimestral

```
┌─────────────────────────────────────────────────────────────────┐
│ 📅 Planning Q1 2026                               [Iniciar]      │
│ Status: Em andamento | Participantes confirmados: 12/15          │
├─────────────────────────────────────────────────────────────────┤
│ Fase atual: 1/5 – Preparação                                    │
│ ✓ OKRs definidos   ✓ Backlog priorizado                          │
│ ✓ Métricas Q4       ⚠ Lista de dívidas técnicas incompleta       │
│ ✓ Dependências      ✓ Capacidade preliminar                      │
├─────────────────────────────────────────────────────────────────┤
│ [Ver checklist]            [Ver agenda completa]                 │
└─────────────────────────────────────────────────────────────────┘
```

---

# 📦 6. Épicos

## 6.1. Lista geral

```
┌───────────────────────────────────────────────────────────────┐
│ 📦 Épicos (27)                                      [+ Novo]   │
├───────────────────────────────────────────────────────────────┤
│ API v3 Migration            Squad: Alpha    Status: Em Curso   │
│ Performance Core            Squad: Delta    Status: Planejado   │
│ Mobile Offline Mode         Squad: Beta     Status: Em Curso    │
│ Dashboard Analytics v2      Squad: Gamma    Status: Planejado   │
└───────────────────────────────────────────────────────────────┘
```

## 6.2. Tela de épico (detalhada)

```
┌────────────────────────────────────────────────────────────┐
│ 📦 Épico: API v3 Migration                    [⋯] [X]       │
│ Status: Em Progresso | Health: 🟡 At Risk                   │
│ Quarter: Q1 2026 | Squad: Alpha + Beta                     │
├────────────────────────────────────────────────────────────┤

🎯 Objetivo
[Migrar a API v2 para v3 com GraphQL e novas otimizações...]

📌 Value Proposition
[Melhor DX, performance e capacidade de realtime...]

📆 Datas previstas
Início: 10/01 | Entrega prevista: 28/03

📊 Critérios de Aceite
✓ 100% endpoints migrados  
✓ Documentação em GraphQL  
✓ Testes automatizados acima de 90%  
✓ Migração do gateway

⏳ Features relacionadas: (4)
- Core Services – 75%
- Authentication – 50%
- Data Layer – 25%
- Documentation – 0%

⚠ Riscos identificados
- Dependência do time de DevOps
- Banco exige migração complexa
- Volume alto de testes

📎 Arquivos e Documentos
- PRD-APIv3.pdf  
- RFC GraphQL Layer  
- Desenho da Arquitetura

📣 Updates (log)
- 18/Jan: Data Layer bloqueado por DB Migration  
- 15/Jan: Core pronto antes do previsto  
└────────────────────────────────────────────────────────────┘
```

---

# 🧱 7. Features

Features são os “blocos menores” dentro dos épicos.

## 7.1. Lista

```
┌────────────────────────────────────────────────────────┐
│ Features de API v3                         [+ Adicionar] │
├────────────────────────────────────────────────────────┤
│ Core Services           34 pts   🟢 On Track            │
│ Authentication          21 pts   🟡 At Risk             │
│ Data Layer              55 pts   🔴 Blocked             │
│ Documentation           13 pts   ⏸ On Hold              │
└────────────────────────────────────────────────────────┘
```

## 7.2. Tela de Feature

```
Título:
[Data Layer Migration]

Descrição:
[Refatorar camada de dados para suportar streaming e GraphQL...]

Squad:
[Beta ▼]

Estimativa:
[55 pontos]  | Revisado por: Tech Lead

Dependências:
[DB Migration] [GraphQL Schema]

Riscos:
- Performance incerta
- Reescrita completa do schema

Critérios de Aceite:
✓ Testes integrados passando
✓ Compatibilidade com API v2
✓ Benchmark superior ao baseline
```

---

# 🔗 8. Dependências

Tela especializada para visualizar bloqueios.

## 8.1. Visão de Mapa (Graph)

```
API v3
  ├── Webhooks System
  │      └── Mobile Push v2
  └── GraphQL Layer
         └── Analytics Dashboard
```

Cores:

- 🟢 Sem risco  
- 🟡 Dependência suave  
- 🔴 Bloqueio crítico  

---

# 🗺️ 9. Roadmap Timeline

Tela de altíssima visibilidade para CPO, diretoria e PMs.

```
Jan     Feb     Mar     |  Apr     May     Jun
───────────────────────────────────────────────
CRM:
  API v3 ████████████████████████ Committed
  Webhooks ███████ Targeted

Mobile:
  Offline Mode ████████████████ Committed
  Biometrics       ████████ Targeted
  AR Features             █████████ Aspiration

Analytics:
  Dashboard v2 █████████████ Committed
  ML Insights            ██████████ Targeted
```

Elementos UX:

- Arrastar e soltar épicos e features  
- Mudar tamanho  
- Editar status via botão flutuante  
- Modo apresentação (foco no visual)  
- Zoom in/out  

---

# ⏱️ 10. Capacidade por Squad

Tela dinâmica.

```
┌──────────────────────────────────────────────────────┐
│ Squad Alpha – Capacidade 360 pts                     │
├──────────────────────────────────────────────────────┤
│ Alocado: 342 pts                                      │
│ Disponível: 18 pts (95% uso)                          │
│ Features por quarter:                                 │
│ • API v3 – 210 pts                                    │
│ • Webhooks – 80 pts                                   │
│ • Tech Debt – 52 pts                                  │
└──────────────────────────────────────────────────────┘
```

---

# 🎛 11. Simulador de Cenários (avançado)

## 11.1. Tela

```
Cenário: [Growth Focus ▼]  [Salvar] [Comparar]

Capacidade:
Squad Alpha   [-10%] ████████░░ [+10%] (360 → 396 pts)
Squad Beta    [-25%] ██████░░░ [+10%] (300 → 225 pts)
Squad Gamma   [-15%] █████░░░░ [+10%]

Opções avançadas:
☑ Incluir contractors (+15% capacidade)
☑ Considerar férias automaticamente
☑ Incluir buffer de risco (10%)
```

## 11.2. Recalcular

```
Com ajustes:
✓ API v3 cabe no quarter  
⚠ Analytics Dashboard atrasa 2 semanas  
✓ Mobile Offline volta ao escopo completo  
```

---

# 📜 12. Compromisso Trimestral (Commitment)

Tela final para fechar o planejamento.

```
📜 Commitment Q1 2026

Épicos Committed:
✓ API v3 Migration
✓ Mobile Offline
✓ Dashboard v2

Épicos Targeted:
• Webhooks
• GraphQL Layer

Épicos Aspirational:
• ML Insights
• AR Features

Assinam:
PMs, Tech Leads, CPO
```

---

# 🧱 13. Tabelas de Banco (modelo estendido)

## 13.1. Tabela Epico

| Campo | Tipo |
|--------|--------|
| id_epico | UUID |
| titulo | varchar |
| descricao | text |
| produto_id | FK |
| squad_id | FK |
| status | enum(planned, in_progress, at_risk, done, on_hold) |
| health | enum(green, yellow, red) |
| quarter | varchar |
| criterios_aceite | text |
| riscos | text |
| criado_em | datetime |
| atualizado_em | datetime |

---

## 13.2. Tabela Feature

| Campo | Tipo |
|--------|--------|
| id_feature | UUID |
| id_epico | FK |
| titulo | varchar |
| descricao | text |
| pontos | int |
| status | enum |
| dependencias_json | json |
| criterios_aceite | text |
| criado_em | datetime |

---

## 13.3. Tabela Dependencia

| Campo | Tipo |
|--------|--------|
| id_dependencia | UUID |
| id_feature_bloqueada | FK |
| id_feature_bloqueadora | FK |
| tipo | enum(hard, soft, recurso) |
| risco | enum(alto, medio, baixo) |
| criado_em | datetime |

---

## 13.4. Tabela Capacity

| Campo | Tipo |
|--------|--------|
| id_squad | FK |
| quarter | varchar |
| capacidade_total | int |
| capacidade_disponivel | int |
| capacidade_usada | int |

---

# 🔍 14. Heurísticas Inteligentes do Sistema

- IA sugere prioridades baseadas em impacto × esforço × histórico  
- IA detecta atraso e recalcula automaticamente health score  
- IA sugere dependências escondidas  
- IA constrói first draft do roadmap  

---

# 🧭 15. Critérios de Sucesso

- Nenhum quarter fecha com mais de 110% de capacidade  
- 100% dos épicos possuem critérios de aceite  
- Roadmap atualizado semanalmente automaticamente  
- Atrasos detectados antes de virar problema crítico  

---

# 📦 Próximo módulo
## **Módulo 5 – Documentação de Produto (PRD, BRD, RFC, Specs, Release Notes)**  
Posso gerar agora se desejar.

