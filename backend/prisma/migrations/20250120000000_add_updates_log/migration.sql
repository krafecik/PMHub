-- Create enum for update log entity types
CREATE TYPE "PlanejamentoUpdateLogTipo" AS ENUM ('EPICO', 'FEATURE', 'DEPENDENCIA', 'COMMITMENT', 'CENARIO');

-- Create PlanejamentoUpdateLog table
CREATE TABLE "PlanejamentoUpdateLog" (
    "id" BIGSERIAL PRIMARY KEY,
    "id_tenant" BIGINT NOT NULL,
    "tipo" "PlanejamentoUpdateLogTipo" NOT NULL,
    "entidade_id" BIGINT NOT NULL,
    "usuario_id" BIGINT NOT NULL,
    "acao" TEXT NOT NULL,
    "campo" TEXT,
    "valor_anterior" TEXT,
    "valor_novo" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PlanejamentoUpdateLog_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE,
    CONSTRAINT "PlanejamentoUpdateLog_usuario_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE
);

CREATE INDEX "PlanejamentoUpdateLog_tenant_idx" ON "PlanejamentoUpdateLog" ("id_tenant");
CREATE INDEX "PlanejamentoUpdateLog_tipo_entidade_idx" ON "PlanejamentoUpdateLog" ("tipo", "entidade_id");
CREATE INDEX "PlanejamentoUpdateLog_created_at_idx" ON "PlanejamentoUpdateLog" ("created_at" DESC);

