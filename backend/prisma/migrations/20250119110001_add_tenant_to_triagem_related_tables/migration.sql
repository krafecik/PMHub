-- Add tenant_id to SolicitacaoInfo (via TriagemDemanda -> Demanda)
ALTER TABLE "SolicitacaoInfo" ADD COLUMN IF NOT EXISTS "tenant_id" BIGINT;

UPDATE "SolicitacaoInfo" 
SET "tenant_id" = "Demanda"."tenant_id"
FROM "TriagemDemanda", "Demanda"
WHERE "SolicitacaoInfo"."triagem_id" = "TriagemDemanda"."id"
  AND "TriagemDemanda"."demanda_id" = "Demanda"."id"
  AND "SolicitacaoInfo"."tenant_id" IS NULL;

ALTER TABLE "SolicitacaoInfo" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "SolicitacaoInfo" ADD CONSTRAINT "SolicitacaoInfo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "SolicitacaoInfo_tenant_id_idx" ON "SolicitacaoInfo"("tenant_id");

-- Add tenant_id to DuplicatasDemanda (via TriagemDemanda -> Demanda)
ALTER TABLE "DuplicatasDemanda" ADD COLUMN IF NOT EXISTS "tenant_id" BIGINT;

UPDATE "DuplicatasDemanda" 
SET "tenant_id" = "Demanda"."tenant_id"
FROM "TriagemDemanda", "Demanda"
WHERE "DuplicatasDemanda"."demanda_id" = "TriagemDemanda"."id"
  AND "TriagemDemanda"."demanda_id" = "Demanda"."id"
  AND "DuplicatasDemanda"."tenant_id" IS NULL;

ALTER TABLE "DuplicatasDemanda" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "DuplicatasDemanda" ADD CONSTRAINT "DuplicatasDemanda_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "DuplicatasDemanda_tenant_id_idx" ON "DuplicatasDemanda"("tenant_id");

