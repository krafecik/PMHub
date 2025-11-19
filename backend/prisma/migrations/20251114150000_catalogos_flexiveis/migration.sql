-- Migration: Introdução de catálogos configuráveis

CREATE TABLE "CatalogCategory" (
    "id" BIGSERIAL PRIMARY KEY,
    "tenant_id" BIGINT NOT NULL,
    "slug" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "escopo_produto" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "CatalogCategory_tenant_id_slug_key" UNIQUE ("tenant_id", "slug"),
    CONSTRAINT "CatalogCategory_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "CatalogCategory_tenant_idx" ON "CatalogCategory" ("tenant_id");

CREATE TABLE "CatalogItem" (
    "id" BIGSERIAL PRIMARY KEY,
    "tenant_id" BIGINT NOT NULL,
    "category_id" BIGINT NOT NULL,
    "produto_id" BIGINT,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "descricao" TEXT,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "ativo" BOOLEAN NOT NULL DEFAULT TRUE,
    "metadados" JSONB NOT NULL DEFAULT '{}'::jsonb,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    "deleted_at" TIMESTAMPTZ,
    CONSTRAINT "CatalogItem_tenant_id_category_id_slug_key" UNIQUE ("tenant_id", "category_id", "slug"),
    CONSTRAINT "CatalogItem_category_id_fkey"
        FOREIGN KEY ("category_id") REFERENCES "CatalogCategory"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatalogItem_tenant_id_fkey"
        FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CatalogItem_produto_id_fkey"
        FOREIGN KEY ("produto_id") REFERENCES "Produto"("id")
        ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE INDEX "CatalogItem_tenant_idx" ON "CatalogItem" ("tenant_id");
CREATE INDEX "CatalogItem_category_idx" ON "CatalogItem" ("category_id");
CREATE INDEX "CatalogItem_produto_idx" ON "CatalogItem" ("produto_id");

CREATE OR REPLACE FUNCTION public.slugify(text)
RETURNS text
LANGUAGE SQL
IMMUTABLE
AS $$
  SELECT COALESCE(NULLIF(regexp_replace(lower(trim($1)), '[^a-z0-9]+', '_', 'g'), ''), 'valor_desconhecido');
$$;

-- Novas colunas para Demanda
ALTER TABLE "Demanda"
    ADD COLUMN "tipo_id" BIGINT,
    ADD COLUMN "origem_id" BIGINT,
    ADD COLUMN "prioridade_id" BIGINT,
    ADD COLUMN "status_id" BIGINT;

-- Novas colunas para Triagem
ALTER TABLE "TriagemDemanda"
    ADD COLUMN "status_triagem_id" BIGINT,
    ADD COLUMN "impacto_id" BIGINT,
    ADD COLUMN "urgencia_id" BIGINT,
    ADD COLUMN "complexidade_id" BIGINT;

-- Novas colunas para Discovery
ALTER TABLE "Discovery"
    ADD COLUMN "status_id" BIGINT,
    ADD COLUMN "severidade_id" BIGINT;

-- Novas tabelas auxiliares
CREATE TABLE "DiscoveryIdentificacao" (
    "id" BIGSERIAL PRIMARY KEY,
    "discovery_id" BIGINT NOT NULL,
    "catalog_item_id" BIGINT NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "DiscoveryIdentificacao_discovery_id_catalog_item_id_key"
        UNIQUE ("discovery_id", "catalog_item_id"),
    CONSTRAINT "DiscoveryIdentificacao_discovery_id_fkey"
        FOREIGN KEY ("discovery_id") REFERENCES "Discovery"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscoveryIdentificacao_catalog_item_id_fkey"
        FOREIGN KEY ("catalog_item_id") REFERENCES "CatalogItem"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DiscoveryIdentificacao_item_idx" ON "DiscoveryIdentificacao" ("catalog_item_id");

CREATE TABLE "DiscoveryPublico" (
    "id" BIGSERIAL PRIMARY KEY,
    "discovery_id" BIGINT NOT NULL,
    "catalog_item_id" BIGINT NOT NULL,
    "criado_em" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT "DiscoveryPublico_discovery_id_catalog_item_id_key"
        UNIQUE ("discovery_id", "catalog_item_id"),
    CONSTRAINT "DiscoveryPublico_discovery_id_fkey"
        FOREIGN KEY ("discovery_id") REFERENCES "Discovery"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "DiscoveryPublico_catalog_item_id_fkey"
        FOREIGN KEY ("catalog_item_id") REFERENCES "CatalogItem"("id")
        ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX "DiscoveryPublico_item_idx" ON "DiscoveryPublico" ("catalog_item_id");

-- Novas colunas para Hipotese
ALTER TABLE "Hipotese"
    ADD COLUMN "impacto_id" BIGINT,
    ADD COLUMN "prioridade_id" BIGINT,
    ADD COLUMN "status_id" BIGINT;

-- Novas colunas para Pesquisa
ALTER TABLE "Pesquisa"
    ADD COLUMN "metodo_id" BIGINT,
    ADD COLUMN "status_id" BIGINT;

-- Novas colunas para Evidencia
ALTER TABLE "Evidencia"
    ADD COLUMN "tipo_id" BIGINT;

-- Novas colunas para Insight
ALTER TABLE "Insight"
    ADD COLUMN "impacto_id" BIGINT,
    ADD COLUMN "confianca_id" BIGINT,
    ADD COLUMN "status_id" BIGINT;

-- Novas colunas para Experimento
ALTER TABLE "Experimento"
    ADD COLUMN "tipo_id" BIGINT,
    ADD COLUMN "status_id" BIGINT;

-- Nova coluna para DecisaoDiscovery
ALTER TABLE "DecisaoDiscovery"
    ADD COLUMN "status_final_id" BIGINT;

-- Criação de categorias por tenant
WITH categories(slug, nome, descricao, escopo_produto) AS (
    VALUES
        ('tipo_demanda', 'Tipos de demanda', 'Classificação das demandas capturadas.', FALSE),
        ('origem_demanda', 'Origens de demanda', 'Fontes internas ou externas das demandas.', FALSE),
        ('prioridade_nivel', 'Prioridade', 'Níveis padrão de prioridade.', FALSE),
        ('status_demanda', 'Status da demanda', 'Ciclo de vida da demanda.', FALSE),
        ('status_triagem', 'Status da triagem', 'Fluxo operacional de triagem.', FALSE),
        ('impacto_nivel', 'Impacto', 'Escala de impacto percebido.', FALSE),
        ('urgencia_nivel', 'Urgência', 'Escala de urgência.', FALSE),
        ('complexidade_nivel', 'Complexidade', 'Escala de complexidade estimada.', FALSE),
        ('status_discovery', 'Status do discovery', 'Estado do discovery.', FALSE),
        ('status_hipotese', 'Status da hipótese', 'Estados da hipótese.', FALSE),
        ('metodo_pesquisa', 'Métodos de pesquisa', 'Abordagens de pesquisa/research.', FALSE),
        ('status_pesquisa', 'Status da pesquisa', 'Etapas da pesquisa.', FALSE),
        ('tipo_evidencia', 'Tipos de evidência', 'Classificação de evidências.', FALSE),
        ('status_insight', 'Status do insight', 'Maturidade do insight.', FALSE),
        ('confianca_nivel', 'Nível de confiança', 'Confiança atribuída aos insights.', FALSE),
        ('tipo_experimento', 'Tipos de experimento', 'Formatos de experimentos.', FALSE),
        ('status_experimento', 'Status do experimento', 'Progresso do experimento.', FALSE),
        ('decisao_discovery', 'Decisão final', 'Resultados possíveis do discovery.', FALSE),
        ('identificacao_origem', 'Como identificado', 'Origem da identificação do problema.', FALSE),
        ('publico_alvo', 'Público afetado', 'Segmentos/públicos impactados.', FALSE)
)
INSERT INTO "CatalogCategory" (tenant_id, slug, nome, descricao, escopo_produto)
SELECT t.id, c.slug, c.nome, c.descricao, c.escopo_produto
FROM "Tenant" t
JOIN categories c ON TRUE
ON CONFLICT ("tenant_id", "slug") DO NOTHING;

-- Helper to insert itens por categoria
WITH tipo_demanda(slug, label, legacy, ordem) AS (
    VALUES
        ('ideia', 'Ideia', 'IDEIA', 0),
        ('problema', 'Problema', 'PROBLEMA', 1),
        ('oportunidade', 'Oportunidade', 'OPORTUNIDADE', 2),
        ('outro', 'Outro', 'OUTRO', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id,
       cc.id,
       v.slug,
       v.label,
       v.ordem,
       TRUE,
       jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'tipo_demanda'
JOIN tipo_demanda v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH origem_demanda(slug, label, legacy, ordem) AS (
    VALUES
        ('cliente', 'Cliente', 'CLIENTE', 0),
        ('suporte', 'Suporte', 'SUPORTE', 1),
        ('diretoria', 'Diretoria', 'DIRETORIA', 2),
        ('cs', 'Customer Success', 'CS', 3),
        ('vendas', 'Vendas', 'VENDAS', 4),
        ('interno', 'Interno', 'INTERNO', 5)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'origem_demanda'
JOIN origem_demanda v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH prioridade(slug, label, legacy, ordem) AS (
    VALUES
        ('baixa', 'Baixa', 'BAIXA', 0),
        ('media', 'Média', 'MEDIA', 1),
        ('alta', 'Alta', 'ALTA', 2),
        ('critica', 'Crítica', 'CRITICA', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'prioridade_nivel'
JOIN prioridade v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH status_demanda(slug, label, legacy, ordem) AS (
    VALUES
        ('novo', 'Novo', 'NOVO', 0),
        ('rascunho', 'Rascunho', 'RASCUNHO', 1),
        ('triagem', 'Triagem', 'TRIAGEM', 2),
        ('arquivado', 'Arquivado', 'ARQUIVADO', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'status_demanda'
JOIN status_demanda v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH status_triagem(slug, label, legacy, ordem) AS (
    VALUES
        ('pendente_triagem', 'Pendente de triagem', 'PENDENTE_TRIAGEM', 0),
        ('aguardando_info', 'Aguardando informações', 'AGUARDANDO_INFO', 1),
        ('retomado_triagem', 'Retomado triagem', 'RETOMADO_TRIAGEM', 2),
        ('pronto_discovery', 'Pronto para discovery', 'PRONTO_DISCOVERY', 3),
        ('evoluiu_epico', 'Evoluiu para épico', 'EVOLUIU_EPICO', 4),
        ('arquivado_triagem', 'Arquivado na triagem', 'ARQUIVADO_TRIAGEM', 5),
        ('duplicado', 'Marcado como duplicado', 'DUPLICADO', 6)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'status_triagem'
JOIN status_triagem v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH impacto(slug, label, legacy, ordem) AS (
    VALUES
        ('baixo', 'Baixo', 'BAIXO', 0),
        ('medio', 'Médio', 'MEDIO', 1),
        ('alto', 'Alto', 'ALTO', 2),
        ('critico', 'Crítico', 'CRITICO', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'impacto_nivel'
JOIN impacto v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH urgencia(slug, label, legacy, ordem) AS (
    VALUES
        ('baixa', 'Baixa', 'BAIXA', 0),
        ('media', 'Média', 'MEDIA', 1),
        ('alta', 'Alta', 'ALTA', 2)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'urgencia_nivel'
JOIN urgencia v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH complexidade(slug, label, legacy, ordem) AS (
    VALUES
        ('baixa', 'Baixa', 'BAIXA', 0),
        ('media', 'Média', 'MEDIA', 1),
        ('alta', 'Alta', 'ALTA', 2)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'complexidade_nivel'
JOIN complexidade v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH status_discovery(slug, label, legacy, ordem) AS (
    VALUES
        ('em_pesquisa', 'Em pesquisa', 'EM_PESQUISA', 0),
        ('validando', 'Validando', 'VALIDANDO', 1),
        ('fechado', 'Fechado', 'FECHADO', 2),
        ('cancelado', 'Cancelado', 'CANCELADO', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'status_discovery'
JOIN status_discovery v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH status_hipotese(slug, label, legacy, ordem) AS (
    VALUES
        ('pendente', 'Pendente', 'PENDENTE', 0),
        ('em_teste', 'Em teste', 'EM_TESTE', 1),
        ('validada', 'Validada', 'VALIDADA', 2),
        ('refutada', 'Refutada', 'REFUTADA', 3),
        ('arquivada', 'Arquivada', 'ARQUIVADA', 4)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'status_hipotese'
JOIN status_hipotese v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH metodo_pesquisa(slug, label, legacy, ordem) AS (
    VALUES
        ('entrevista_guiada', 'Entrevista guiada', 'ENTREVISTA_GUIADA', 0),
        ('entrevista_livre', 'Entrevista livre', 'ENTREVISTA_LIVRE', 1),
        ('survey', 'Survey', 'SURVEY', 2),
        ('focus_group', 'Focus group', 'FOCUS_GROUP', 3),
        ('observacao', 'Observação', 'OBSERVACAO', 4),
        ('teste_usabilidade', 'Teste de usabilidade', 'TESTE_USABILIDADE', 5),
        ('card_sorting', 'Card sorting', 'CARD_SORTING', 6),
        ('diario_uso', 'Diário de uso', 'DIARIO_USO', 7)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'metodo_pesquisa'
JOIN metodo_pesquisa v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH status_pesquisa(slug, label, legacy, ordem) AS (
    VALUES
        ('planejada', 'Planejada', 'PLANEJADA', 0),
        ('em_andamento', 'Em andamento', 'EM_ANDAMENTO', 1),
        ('concluida', 'Concluída', 'CONCLUIDA', 2),
        ('cancelada', 'Cancelada', 'CANCELADA', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'status_pesquisa'
JOIN status_pesquisa v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH tipo_evidencia(slug, label, legacy, ordem) AS (
    VALUES
        ('dados_analytics', 'Dados (analytics)', 'DADOS_ANALYTICS', 0),
        ('print', 'Print', 'PRINT', 1),
        ('video', 'Vídeo', 'VIDEO', 2),
        ('audio', 'Áudio', 'AUDIO', 3),
        ('feedback_usuario', 'Feedback de usuário', 'FEEDBACK_USUARIO', 4),
        ('log_sistema', 'Log de sistema', 'LOG_SISTEMA', 5),
        ('transcricao', 'Transcrição', 'TRANSCRICAO', 6),
        ('resultado_teste', 'Resultado de teste', 'RESULTADO_TESTE', 7),
        ('benchmark', 'Benchmark', 'BENCHMARK', 8),
        ('documento', 'Documento', 'DOCUMENTO', 9)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'tipo_evidencia'
JOIN tipo_evidencia v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH status_insight(slug, label, legacy, ordem) AS (
    VALUES
        ('rascunho', 'Rascunho', 'RASCUNHO', 0),
        ('validado', 'Validado', 'VALIDADO', 1),
        ('refutado', 'Refutado', 'REFUTADO', 2),
        ('em_analise', 'Em análise', 'EM_ANALISE', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'status_insight'
JOIN status_insight v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH confianca(slug, label, legacy, ordem) AS (
    VALUES
        ('baixa', 'Baixa', 'BAIXA', 0),
        ('media', 'Média', 'MEDIA', 1),
        ('alta', 'Alta', 'ALTA', 2),
        ('muito_alta', 'Muito alta', 'MUITO_ALTA', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'confianca_nivel'
JOIN confianca v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH tipo_experimento(slug, label, legacy, ordem) AS (
    VALUES
        ('mvp', 'MVP', 'MVP', 0),
        ('teste_ab', 'Teste A/B', 'TESTE_A_B', 1),
        ('fake_door', 'Fake door', 'FAKE_DOOR', 2),
        ('protótipo', 'Protótipo', 'PROTOTIPO', 3),
        ('feature_toggle', 'Feature toggle', 'FEATURE_TOGGLE', 4)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'tipo_experimento'
JOIN tipo_experimento v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH status_experimento(slug, label, legacy, ordem) AS (
    VALUES
        ('planejado', 'Planejado', 'PLANEJADO', 0),
        ('em_execucao', 'Em execução', 'EM_EXECUCAO', 1),
        ('concluido', 'Concluído', 'CONCLUIDO', 2),
        ('cancelado', 'Cancelado', 'CANCELADO', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'status_experimento'
JOIN status_experimento v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH decisao_discovery(slug, label, legacy, ordem) AS (
    VALUES
        ('aprovado', 'Aprovado', 'APROVADO', 0),
        ('rejeitado', 'Rejeitado', 'REJEITADO', 1),
        ('retomar_depois', 'Retomar depois', 'RETOMAR_DEPOIS', 2),
        ('criar_epico', 'Criar épico', 'CRIAR_EPICO', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo, metadados)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE, jsonb_build_object('legacyValue', v.legacy)
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'decisao_discovery'
JOIN decisao_discovery v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH identificacao(slug, label, ordem) AS (
    VALUES
        ('analytics', 'Analytics', 0),
        ('entrevistas', 'Entrevistas', 1),
        ('suporte', 'Suporte', 2),
        ('pesquisa_quantitativa', 'Pesquisa quantitativa', 3),
        ('pesquisa_qualitativa', 'Pesquisa qualitativa', 4)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'identificacao_origem'
JOIN identificacao v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

WITH publico(slug, label, ordem) AS (
    VALUES
        ('novos_clientes', 'Novos clientes', 0),
        ('clientes_medios', 'Clientes médios', 1),
        ('persona_carlos', 'Persona Carlos', 2),
        ('usuarios_internos', 'Usuários internos', 3)
)
INSERT INTO "CatalogItem" (tenant_id, category_id, slug, label, ordem, ativo)
SELECT t.id, cc.id, v.slug, v.label, v.ordem, TRUE
FROM "Tenant" t
JOIN "CatalogCategory" cc ON cc.tenant_id = t.id AND cc.slug = 'publico_alvo'
JOIN publico v ON TRUE
ON CONFLICT ("tenant_id", "category_id", "slug") DO NOTHING;

-- Atualização das tabelas com os novos IDs
WITH categoria_tipo AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'tipo_demanda'
)
UPDATE "Demanda" d
SET tipo_id = ci.id
FROM categoria_tipo ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE d.tenant_id = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = d.tipo::text;

WITH categoria_origem AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'origem_demanda'
)
UPDATE "Demanda" d
SET origem_id = ci.id
FROM categoria_origem ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE d.tenant_id = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = d.origem::text;

WITH categoria_prioridade AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'prioridade_nivel'
)
UPDATE "Demanda" d
SET prioridade_id = ci.id
FROM categoria_prioridade ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE d.tenant_id = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = d.prioridade::text;

WITH categoria_status_demanda AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'status_demanda'
)
UPDATE "Demanda" d
SET status_id = ci.id
FROM categoria_status_demanda ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE d.tenant_id = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = d.status::text;

WITH categoria_status_triagem AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'status_triagem'
)
UPDATE "TriagemDemanda" td
SET status_triagem_id = ci.id
FROM categoria_status_triagem ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
JOIN "Demanda" d ON d.tenant_id = ct.tenant_id
WHERE d.id = td.demanda_id
  AND ci.metadados ->> 'legacyValue' = td.status_triagem::text;

WITH categoria_impacto AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'impacto_nivel'
)
UPDATE "TriagemDemanda" td
SET impacto_id = ci.id
FROM categoria_impacto ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
JOIN "Demanda" d ON d.tenant_id = ct.tenant_id
WHERE d.id = td.demanda_id
  AND td.impacto IS NOT NULL
  AND ci.metadados ->> 'legacyValue' = td.impacto::text;

WITH categoria_urgencia AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'urgencia_nivel'
)
UPDATE "TriagemDemanda" td
SET urgencia_id = ci.id
FROM categoria_urgencia ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
JOIN "Demanda" d ON d.tenant_id = ct.tenant_id
WHERE d.id = td.demanda_id
  AND td.urgencia IS NOT NULL
  AND ci.metadados ->> 'legacyValue' = td.urgencia::text;

WITH categoria_complexidade AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'complexidade_nivel'
)
UPDATE "TriagemDemanda" td
SET complexidade_id = ci.id
FROM categoria_complexidade ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
JOIN "Demanda" d ON d.tenant_id = ct.tenant_id
WHERE d.id = td.demanda_id
  AND td.complexidade_estimada IS NOT NULL
  AND ci.metadados ->> 'legacyValue' = td.complexidade_estimada::text;

WITH categoria_status_disc AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'status_discovery'
)
UPDATE "Discovery" disc
SET status_id = ci.id
FROM categoria_status_disc ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE disc.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = disc.status::text;

WITH categoria_impacto_disc AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'impacto_nivel'
)
UPDATE "Discovery" disc
SET severidade_id = ci.id
FROM categoria_impacto_disc ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE disc.id_tenant = ct.tenant_id
  AND disc.severidade IS NOT NULL
  AND ci.metadados ->> 'legacyValue' = disc.severidade::text;

WITH categoria_status_hipotese AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'status_hipotese'
)
UPDATE "Hipotese" h
SET status_id = ci.id
FROM categoria_status_hipotese ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE h.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = h.status::text;

WITH categoria_impacto_hipotese AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'impacto_nivel'
)
UPDATE "Hipotese" h
SET impacto_id = ci.id
FROM categoria_impacto_hipotese ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE h.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = h.impacto_esperado::text;

WITH categoria_prioridade_hipotese AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'prioridade_nivel'
)
UPDATE "Hipotese" h
SET prioridade_id = ci.id
FROM categoria_prioridade_hipotese ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE h.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = h.prioridade::text;

WITH categoria_metodo AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'metodo_pesquisa'
)
UPDATE "Pesquisa" p
SET metodo_id = ci.id
FROM categoria_metodo ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE p.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = p.metodo::text;

WITH categoria_status_pesquisa AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'status_pesquisa'
)
UPDATE "Pesquisa" p
SET status_id = ci.id
FROM categoria_status_pesquisa ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE p.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = p.status::text;

WITH categoria_tipo_evidencia AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'tipo_evidencia'
)
UPDATE "Evidencia" e
SET tipo_id = ci.id
FROM categoria_tipo_evidencia ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE e.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = e.tipo::text;

WITH categoria_status_insight AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'status_insight'
)
UPDATE "Insight" i
SET status_id = ci.id
FROM categoria_status_insight ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE i.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = i.status::text;

WITH categoria_impacto_insight AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'impacto_nivel'
)
UPDATE "Insight" i
SET impacto_id = ci.id
FROM categoria_impacto_insight ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE i.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = i.impacto::text;

WITH categoria_confianca_insight AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'confianca_nivel'
)
UPDATE "Insight" i
SET confianca_id = ci.id
FROM categoria_confianca_insight ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE i.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = i.confianca::text;

WITH categoria_tipo_experimento AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'tipo_experimento'
)
UPDATE "Experimento" e
SET tipo_id = ci.id
FROM categoria_tipo_experimento ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE e.id_tenant = ct.tenant_id
  AND ci.slug = slugify(e.tipo);

WITH categoria_status_experimento AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'status_experimento'
)
UPDATE "Experimento" e
SET status_id = ci.id
FROM categoria_status_experimento ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE e.id_tenant = ct.tenant_id
  AND ci.metadados ->> 'legacyValue' = e.status::text;

WITH categoria_decisao AS (
    SELECT cc.id, cc.tenant_id
    FROM "CatalogCategory" cc
    WHERE cc.slug = 'decisao_discovery'
)
UPDATE "DecisaoDiscovery" dd
SET status_final_id = ci.id
FROM categoria_decisao ct
JOIN "CatalogItem" ci ON ci.category_id = ct.id AND ci.tenant_id = ct.tenant_id
WHERE dd.id_tenant = ct.tenant_id
  AND ci.slug = slugify(dd.status_final);

-- Migrar arrays para tabelas auxiliares
INSERT INTO "DiscoveryIdentificacao" (discovery_id, catalog_item_id, criado_em)
SELECT d.id,
       ci.id,
       NOW()
FROM "Discovery" d
JOIN LATERAL unnest(coalesce(d.como_identificado, ARRAY[]::text[])) AS lista(valor) ON TRUE
JOIN "CatalogCategory" cc ON cc.slug = 'identificacao_origem' AND cc.tenant_id = d.id_tenant
JOIN "CatalogItem" ci ON ci.category_id = cc.id AND ci.tenant_id = d.id_tenant AND ci.slug = slugify(lista.valor)
ON CONFLICT ("discovery_id", "catalog_item_id") DO NOTHING;

INSERT INTO "DiscoveryPublico" (discovery_id, catalog_item_id, criado_em)
SELECT d.id,
       ci.id,
       NOW()
FROM "Discovery" d
JOIN LATERAL unnest(coalesce(d.publico_afetado, ARRAY[]::text[])) AS lista(valor) ON TRUE
JOIN "CatalogCategory" cc ON cc.slug = 'publico_alvo' AND cc.tenant_id = d.id_tenant
JOIN "CatalogItem" ci ON ci.category_id = cc.id AND ci.tenant_id = d.id_tenant AND ci.slug = slugify(lista.valor)
ON CONFLICT ("discovery_id", "catalog_item_id") DO NOTHING;

-- Garantir que nenhum registro permaneça sem referência
UPDATE "Experimento" SET tipo_id = ci.id
FROM "CatalogCategory" cc
JOIN "CatalogItem" ci ON ci.category_id = cc.id
WHERE cc.slug = 'tipo_experimento'
  AND "Experimento".tipo_id IS NULL
  AND ci.slug = 'mvp'
  AND ci.tenant_id = "Experimento".id_tenant;

UPDATE "Experimento" SET status_id = ci.id
FROM "CatalogCategory" cc
JOIN "CatalogItem" ci ON ci.category_id = cc.id
WHERE cc.slug = 'status_experimento'
  AND "Experimento".status_id IS NULL
  AND ci.slug = 'planejado'
  AND ci.tenant_id = "Experimento".id_tenant;

UPDATE "DecisaoDiscovery" SET status_final_id = ci.id
FROM "CatalogCategory" cc
JOIN "CatalogItem" ci ON ci.category_id = cc.id
WHERE cc.slug = 'decisao_discovery'
  AND "DecisaoDiscovery".status_final_id IS NULL
  AND ci.slug = 'aprovado'
  AND ci.tenant_id = "DecisaoDiscovery".id_tenant;

-- Definir colunas como NOT NULL após migração
ALTER TABLE "Demanda"
    ALTER COLUMN "tipo_id" SET NOT NULL,
    ALTER COLUMN "origem_id" SET NOT NULL,
    ALTER COLUMN "prioridade_id" SET NOT NULL,
    ALTER COLUMN "status_id" SET NOT NULL;

ALTER TABLE "TriagemDemanda"
    ALTER COLUMN "status_triagem_id" SET NOT NULL;

ALTER TABLE "Discovery"
    ALTER COLUMN "status_id" SET NOT NULL;

ALTER TABLE "Hipotese"
    ALTER COLUMN "impacto_id" SET NOT NULL,
    ALTER COLUMN "prioridade_id" SET NOT NULL,
    ALTER COLUMN "status_id" SET NOT NULL;

ALTER TABLE "Pesquisa"
    ALTER COLUMN "metodo_id" SET NOT NULL,
    ALTER COLUMN "status_id" SET NOT NULL;

ALTER TABLE "Evidencia"
    ALTER COLUMN "tipo_id" SET NOT NULL;

ALTER TABLE "Insight"
    ALTER COLUMN "impacto_id" SET NOT NULL,
    ALTER COLUMN "confianca_id" SET NOT NULL,
    ALTER COLUMN "status_id" SET NOT NULL;

ALTER TABLE "Experimento"
    ALTER COLUMN "tipo_id" SET NOT NULL,
    ALTER COLUMN "status_id" SET NOT NULL;

ALTER TABLE "DecisaoDiscovery"
    ALTER COLUMN "status_final_id" SET NOT NULL;

-- Adicionar chaves estrangeiras
ALTER TABLE "Demanda"
    ADD CONSTRAINT "Demanda_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Demanda_origem_id_fkey" FOREIGN KEY ("origem_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Demanda_prioridade_id_fkey" FOREIGN KEY ("prioridade_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Demanda_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "CatalogItem"("id");

ALTER TABLE "TriagemDemanda"
    ADD CONSTRAINT "TriagemDemanda_status_triagem_id_fkey" FOREIGN KEY ("status_triagem_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "TriagemDemanda_impacto_id_fkey" FOREIGN KEY ("impacto_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "TriagemDemanda_urgencia_id_fkey" FOREIGN KEY ("urgencia_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "TriagemDemanda_complexidade_id_fkey" FOREIGN KEY ("complexidade_id") REFERENCES "CatalogItem"("id");

ALTER TABLE "Discovery"
    ADD CONSTRAINT "Discovery_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Discovery_severidade_id_fkey" FOREIGN KEY ("severidade_id") REFERENCES "CatalogItem"("id");

ALTER TABLE "Hipotese"
    ADD CONSTRAINT "Hipotese_impacto_id_fkey" FOREIGN KEY ("impacto_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Hipotese_prioridade_id_fkey" FOREIGN KEY ("prioridade_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Hipotese_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "CatalogItem"("id");

ALTER TABLE "Pesquisa"
    ADD CONSTRAINT "Pesquisa_metodo_id_fkey" FOREIGN KEY ("metodo_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Pesquisa_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "CatalogItem"("id");

ALTER TABLE "Evidencia"
    ADD CONSTRAINT "Evidencia_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "CatalogItem"("id");

ALTER TABLE "Insight"
    ADD CONSTRAINT "Insight_impacto_id_fkey" FOREIGN KEY ("impacto_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Insight_confianca_id_fkey" FOREIGN KEY ("confianca_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Insight_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "CatalogItem"("id");

ALTER TABLE "Experimento"
    ADD CONSTRAINT "Experimento_tipo_id_fkey" FOREIGN KEY ("tipo_id") REFERENCES "CatalogItem"("id"),
    ADD CONSTRAINT "Experimento_status_id_fkey" FOREIGN KEY ("status_id") REFERENCES "CatalogItem"("id");

ALTER TABLE "DecisaoDiscovery"
    ADD CONSTRAINT "DecisaoDiscovery_status_final_id_fkey" FOREIGN KEY ("status_final_id") REFERENCES "CatalogItem"("id");

-- Remover colunas antigas
ALTER TABLE "Demanda"
    DROP COLUMN "tipo",
    DROP COLUMN "origem",
    DROP COLUMN "prioridade",
    DROP COLUMN "status";

ALTER TABLE "TriagemDemanda"
    DROP COLUMN "status_triagem",
    DROP COLUMN "impacto",
    DROP COLUMN "urgencia",
    DROP COLUMN "complexidade_estimada";

ALTER TABLE "Discovery"
    DROP COLUMN "status",
    DROP COLUMN "severidade",
    DROP COLUMN "como_identificado",
    DROP COLUMN "publico_afetado";

ALTER TABLE "Hipotese"
    DROP COLUMN "impacto_esperado",
    DROP COLUMN "prioridade",
    DROP COLUMN "status";

ALTER TABLE "Pesquisa"
    DROP COLUMN "metodo",
    DROP COLUMN "status";

ALTER TABLE "Evidencia"
    DROP COLUMN "tipo";

ALTER TABLE "Insight"
    DROP COLUMN "impacto",
    DROP COLUMN "confianca",
    DROP COLUMN "status";

ALTER TABLE "Experimento"
    DROP COLUMN "tipo",
    DROP COLUMN "status";

ALTER TABLE "DecisaoDiscovery"
    DROP COLUMN "status_final";

-- Remover tipos enum legados
DROP TYPE IF EXISTS "TipoDemanda";
DROP TYPE IF EXISTS "OrigemDemanda";
DROP TYPE IF EXISTS "Prioridade";
DROP TYPE IF EXISTS "StatusDemanda";
DROP TYPE IF EXISTS "StatusTriagem";
DROP TYPE IF EXISTS "NivelImpacto";
DROP TYPE IF EXISTS "NivelUrgencia";
DROP TYPE IF EXISTS "NivelComplexidade";
DROP TYPE IF EXISTS "StatusDiscovery";
DROP TYPE IF EXISTS "StatusHipotese";
DROP TYPE IF EXISTS "MetodoPesquisa";
DROP TYPE IF EXISTS "StatusPesquisa";
DROP TYPE IF EXISTS "TipoEvidencia";
DROP TYPE IF EXISTS "StatusInsight";
DROP TYPE IF EXISTS "StatusExperimento";
DROP TYPE IF EXISTS "NivelConfianca";

-- Limpeza
DROP FUNCTION public.slugify;

