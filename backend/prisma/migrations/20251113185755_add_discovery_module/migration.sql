-- CreateEnum
CREATE TYPE "StatusDiscovery" AS ENUM ('EM_PESQUISA', 'VALIDANDO', 'FECHADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "StatusHipotese" AS ENUM ('PENDENTE', 'EM_TESTE', 'VALIDADA', 'REFUTADA', 'ARQUIVADA');

-- CreateEnum
CREATE TYPE "MetodoPesquisa" AS ENUM ('ENTREVISTA_GUIADA', 'ENTREVISTA_LIVRE', 'SURVEY', 'FOCUS_GROUP', 'OBSERVACAO', 'TESTE_USABILIDADE', 'CARD_SORTING', 'DIARIO_USO');

-- CreateEnum
CREATE TYPE "StatusPesquisa" AS ENUM ('PLANEJADA', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "TipoEvidencia" AS ENUM ('DADOS_ANALYTICS', 'PRINT', 'VIDEO', 'AUDIO', 'FEEDBACK_USUARIO', 'LOG_SISTEMA', 'TRANSCRICAO', 'RESULTADO_TESTE', 'BENCHMARK', 'DOCUMENTO');

-- CreateEnum
CREATE TYPE "StatusInsight" AS ENUM ('RASCUNHO', 'VALIDADO', 'REFUTADO', 'EM_ANALISE');

-- CreateEnum
CREATE TYPE "StatusExperimento" AS ENUM ('PLANEJADO', 'EM_EXECUCAO', 'CONCLUIDO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "NivelConfianca" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'MUITO_ALTA');

-- CreateTable
CREATE TABLE "Discovery" (
    "id" BIGSERIAL NOT NULL,
    "id_tenant" BIGINT NOT NULL,
    "id_demanda" BIGINT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "contexto" TEXT,
    "publico_afetado" TEXT[],
    "volume_impactado" TEXT,
    "severidade" "NivelImpacto",
    "como_identificado" TEXT[],
    "status" "StatusDiscovery" NOT NULL DEFAULT 'EM_PESQUISA',
    "criado_por_id" BIGINT NOT NULL,
    "responsavel_id" BIGINT NOT NULL,
    "produto_id" BIGINT NOT NULL,
    "evolucao_log" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Discovery_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Hipotese" (
    "id" BIGSERIAL NOT NULL,
    "id_tenant" BIGINT NOT NULL,
    "id_discovery" BIGINT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "como_validar" TEXT NOT NULL,
    "metrica_alvo" TEXT,
    "impacto_esperado" "NivelImpacto" NOT NULL DEFAULT 'MEDIO',
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusHipotese" NOT NULL DEFAULT 'PENDENTE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Hipotese_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pesquisa" (
    "id" BIGSERIAL NOT NULL,
    "id_tenant" BIGINT NOT NULL,
    "id_discovery" BIGINT NOT NULL,
    "titulo" TEXT NOT NULL,
    "metodo" "MetodoPesquisa" NOT NULL,
    "objetivo" TEXT NOT NULL,
    "roteiro_url" TEXT,
    "status" "StatusPesquisa" NOT NULL DEFAULT 'PLANEJADA',
    "total_participantes" INTEGER NOT NULL DEFAULT 0,
    "participantes_concluidos" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Pesquisa_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Entrevista" (
    "id" BIGSERIAL NOT NULL,
    "id_tenant" BIGINT NOT NULL,
    "id_pesquisa" BIGINT NOT NULL,
    "participante_nome" TEXT NOT NULL,
    "participante_perfil" TEXT,
    "participante_email" TEXT,
    "data_hora" TIMESTAMP(3) NOT NULL,
    "transcricao" TEXT,
    "notas" TEXT,
    "gravacao_url" TEXT,
    "tags" TEXT[],
    "duracao_minutos" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Entrevista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Evidencia" (
    "id" BIGSERIAL NOT NULL,
    "id_tenant" BIGINT NOT NULL,
    "id_discovery" BIGINT NOT NULL,
    "id_hipotese" BIGINT,
    "tipo" "TipoEvidencia" NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "arquivo_url" TEXT,
    "tags" TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Evidencia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Insight" (
    "id" BIGSERIAL NOT NULL,
    "id_tenant" BIGINT NOT NULL,
    "id_discovery" BIGINT NOT NULL,
    "id_entrevista" BIGINT,
    "descricao" TEXT NOT NULL,
    "impacto" "NivelImpacto" NOT NULL DEFAULT 'MEDIO',
    "confianca" "NivelConfianca" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusInsight" NOT NULL DEFAULT 'RASCUNHO',
    "tags" TEXT[],
    "evidencias_ids" BIGINT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Insight_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Experimento" (
    "id" BIGSERIAL NOT NULL,
    "id_tenant" BIGINT NOT NULL,
    "id_discovery" BIGINT NOT NULL,
    "id_hipotese" BIGINT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "metrica_sucesso" TEXT NOT NULL,
    "grupo_controle" JSONB,
    "grupo_variante" JSONB,
    "resultados" JSONB,
    "p_value" DOUBLE PRECISION,
    "status" "StatusExperimento" NOT NULL DEFAULT 'PLANEJADO',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Experimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DecisaoDiscovery" (
    "id_decisao" BIGSERIAL NOT NULL,
    "id_tenant" BIGINT NOT NULL,
    "id_discovery" BIGINT NOT NULL,
    "status_final" TEXT NOT NULL,
    "resumo" TEXT NOT NULL,
    "aprendizados" TEXT[],
    "recomendacoes" TEXT[],
    "proximos_passos" TEXT[],
    "materiais_anexos" JSONB,
    "decidido_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DecisaoDiscovery_pkey" PRIMARY KEY ("id_decisao")
);

-- CreateIndex
CREATE UNIQUE INDEX "Discovery_id_demanda_key" ON "Discovery"("id_demanda");

-- CreateIndex
CREATE INDEX "Discovery_id_tenant_idx" ON "Discovery"("id_tenant");

-- CreateIndex
CREATE INDEX "Discovery_id_demanda_idx" ON "Discovery"("id_demanda");

-- CreateIndex
CREATE INDEX "Discovery_status_idx" ON "Discovery"("status");

-- CreateIndex
CREATE INDEX "Discovery_produto_id_idx" ON "Discovery"("produto_id");

-- CreateIndex
CREATE INDEX "Discovery_responsavel_id_idx" ON "Discovery"("responsavel_id");

-- CreateIndex
CREATE INDEX "Hipotese_id_tenant_idx" ON "Hipotese"("id_tenant");

-- CreateIndex
CREATE INDEX "Hipotese_id_discovery_idx" ON "Hipotese"("id_discovery");

-- CreateIndex
CREATE INDEX "Hipotese_status_idx" ON "Hipotese"("status");

-- CreateIndex
CREATE INDEX "Pesquisa_id_tenant_idx" ON "Pesquisa"("id_tenant");

-- CreateIndex
CREATE INDEX "Pesquisa_id_discovery_idx" ON "Pesquisa"("id_discovery");

-- CreateIndex
CREATE INDEX "Pesquisa_status_idx" ON "Pesquisa"("status");

-- CreateIndex
CREATE INDEX "Entrevista_id_tenant_idx" ON "Entrevista"("id_tenant");

-- CreateIndex
CREATE INDEX "Entrevista_id_pesquisa_idx" ON "Entrevista"("id_pesquisa");

-- CreateIndex
CREATE INDEX "Entrevista_data_hora_idx" ON "Entrevista"("data_hora");

-- CreateIndex
CREATE INDEX "Evidencia_id_tenant_idx" ON "Evidencia"("id_tenant");

-- CreateIndex
CREATE INDEX "Evidencia_id_discovery_idx" ON "Evidencia"("id_discovery");

-- CreateIndex
CREATE INDEX "Evidencia_id_hipotese_idx" ON "Evidencia"("id_hipotese");

-- CreateIndex
CREATE INDEX "Evidencia_tipo_idx" ON "Evidencia"("tipo");

-- CreateIndex
CREATE INDEX "Insight_id_tenant_idx" ON "Insight"("id_tenant");

-- CreateIndex
CREATE INDEX "Insight_id_discovery_idx" ON "Insight"("id_discovery");

-- CreateIndex
CREATE INDEX "Insight_status_idx" ON "Insight"("status");

-- CreateIndex
CREATE INDEX "Insight_impacto_idx" ON "Insight"("impacto");

-- CreateIndex
CREATE INDEX "Experimento_id_tenant_idx" ON "Experimento"("id_tenant");

-- CreateIndex
CREATE INDEX "Experimento_id_discovery_idx" ON "Experimento"("id_discovery");

-- CreateIndex
CREATE INDEX "Experimento_status_idx" ON "Experimento"("status");

-- CreateIndex
CREATE UNIQUE INDEX "DecisaoDiscovery_id_discovery_key" ON "DecisaoDiscovery"("id_discovery");

-- CreateIndex
CREATE INDEX "DecisaoDiscovery_id_tenant_idx" ON "DecisaoDiscovery"("id_tenant");

-- AddForeignKey
ALTER TABLE "Discovery" ADD CONSTRAINT "Discovery_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discovery" ADD CONSTRAINT "Discovery_id_demanda_fkey" FOREIGN KEY ("id_demanda") REFERENCES "Demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discovery" ADD CONSTRAINT "Discovery_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discovery" ADD CONSTRAINT "Discovery_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Discovery" ADD CONSTRAINT "Discovery_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hipotese" ADD CONSTRAINT "Hipotese_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Hipotese" ADD CONSTRAINT "Hipotese_id_discovery_fkey" FOREIGN KEY ("id_discovery") REFERENCES "Discovery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesquisa" ADD CONSTRAINT "Pesquisa_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pesquisa" ADD CONSTRAINT "Pesquisa_id_discovery_fkey" FOREIGN KEY ("id_discovery") REFERENCES "Discovery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrevista" ADD CONSTRAINT "Entrevista_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Entrevista" ADD CONSTRAINT "Entrevista_id_pesquisa_fkey" FOREIGN KEY ("id_pesquisa") REFERENCES "Pesquisa"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_id_discovery_fkey" FOREIGN KEY ("id_discovery") REFERENCES "Discovery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_id_hipotese_fkey" FOREIGN KEY ("id_hipotese") REFERENCES "Hipotese"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_id_discovery_fkey" FOREIGN KEY ("id_discovery") REFERENCES "Discovery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Insight" ADD CONSTRAINT "Insight_id_entrevista_fkey" FOREIGN KEY ("id_entrevista") REFERENCES "Entrevista"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experimento" ADD CONSTRAINT "Experimento_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experimento" ADD CONSTRAINT "Experimento_id_discovery_fkey" FOREIGN KEY ("id_discovery") REFERENCES "Discovery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Experimento" ADD CONSTRAINT "Experimento_id_hipotese_fkey" FOREIGN KEY ("id_hipotese") REFERENCES "Hipotese"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisaoDiscovery" ADD CONSTRAINT "DecisaoDiscovery_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisaoDiscovery" ADD CONSTRAINT "DecisaoDiscovery_id_discovery_fkey" FOREIGN KEY ("id_discovery") REFERENCES "Discovery"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DecisaoDiscovery" ADD CONSTRAINT "DecisaoDiscovery_decidido_por_id_fkey" FOREIGN KEY ("decidido_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
