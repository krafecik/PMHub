# Módulo 2 – Triagem e Qualificação das Demandas  
### Documento expandido e profundamente detalhado (UX/UI + modelagem + fluxos + comportamentos + regras de negócio)

A triagem é o **coração operacional do PM**.  
É onde demandas brutas viram **insumos qualificados** — e onde você, como CPO, garante que só boas entradas seguem para discovery.

Este documento foi ampliado para:

- trazer mais profundidade de UX  
- incluir fluxos comportamentais mais realistas  
- desenhar microinterações completas  
- mapear tabelas de apoio  
- prever casos extremos  
- detalhar heurísticas de decisão  
- incluir estados visuais, templates, tooltips, automações e práticas avançadas  

---

# 🎯 1. Objetivo do Módulo

Transformar cada demanda recém-chegada em um item:

- **compreendido**
- **classificado**
- **qualificado**
- **encaminhado corretamente**

Garantindo que o Discovery só receba itens **bem fundamentados** e evitando desperdício de tempo.

---

# 👤 2. Personas e Necessidades

## 🧑‍💼 Product Manager (PM)
- Precisa processar dezenas de demandas por semana.  
- Deseja atalhos, bulk actions e clareza visual.  
- Quer evitar retrabalho (duplicações).  
- Deseja certeza antes de enviar algo ao Discovery.  

## 🧑‍✈️ CPO
- Quer garantias de qualidade na entrada do processo.  
- Deseja visões macro instantâneas.  
- Acompanha SLA de triagem.  

## 🧑‍💻 Stakeholders internos
- Recebem pedidos de esclarecimentos  
- Precisam responder rápido  
- Devem ser guiados para fornecer informações úteis  

---

# 🧩 3. Princípios de UX/UI aplicados ao módulo

1. **Triagem deve ser rápida, objetiva e previsível**  
2. **Toda informação necessária deve estar à vista no card — sem abrir nada**  
3. **Cores e ícones indicam status e urgência**  
4. **Bulk actions devem permitir triagem massiva**  
5. **Sistema deve sugerir caminhos** (ex: “parece duplicado”)  
6. **Feedback imediato em cada ação** (toasts + alterações visuais)  
7. **Triagem é feita em modo fluxo** (como um “modo foco para PM”)  
8. **Navegação lateral entre cards (próximo/anterior)**  
9. **Validações inteligentes** (ex: impacto obrigatório antes de enviar ao discovery)  

---

# 🗂️ 4. Navegação Geral do Módulo

Menu lateral:

```
Demandas
    ▶ Triagem
    ▶ Pendentes
    ▶ Aguardando Informações
    ▶ Duplicadas
    ▶ Arquivadas
```

Atalho no topo:

```
[Modo Foco de Triagem]
```

---

# 🖥️ 5. Tela Principal: Painel de Triagem

## 5.1. Estrutura geral

```
┌────────────────────────────────────────────────────────────────────┐
│ 🧹 Triagem de Demandas                                 [Configurar] │
│ Status: 27 pendentes | SLA médio: 14h | Duplicadas sugeridas: 3     │
├────────────────────────────────────────────────────────────────────┤
│ Buscar: [Buscar por título, ID, cliente...] 🔍                      │
│ Tipo [▼] Produto [▼] Origem [▼] Prioridade [▼] Período [▼]          │
│ Tags [▼] Responsável [▼]                                            │
│                                                                   │
│ Visão: [Cards] [Lista densa] [Kanban]                             │
├────────────────────────────────────────────────────────────────────┤
│ GRID DE CARDS                                                     │
└────────────────────────────────────────────────────────────────────┘
```

---

## 5.2. Card Completo (versão estendida)

```
┌──────────────────────────────────────────────────────────────┐
│ #32 • Integração com sistema Y                      Fiscal    │
│ Origem: Diretoria               Tipo: Oportunidade           │
│ Produto: ERP Core               Criado há: 2 dias            │
│ Reportado por: João (Diretoria)                             │
│ Tags: [Fiscal] [Integração]                                 │
├──────────────────────────────────────────────────────────────┤
│ Resumo: “Diretoria pediu integração com emissor fiscal Y…”   │
│ Painel de Sinais: ⛔ Falta evidência • ⚠️ Impreciso • 🟢 Útil │
├──────────────────────────────────────────────────────────────┤
│ SUGESTÕES DO SISTEMA                                          │
│ • Possível duplicada de #12 e #07                             │
│ • Problemas relacionados em Discovery: #D16, #D22             │
│ • Similar a "Integração emissor Z" implementada em 2023       │
├──────────────────────────────────────────────────────────────┤
│ Ações rápidas:                                                 │
│ [✓ Enviar para Discovery]   [🛈 Solicitar Info]                 │
│ [📁 Arquivar]               [💡 Virar Épico]                   │
│ [🔗 Marcar como Duplicada]   [⇄ Reatribuir]                    │
└──────────────────────────────────────────────────────────────┘
```

---

# 🧠 6. Mecanismos Inteligentes Incluídos

## 6.1. Detecção de duplicações (IA leve / fuzzy search)
O sistema analisa:

- título  
- descrição  
- tags  
- similaridade textual  
- produto envolvido  
- origem  

E gera:

```
⚠️ 87% de similaridade com demanda #12
```

---

## 6.2. Sugestão de encaminhamento

Exemplo:

- **Baixa complexidade + alta urgência** → Sugerir épico direto  
- **Pouca descrição + ticket de suporte** → Sugerir solicitar informações  
- **Relacionada a discovery ativo** → Sugerir vincular  

---

## 6.3. Regras automatizadas configuráveis

Exemplos:

- Se **origem = Suporte** e **tipo = Problema** → marcar urgência padrão: Média  
- Se **tipo = Oportunidade** e **origem = Diretoria** → atribuir PM automático  
- Se **produto = Fiscal** → abrir campo obrigatório de CFOP/Natureza  

---

# 🔍 7. Tela: Detalhe Expandido da Demanda (modo Triagem)

```
┌────────────────────────────────────────────────────────────┐
│ #32 – Triagem                                   [X]        │
│ Tipo: Oportunidade | Produto: ERP Core | Origem: Diretoria │
│ Criado em: 12/11/2025 | Reportado por: João (Diretoria)    │
│ Status atual: PENDENTE_TRIAGEM                              │
├────────────────────────────────────────────────────────────┤

🔎 CHECKLIST DE TRIAGEM
☐ Descrição clara  
☐ Alinhado com produto correto  
☐ Evidências fornecidas  
☐ Impacto definido  
☐ Urgência definida  
☐ Cliente citado (se aplicável)  
☐ Não há duplicações  

📌 RESUMO
[Texto rich-text]

📊 AVALIAÇÕES (obrigatório antes de enviar ao Discovery)
Impacto: [Alta ▼]
Urgência: [Média ▼]
Complexidade Estimada: [Baixa/Média/Alta]

📎 ANEXOS
[file1.pdf] [img_erro.png]

💬 COMENTÁRIOS

🧠 SUGESTÕES DO SISTEMA
- 2 duplicadas possíveis
- 3 discovery relacionados
- histórico de soluções parecidas

─────────────────────────────────────────────────────────────

AÇÕES:
[✓ Enviar para Discovery] (primário)
[🛈 Solicitar Informações]
[📁 Arquivar]
[🔗 Marcar como Duplicada]
[⇄ Reatribuir PM]
└────────────────────────────────────────────────────────────┘
```

---

# 🔗 8. Estados da Triagem e Transições

```
PENDENTE_TRIAGEM
    ↓ revisar
AGUARDANDO_INFO
    ↓ resposta enviada
RETOMADO_TRIAGEM
    ↓ decidir
PRONTO_DISCOVERY → módulo 3
    ↓ caso especial
EVOLUIU_EPICO → Roadmap
    ↓ caso arquivado
ARQUIVADO
    ↓ caso duplicado
DUPLICADO → vinculado a demanda original
```

---

# 🔄 9. Fluxos de Trabalho (super detalhados)

## 9.1. Fluxo: Enviar para Discovery (com validações)

```
Usuário clica ✔ Enviar para Discovery
    ↓
Verifica checklist preenchido
    ↓
Verifica impacto/urgência/complexidade
    ↓
Sistema valida anexos (se obrigatórios para tipo)
    ↓
Usuário confirma
    ↓
status_demanda = PRONTO_DISCOVERY
cria item em Discovery vinculado
    ↓
Toast: “Enviado ao Discovery. Item #D-32 criado.”
    ↓
Notifica PM de Discovery
```

---

## 9.2. Fluxo: Solicitar informações

```
Clicar “Solicitar Info”
Mostrar modal:
“O que precisa ser esclarecido?”
↓
PM escreve orientações estruturadas
↓
Sistema envia email/notificação ao solicitante
↓
status_demanda = AGUARDANDO_INFO
↓
Interface marca card com badge amarelo
```

---

## 9.3. Fluxo: Marcar como duplicada

```
Clicar “Marcar como Duplicada”
↓
Sistema sugere duplicadas
↓
PM seleciona 1 demanda
↓
status = DUPLICADO
demanda.id_original = selecionada
↓
Toast: “Vinculada como duplicada de #XX”
↓
Esconde card da triagem
```

---

## 9.4. Fluxo: Evoluir demanda para épico (atalho PM sênior / CPO)

Quando a demanda for enorme e claramente um projeto.

```
Clicar “Virar Épico”
↓
Modal:
    Nome do Épico
    Produto
    Objetivo
    Hipóteses iniciais
↓
Criar épico
status_demanda = EVOLUIU_EPICO
Vincular demanda ao épico
```

---

# 🧱 10. Tabelas de Banco (versão expandida)

## 10.1. Alterações na tabela Demanda

| Campo | Tipo | Descrição |
|--------|--------|-----------|
| status_triagem | enum | pendente, aguardando_info, retomado_triagem, pronto_discovery, arquivado, duplicado, evoluiu_epico |
| impacto | enum | BAIXO, MEDIO, ALTO, CRITICO |
| urgencia | enum | BAIXA, MEDIA, ALTA |
| complexidade_estimada | enum | BAIXA, MEDIA, ALTA |
| id_demanda_original | FK | usado quando duplicado |
| triado_por | FK | PM responsável |
| triado_em | datetime | timestamp |
| revisoes_triagem | integer | número de rodadas |

---

## 10.2. Tabela: Solicitacao_Info (estendida)

| Campo | Tipo |
|--------|--------|
| id_solicitacao | UUID |
| id_demanda | FK |
| id_pm | FK |
| solicitante | FK (usuário que precisa responder) |
| texto | text |
| anexos | lista |
| prazo | datetime |
| status | enum(pendente, respondido, expirado) |
| criado_em | datetime |
| respondido_em | datetime |

---

## 10.3. Tabela: DuplicatasDemanda

Permite histórico de duplicações (opcional).

| Campo | Tipo |
|--------|--------|
| id | UUID |
| id_demanda | FK |
| id_demanda_original | FK |
| similaridade | float |
| criado_em | datetime |

---

## 10.4. Tabela: RegrasAutomacaoTriagem

| Campo | Tipo |
|--------|--------|
| id_regra | UUID |
| condicao_json | text (JSON com condições) |
| acao_json | text |
| ativo | boolean |
| criado_por | FK |
| criado_em | datetime |

---

# 📊 11. Indicadores embutidos (sem módulo de métricas ainda)

- SLA médio de triagem  
- % de demandas duplicadas  
- Tempo em `AGUARDANDO_INFO`  
- Quantidade de demandas arquivadas  
- % de itens que seguem para discovery  

---

# 🧭 12. Critérios de Sucesso do Módulo

- PM triando 30+ itens em 15 minutos  
- 90% das demandas com impacto/urgência definidos  
- Zero demandas indo ao discovery sem contexto mínimo  
- Redução de duplicações por similaridade textual  


