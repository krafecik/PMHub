# Módulo 1 – Captura e Entrada de Demandas  
Primeira etapa do fluxo: tudo o que entra na esteira de Produto nasce aqui.  
Foco total em **UX/UI**, **fluidez**, **baixa fricção** e **estruturação mínima**.

---

# 1. Objetivo do Módulo
Centralizar todas as demandas (ideias, problemas, oportunidades, solicitações internas, insights) em um único sistema, permitindo:

- Captura rápida (modo rápido)
- Registro completo (modo avançado)
- Classificação inicial simples
- Organização por produto, tipo, origem e responsável
- Base estruturada para triagem, discovery e roadmap

---

# 2. Personas

## **2.1. PM – Product Manager**
- Registra demandas após reuniões, análises e insights.
- Precisa velocidade + organização.

## **2.2. Stakeholder Interno**
- Diretoria, Vendas, CS, Suporte.
- Deve ter um fluxo simplificado.

## **2.3. CPO**
- Visão macro do que está entrando.
- Precisa filtros, métricas e rápida identificação de gargalos.

## **2.4. Cliente (Opcional)**
- Acesso restrito para abertura de solicitações.

---

# 3. Princípios de UX/UI

1. **Botão global “+ Nova Demanda”** sempre disponível.  
2. **Captura em 30 segundos** (modo rápido).
3. **Autosave automático** a cada 5 segundos.
4. **Campos avançados colapsados por padrão**.
5. **Busca inteligente com tolerância a erros**.
6. **Tooltips e microcopy amigável** explicando cada campo.
7. **Drawer lateral** para visualizar detalhes sem perder contexto.
8. **Suporte a anexos (PDF, imagens, vídeos, prints)**.

---

# 4. Navegação Geral

```
Menu Lateral:
  📥 Demandas
      ▸ Todas
      ▸ Minhas
      ▸ Rascunhos
      ▸ Arquivadas
```

Botão flutuante (canto inferior direito):  
**[ + Nova Demanda ]**

---

# 5. Tela: Todas as Demandas

## **5.1. Estrutura**

```
┌──────────────────────────────────────────────────────────────┐
│ 📥 Demandas                                  [+ Nova]        │
│ Buscar: [________________]  Tipo [▼]  Produto [▼] Origem [▼] │
│ Filtros rápidos: [Status] [Responsável] [Período] [Tags]     │
└──────────────────────────────────────────────────────────────┘

Lista:
┌────┬─────────────┬─────────┬──────────┬──────────┬───────────┐
│ ID │ Título      │ Tipo    │ Produto  │ Origem   │ Status    │
├────┼─────────────┼─────────┼──────────┼──────────┼───────────┤
│ 31 │ Erro NFe…   │ Problema│ Fiscal   │ Suporte  │ Novo      │
│ 18 │ Integração… │ Ideia   │ ERP Core │ Diretoria│ Novo      │
└────┴─────────────┴─────────┴──────────┴──────────┴───────────┘
```

## **5.2. Funcionalidades Key UX**

- Clicar em uma linha → abre painel lateral (drawer).
- Tags são clicáveis → filtram automaticamente.
- Ordenações: mais recente, urgência, tipo, produto.
- Skeletons para carregamento.
- Empty state com tutorial e botão “Criar primeira demanda”.

---

# 6. Modal: Criação Rápida de Demanda

```
┌────────────────────────────────────────────────────┐
│ + Nova Demanda                                  [X] │
├────────────────────────────────────────────────────┤
│ Tipo *: ● Ideia ○ Problema ○ Oportunidade ○ Outro  │
│ Título *: [_____________________________]          │
│ Produto *: [ERP Core ▼]                           │
│ Origem: [Selecione ▼]                             │
│ Descrição rápida:                                  │
│ [______________________________________________]  │
│                                                    │
│ [Anexar arquivo]                                   │
│                                                    │
│ [Salvar rascunho]     [ Criar Demanda ]            │
└────────────────────────────────────────────────────┘
```

### Regras:

- Requer apenas **3 campos obrigatórios**: Tipo, Título, Produto.
- Salva em **status = “Novo”**.
- Exibe toast:
  - “Demanda #32 criada com sucesso. [Abrir detalhe]”

---

# 7. Tela: Detalhe da Demanda (Drawer Lateral)

```
┌───────────────────────────────────────────────────────────┐
│ #32 – Integração com sistema fiscal Y        [⋮] [X]      │
│ Tipo: Oportunidade | Status: Novo                         │
│ Produto: ERP Core | Origem: Diretoria                     │
│ Responsável: [João Silva ▼]                               │
│ Criado por: CPO | 12/11/2025                               │
├───────────────────────────────────────────────────────────┤

Aba: Resumo | Contexto | Histórico

Resumo:
Título:
[Integração com sistema Y para automatizar NFe]

Descrição:
[Texto rich-text]

Campos:
Segmento: [Fabricantes médios]
Impacto percebido: [Alta]
Urgência: [Média]
Tags: [Fiscal] [Integração] [+]

Anexos:
📄 escopo.pdf    🖼️ erro_print.png

Comentários:
[Comentário Card]
[Adicionar comentário…]
└───────────────────────────────────────────────────────────┘
```

### Ações:
- Mover para Triagem
- Atribuir PM
- Editar
- Duplicar
- Arquivar

---

# 8. Tela: Edição Completa

```
┌────────────────────────────────────────────────────────────┐
│ 📝 Editar Demanda #32                        [Salvar]       │
│ Status: Novo | [Mover para Triagem]                        │
├────────────────────────────────────────────────────────────┤
│ Tipo *                 | Título *                          │
│ Produto *              | Descrição detalhada (rich-text)   │
│ Origem                 | Impacto                           │
│ Responsável            | Urgência                          │
│ Tags                   | Clientes afetados                 │
│ Anexos                 | Frequêcia                         │
└────────────────────────────────────────────────────────────┘
```

### UX Rules:
- Autosave.
- Alertas ao sair sem salvar.
- Sessões colapsáveis: “Impacto”, “Riscos”, “Clientes”.

---

# 9. Tabelas Relacionadas (Banco de Dados)

A seguir, todas as tabelas necessárias para este módulo.

---

## **9.1. Tabela: Produto**
Representa cada módulo da plataforma (ERP, Fiscal, CRM, Produção, etc.)

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id_produto | UUID | Identificador |
| nome | varchar(120) | Nome do produto |
| descricao | text | Opcional |
| ativo | boolean | Produto ativo/inativo |
| criado_em | datetime | Timestamp |
| atualizado_em | datetime | Timestamp |

---

## **9.2. Tabela: Usuario**
Usuários internos (PM, CPO, diretoria), ou externos (clientes).

| Campo | Tipo | Descrição |
|--------|-------|-----------|
| id_usuario | UUID |
| nome | varchar(120) |
| email | varchar(180) |
| cargo | varchar(80) |
| tipo | enum(INTERNO, CLIENTE) |
| ativo | boolean |
| criado_em | datetime |
| atualizado_em | datetime |

---

## **9.3. Tabela: Demanda**

| Campo | Tipo | Descrição |
|--------|-------|-----------|
| id_demanda | UUID | Identificador |
| titulo | varchar(255) | Obrigatório |
| descricao | text | Rich-text |
| tipo | enum(IDEIA, PROBLEMA, OPORTUNIDADE, OUTRO) |
| id_produto | FK → Produto |
| origem | enum(CLIENTE, SUPORTE, DIRETORIA, CS, VENDAS, INTERNO) |
| origem_detalhe | varchar(255) | Nome do cliente/área |
| id_responsavel | FK → Usuario |
| prioridade | enum(BAIXA, MEDIA, ALTA, CRITICA) |
| status | enum(NOVO, RASCUNHO, TRIAGEM, ARQUIVADO) |
| criado_por | FK → Usuario |
| criado_em | datetime |
| atualizado_em | datetime |

---

## **9.4. Tabela: Tag**

| Campo | Tipo |
|--------|--------|
| id_tag | UUID |
| nome | varchar(50) |

---

## **9.5. Tabela: DemandaTag (N:N)**

| Campo | Tipo |
|--------|--------|
| id_demanda | FK |
| id_tag | FK |

---

## **9.6. Tabela: Anexo**

| Campo | Tipo |
|--------|--------|
| id_anexo | UUID |
| id_demanda | FK |
| arquivo_url | varchar(255) |
| tipo_mime | varchar(80) |
| criado_em | datetime |

---

## **9.7. Tabela: Comentario**

| Campo | Tipo |
|--------|--------|
| id_comentario | UUID |
| id_demanda | FK |
| id_usuario | FK |
| texto | text |
| criado_em | datetime |

---

# 10. Fluxos Principais

## **10.1. Captura Rápida**
1. Clica + Nova Demanda → Modal rápido.
2. Preenche 3 campos.
3. Criado com status “Novo”.

## **10.2. Detalhamento**
1. Clica em “Avançar para detalhar”.
2. Sistema cria Rascunho.
3. Usuário preenche dados completos.

## **10.3. Atribuição**
- PM ou CPO atribui responsável.
- Pode aplicar regras automatizadas (por produto).

---

# 11. Critérios de Sucesso
- Criar demanda em até **30 segundos**.
- PM encontra qualquer item via busca inteligente.
- Stakeholders conseguem registrar demandas sem treinamento.
- Zero demandas sem produto / tipo / título.

---

# 12. Próximo Módulo
O próximo módulo será:

## **Módulo 2 – Triagem e Qualificação das Demandas**

