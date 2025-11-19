-- CreateEnum
CREATE TYPE "StatusTriagem" AS ENUM ('PENDENTE_TRIAGEM', 'AGUARDANDO_INFO', 'RETOMADO_TRIAGEM', 'PRONTO_DISCOVERY', 'EVOLUIU_EPICO', 'ARQUIVADO_TRIAGEM', 'DUPLICADO');

-- CreateEnum
CREATE TYPE "NivelImpacto" AS ENUM ('BAIXO', 'MEDIO', 'ALTO', 'CRITICO');

-- CreateEnum
CREATE TYPE "NivelUrgencia" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "NivelComplexidade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA');

-- CreateEnum
CREATE TYPE "StatusSolicitacao" AS ENUM ('PENDENTE', 'RESPONDIDO', 'EXPIRADO');

-- CreateTable
CREATE TABLE "TriagemDemanda" (
    "id" BIGSERIAL NOT NULL,
    "demanda_id" BIGINT NOT NULL,
    "status_triagem" "StatusTriagem" NOT NULL DEFAULT 'PENDENTE_TRIAGEM',
    "impacto" "NivelImpacto",
    "urgencia" "NivelUrgencia",
    "complexidade_estimada" "NivelComplexidade",
    "checklist_json" JSONB NOT NULL DEFAULT '{}',
    "triado_por_id" BIGINT,
    "triado_em" TIMESTAMP(3),
    "revisoes_triagem" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TriagemDemanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SolicitacaoInfo" (
    "id" BIGSERIAL NOT NULL,
    "triagem_id" BIGINT NOT NULL,
    "solicitante_id" BIGINT NOT NULL,
    "texto" TEXT NOT NULL,
    "anexos" JSONB NOT NULL DEFAULT '[]',
    "prazo" TIMESTAMP(3),
    "status" "StatusSolicitacao" NOT NULL DEFAULT 'PENDENTE',
    "respondido_em" TIMESTAMP(3),
    "resposta" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SolicitacaoInfo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DuplicatasDemanda" (
    "id" BIGSERIAL NOT NULL,
    "demanda_id" BIGINT NOT NULL,
    "demanda_original_id" BIGINT NOT NULL,
    "similaridade" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DuplicatasDemanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegrasAutomacaoTriagem" (
    "id" BIGSERIAL NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "condicao_json" JSONB NOT NULL,
    "acao_json" JSONB NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RegrasAutomacaoTriagem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "TriagemDemanda_demanda_id_key" ON "TriagemDemanda"("demanda_id");

-- CreateIndex
CREATE INDEX "TriagemDemanda_demanda_id_idx" ON "TriagemDemanda"("demanda_id");

-- CreateIndex
CREATE INDEX "TriagemDemanda_status_triagem_idx" ON "TriagemDemanda"("status_triagem");

-- CreateIndex
CREATE INDEX "TriagemDemanda_triado_por_id_idx" ON "TriagemDemanda"("triado_por_id");

-- CreateIndex
CREATE INDEX "SolicitacaoInfo_triagem_id_idx" ON "SolicitacaoInfo"("triagem_id");

-- CreateIndex
CREATE INDEX "SolicitacaoInfo_solicitante_id_idx" ON "SolicitacaoInfo"("solicitante_id");

-- CreateIndex
CREATE INDEX "SolicitacaoInfo_status_idx" ON "SolicitacaoInfo"("status");

-- CreateIndex
CREATE INDEX "DuplicatasDemanda_demanda_id_idx" ON "DuplicatasDemanda"("demanda_id");

-- CreateIndex
CREATE INDEX "DuplicatasDemanda_demanda_original_id_idx" ON "DuplicatasDemanda"("demanda_original_id");

-- CreateIndex
CREATE UNIQUE INDEX "DuplicatasDemanda_demanda_id_demanda_original_id_key" ON "DuplicatasDemanda"("demanda_id", "demanda_original_id");

-- CreateIndex
CREATE INDEX "RegrasAutomacaoTriagem_ativo_idx" ON "RegrasAutomacaoTriagem"("ativo");

-- CreateIndex
CREATE INDEX "RegrasAutomacaoTriagem_ordem_idx" ON "RegrasAutomacaoTriagem"("ordem");

-- AddForeignKey
ALTER TABLE "TriagemDemanda" ADD CONSTRAINT "TriagemDemanda_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "Demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TriagemDemanda" ADD CONSTRAINT "TriagemDemanda_triado_por_id_fkey" FOREIGN KEY ("triado_por_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoInfo" ADD CONSTRAINT "SolicitacaoInfo_triagem_id_fkey" FOREIGN KEY ("triagem_id") REFERENCES "TriagemDemanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitacaoInfo" ADD CONSTRAINT "SolicitacaoInfo_solicitante_id_fkey" FOREIGN KEY ("solicitante_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicatasDemanda" ADD CONSTRAINT "DuplicatasDemanda_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "TriagemDemanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DuplicatasDemanda" ADD CONSTRAINT "DuplicatasDemanda_demanda_original_id_fkey" FOREIGN KEY ("demanda_original_id") REFERENCES "TriagemDemanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegrasAutomacaoTriagem" ADD CONSTRAINT "RegrasAutomacaoTriagem_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
