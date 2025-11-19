-- Ensure pgcrypto extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create enums for documentação module
CREATE TYPE "DocumentoTipo" AS ENUM ('PRD', 'BRD', 'RFC', 'SPEC', 'RELEASE_NOTE', 'UX_DOC');
CREATE TYPE "DocumentoStatus" AS ENUM ('RASCUNHO', 'REVISAO', 'APROVADO', 'OBSOLETO');
CREATE TYPE "DocumentoVinculoTipo" AS ENUM ('DISCOVERY', 'EPICO', 'FEATURE', 'DEMANDA', 'RELEASE');
CREATE TYPE "RegraNegocioTipo" AS ENUM ('FISCAL', 'COMERCIAL', 'OPERACIONAL', 'SEGURANCA', 'OUTRO');
CREATE TYPE "RegraNegocioOrigem" AS ENUM ('LEGISLACAO', 'REGRA_INTERNA', 'CLIENTE', 'MERCADO', 'OUTRA');
CREATE TYPE "RegraNegocioImpacto" AS ENUM ('ALTO', 'MEDIO', 'BAIXO');
CREATE TYPE "AprovacaoTipo" AS ENUM ('NEGOCIO', 'TECNICA', 'UX', 'COMPLIANCE');
CREATE TYPE "AprovacaoStatus" AS ENUM ('PENDENTE', 'APROVADO', 'REPROVADO');
CREATE TYPE "DocumentoRiscoProbabilidade" AS ENUM ('ALTA', 'MEDIA', 'BAIXA');
CREATE TYPE "DocumentoRiscoImpacto" AS ENUM ('ALTO', 'MEDIO', 'BAIXO');

-- Create main Documento table
CREATE TABLE "Documento" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "tipo" "DocumentoTipo" NOT NULL,
    "titulo" TEXT NOT NULL,
    "resumo" TEXT,
    "status" "DocumentoStatus" NOT NULL DEFAULT 'RASCUNHO',
    "produto_id" BIGINT,
    "pm_id" BIGINT,
    "squad_id" BIGINT,
    "versao_atual_id" UUID,
    "criado_por_id" BIGINT NOT NULL,
    "atualizado_por_id" BIGINT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMPTZ,

    CONSTRAINT "Documento_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Documento_tenant_idx" ON "Documento" ("id_tenant");
CREATE INDEX "Documento_tipo_idx" ON "Documento" ("tipo");
CREATE INDEX "Documento_status_idx" ON "Documento" ("status");
CREATE INDEX "Documento_produto_idx" ON "Documento" ("produto_id");
CREATE INDEX "Documento_pm_idx" ON "Documento" ("pm_id");
CREATE INDEX "Documento_squad_idx" ON "Documento" ("squad_id");

-- Create DocumentoVersao table
CREATE TABLE "DocumentoVersao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "documento_id" UUID NOT NULL,
    "versao" TEXT NOT NULL,
    "conteudo_json" JSONB,
    "changelog_resumo" TEXT,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoVersao_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "DocumentoVersao_documento_versao_key" ON "DocumentoVersao" ("documento_id", "versao");
CREATE INDEX "DocumentoVersao_tenant_idx" ON "DocumentoVersao" ("id_tenant");

-- Create DocumentoVinculo table
CREATE TABLE "DocumentoVinculo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "documento_id" UUID NOT NULL,
    "tipo_alvo" "DocumentoVinculoTipo" NOT NULL,
    "id_alvo" TEXT NOT NULL,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoVinculo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoVinculo_tenant_idx" ON "DocumentoVinculo" ("id_tenant");
CREATE INDEX "DocumentoVinculo_documento_idx" ON "DocumentoVinculo" ("documento_id");
CREATE INDEX "DocumentoVinculo_tipo_idx" ON "DocumentoVinculo" ("tipo_alvo");

-- Create DocumentoTag table
CREATE TABLE "DocumentoTag" (
    "id_documento" UUID NOT NULL,
    "id_tag" BIGINT NOT NULL,
    "id_tenant" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoTag_pkey" PRIMARY KEY ("id_documento", "id_tag")
);

CREATE INDEX "DocumentoTag_tenant_idx" ON "DocumentoTag" ("id_tenant");
CREATE INDEX "DocumentoTag_tag_idx" ON "DocumentoTag" ("id_tag");

-- Create DocumentoAnexo table
CREATE TABLE "DocumentoAnexo" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "versao_id" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "tipo_mime" TEXT NOT NULL,
    "nome_arquivo" TEXT NOT NULL,
    "tamanho_bytes" BIGINT NOT NULL,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoAnexo_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoAnexo_tenant_idx" ON "DocumentoAnexo" ("id_tenant");
CREATE INDEX "DocumentoAnexo_versao_idx" ON "DocumentoAnexo" ("versao_id");

-- Create DocumentoRegraNegocio table
CREATE TABLE "DocumentoRegraNegocio" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "versao_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "RegraNegocioTipo" NOT NULL,
    "origem" "RegraNegocioOrigem" NOT NULL,
    "impacto" "RegraNegocioImpacto" NOT NULL,
    "modulo" TEXT,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoRegraNegocio_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoRegraNegocio_tenant_idx" ON "DocumentoRegraNegocio" ("id_tenant");
CREATE INDEX "DocumentoRegraNegocio_versao_idx" ON "DocumentoRegraNegocio" ("versao_id");
CREATE INDEX "DocumentoRegraNegocio_codigo_idx" ON "DocumentoRegraNegocio" ("codigo");
CREATE INDEX "DocumentoRegraNegocio_tipo_idx" ON "DocumentoRegraNegocio" ("tipo");
CREATE INDEX "DocumentoRegraNegocio_origem_idx" ON "DocumentoRegraNegocio" ("origem");

-- Create DocumentoRequisitoFuncional table
CREATE TABLE "DocumentoRequisitoFuncional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "versao_id" UUID NOT NULL,
    "codigo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" TEXT,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoRequisitoFuncional_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoRequisitoFuncional_tenant_idx" ON "DocumentoRequisitoFuncional" ("id_tenant");
CREATE INDEX "DocumentoRequisitoFuncional_versao_idx" ON "DocumentoRequisitoFuncional" ("versao_id");
CREATE INDEX "DocumentoRequisitoFuncional_codigo_idx" ON "DocumentoRequisitoFuncional" ("codigo");

-- Create DocumentoRequisitoNaoFuncional table
CREATE TABLE "DocumentoRequisitoNaoFuncional" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "versao_id" UUID NOT NULL,
    "categoria" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "metrica" TEXT,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoRequisitoNaoFuncional_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoRequisitoNaoFuncional_tenant_idx" ON "DocumentoRequisitoNaoFuncional" ("id_tenant");
CREATE INDEX "DocumentoRequisitoNaoFuncional_versao_idx" ON "DocumentoRequisitoNaoFuncional" ("versao_id");
CREATE INDEX "DocumentoRequisitoNaoFuncional_categoria_idx" ON "DocumentoRequisitoNaoFuncional" ("categoria");

-- Create DocumentoCriterioAceite table
CREATE TABLE "DocumentoCriterioAceite" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "versao_id" UUID NOT NULL,
    "codigo" TEXT,
    "descricao" TEXT NOT NULL,
    "cenario" TEXT,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoCriterioAceite_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoCriterioAceite_tenant_idx" ON "DocumentoCriterioAceite" ("id_tenant");
CREATE INDEX "DocumentoCriterioAceite_versao_idx" ON "DocumentoCriterioAceite" ("versao_id");
CREATE INDEX "DocumentoCriterioAceite_codigo_idx" ON "DocumentoCriterioAceite" ("codigo");

-- Create DocumentoRisco table
CREATE TABLE "DocumentoRisco" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "versao_id" UUID NOT NULL,
    "descricao" TEXT NOT NULL,
    "probabilidade" "DocumentoRiscoProbabilidade" NOT NULL,
    "impacto" "DocumentoRiscoImpacto" NOT NULL,
    "mitigacao" TEXT,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoRisco_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoRisco_tenant_idx" ON "DocumentoRisco" ("id_tenant");
CREATE INDEX "DocumentoRisco_versao_idx" ON "DocumentoRisco" ("versao_id");
CREATE INDEX "DocumentoRisco_impacto_idx" ON "DocumentoRisco" ("impacto");

-- Create DocumentoComentario table
CREATE TABLE "DocumentoComentario" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "versao_id" UUID NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "texto" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "resolvido" BOOLEAN NOT NULL DEFAULT FALSE,
    "parent_id" UUID,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoComentario_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoComentario_tenant_idx" ON "DocumentoComentario" ("id_tenant");
CREATE INDEX "DocumentoComentario_versao_idx" ON "DocumentoComentario" ("versao_id");
CREATE INDEX "DocumentoComentario_usuario_idx" ON "DocumentoComentario" ("usuario_id");
CREATE INDEX "DocumentoComentario_tipo_idx" ON "DocumentoComentario" ("tipo");

-- Create DocumentoAprovacao table
CREATE TABLE "DocumentoAprovacao" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "id_tenant" BIGINT NOT NULL,
    "versao_id" UUID NOT NULL,
    "tipo" "AprovacaoTipo" NOT NULL,
    "status" "AprovacaoStatus" NOT NULL DEFAULT 'PENDENTE',
    "aprovado_por_id" BIGINT,
    "comentario" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentoAprovacao_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentoAprovacao_tenant_idx" ON "DocumentoAprovacao" ("id_tenant");
CREATE INDEX "DocumentoAprovacao_versao_idx" ON "DocumentoAprovacao" ("versao_id");
CREATE INDEX "DocumentoAprovacao_tipo_idx" ON "DocumentoAprovacao" ("tipo");
CREATE INDEX "DocumentoAprovacao_status_idx" ON "DocumentoAprovacao" ("status");

-- Foreign keys
ALTER TABLE "Documento"
  ADD CONSTRAINT "Documento_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "Documento_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Documento_pm_id_fkey" FOREIGN KEY ("pm_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Documento_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "PlanejamentoSquad"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "Documento_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "Documento_atualizado_por_id_fkey" FOREIGN KEY ("atualizado_por_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentoVersao"
  ADD CONSTRAINT "DocumentoVersao_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoVersao_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoVersao_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Documento"
  ADD CONSTRAINT "Documento_versao_atual_id_fkey" FOREIGN KEY ("versao_atual_id") REFERENCES "DocumentoVersao"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "DocumentoVinculo"
  ADD CONSTRAINT "DocumentoVinculo_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoVinculo_documento_id_fkey" FOREIGN KEY ("documento_id") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoVinculo_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentoTag"
  ADD CONSTRAINT "DocumentoTag_documento_id_fkey" FOREIGN KEY ("id_documento") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoTag_tag_id_fkey" FOREIGN KEY ("id_tag") REFERENCES "Tag"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoTag_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentoAnexo"
  ADD CONSTRAINT "DocumentoAnexo_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoAnexo_versao_id_fkey" FOREIGN KEY ("versao_id") REFERENCES "DocumentoVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoAnexo_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentoRegraNegocio"
  ADD CONSTRAINT "DocumentoRegraNegocio_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoRegraNegocio_versao_id_fkey" FOREIGN KEY ("versao_id") REFERENCES "DocumentoVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoRegraNegocio_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentoRequisitoFuncional"
  ADD CONSTRAINT "DocumentoRequisitoFuncional_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoRequisitoFuncional_versao_id_fkey" FOREIGN KEY ("versao_id") REFERENCES "DocumentoVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoRequisitoFuncional_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentoRequisitoNaoFuncional"
  ADD CONSTRAINT "DocumentoRequisitoNaoFuncional_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoRequisitoNaoFuncional_versao_id_fkey" FOREIGN KEY ("versao_id") REFERENCES "DocumentoVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoRequisitoNaoFuncional_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentoCriterioAceite"
  ADD CONSTRAINT "DocumentoCriterioAceite_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoCriterioAceite_versao_id_fkey" FOREIGN KEY ("versao_id") REFERENCES "DocumentoVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoCriterioAceite_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentoRisco"
  ADD CONSTRAINT "DocumentoRisco_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoRisco_versao_id_fkey" FOREIGN KEY ("versao_id") REFERENCES "DocumentoVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoRisco_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "DocumentoComentario"
  ADD CONSTRAINT "DocumentoComentario_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoComentario_versao_id_fkey" FOREIGN KEY ("versao_id") REFERENCES "DocumentoVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoComentario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoComentario_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "DocumentoComentario"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DocumentoAprovacao"
  ADD CONSTRAINT "DocumentoAprovacao_tenant_id_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoAprovacao_versao_id_fkey" FOREIGN KEY ("versao_id") REFERENCES "DocumentoVersao"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "DocumentoAprovacao_aprovado_por_id_fkey" FOREIGN KEY ("aprovado_por_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;


