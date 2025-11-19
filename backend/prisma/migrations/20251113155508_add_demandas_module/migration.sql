-- CreateEnum
CREATE TYPE "TipoDemanda" AS ENUM ('IDEIA', 'PROBLEMA', 'OPORTUNIDADE', 'OUTRO');

-- CreateEnum
CREATE TYPE "OrigemDemanda" AS ENUM ('CLIENTE', 'SUPORTE', 'DIRETORIA', 'CS', 'VENDAS', 'INTERNO');

-- CreateEnum
CREATE TYPE "Prioridade" AS ENUM ('BAIXA', 'MEDIA', 'ALTA', 'CRITICA');

-- CreateEnum
CREATE TYPE "StatusDemanda" AS ENUM ('NOVO', 'RASCUNHO', 'TRIAGEM', 'ARQUIVADO');

-- DropForeignKey
ALTER TABLE "Produto" DROP CONSTRAINT "Produto_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "UserTenant" DROP CONSTRAINT "UserTenant_tenant_id_fkey";

-- DropForeignKey
ALTER TABLE "UserTenant" DROP CONSTRAINT "UserTenant_user_id_fkey";

-- AlterTable
ALTER TABLE "Produto" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Tenant" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "deleted_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "UserTenant" ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" DROP DEFAULT,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Demanda" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT,
    "tipo" "TipoDemanda" NOT NULL,
    "produto_id" BIGINT NOT NULL,
    "origem" "OrigemDemanda" NOT NULL,
    "origem_detalhe" TEXT,
    "responsavel_id" BIGINT,
    "prioridade" "Prioridade" NOT NULL DEFAULT 'MEDIA',
    "status" "StatusDemanda" NOT NULL DEFAULT 'NOVO',
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "Demanda_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tag" (
    "id" BIGSERIAL NOT NULL,
    "tenant_id" BIGINT NOT NULL,
    "nome" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DemandaTag" (
    "demanda_id" BIGINT NOT NULL,
    "tag_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DemandaTag_pkey" PRIMARY KEY ("demanda_id","tag_id")
);

-- CreateTable
CREATE TABLE "Anexo" (
    "id" BIGSERIAL NOT NULL,
    "demanda_id" BIGINT NOT NULL,
    "arquivo_url" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo_mime" TEXT NOT NULL,
    "tamanho" BIGINT NOT NULL,
    "criado_por_id" BIGINT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anexo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Comentario" (
    "id" BIGSERIAL NOT NULL,
    "demanda_id" BIGINT NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "texto" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Comentario_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Demanda_tenant_id_idx" ON "Demanda"("tenant_id");

-- CreateIndex
CREATE INDEX "Demanda_produto_id_idx" ON "Demanda"("produto_id");

-- CreateIndex
CREATE INDEX "Demanda_status_idx" ON "Demanda"("status");

-- CreateIndex
CREATE INDEX "Demanda_created_at_idx" ON "Demanda"("created_at");

-- CreateIndex
CREATE INDEX "Demanda_responsavel_id_idx" ON "Demanda"("responsavel_id");

-- CreateIndex
CREATE INDEX "Tag_tenant_id_idx" ON "Tag"("tenant_id");

-- CreateIndex
CREATE UNIQUE INDEX "Tag_tenant_id_nome_key" ON "Tag"("tenant_id", "nome");

-- CreateIndex
CREATE INDEX "DemandaTag_demanda_id_idx" ON "DemandaTag"("demanda_id");

-- CreateIndex
CREATE INDEX "DemandaTag_tag_id_idx" ON "DemandaTag"("tag_id");

-- CreateIndex
CREATE INDEX "Anexo_demanda_id_idx" ON "Anexo"("demanda_id");

-- CreateIndex
CREATE INDEX "Comentario_demanda_id_idx" ON "Comentario"("demanda_id");

-- AddForeignKey
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserTenant" ADD CONSTRAINT "UserTenant_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Produto" ADD CONSTRAINT "Produto_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_responsavel_id_fkey" FOREIGN KEY ("responsavel_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandaTag" ADD CONSTRAINT "DemandaTag_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "Demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DemandaTag" ADD CONSTRAINT "DemandaTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "Tag"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "Demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_criado_por_id_fkey" FOREIGN KEY ("criado_por_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_demanda_id_fkey" FOREIGN KEY ("demanda_id") REFERENCES "Demanda"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
