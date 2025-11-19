-- Add tenant_id to Anexo (via Demanda)
ALTER TABLE "Anexo" ADD COLUMN IF NOT EXISTS "tenant_id" BIGINT;

UPDATE "Anexo" 
SET "tenant_id" = "Demanda"."tenant_id"
FROM "Demanda"
WHERE "Anexo"."demanda_id" = "Demanda"."id" 
  AND "Anexo"."tenant_id" IS NULL;

ALTER TABLE "Anexo" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "Anexo" ADD CONSTRAINT "Anexo_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Anexo_tenant_id_idx" ON "Anexo"("tenant_id");

-- Add tenant_id to Comentario (via Demanda)
ALTER TABLE "Comentario" ADD COLUMN IF NOT EXISTS "tenant_id" BIGINT;

UPDATE "Comentario" 
SET "tenant_id" = "Demanda"."tenant_id"
FROM "Demanda"
WHERE "Comentario"."demanda_id" = "Demanda"."id" 
  AND "Comentario"."tenant_id" IS NULL;

ALTER TABLE "Comentario" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "Comentario" ADD CONSTRAINT "Comentario_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "Comentario_tenant_id_idx" ON "Comentario"("tenant_id");

-- Add tenant_id to TriagemDemanda (via Demanda)
ALTER TABLE "TriagemDemanda" ADD COLUMN IF NOT EXISTS "tenant_id" BIGINT;

UPDATE "TriagemDemanda" 
SET "tenant_id" = "Demanda"."tenant_id"
FROM "Demanda"
WHERE "TriagemDemanda"."demanda_id" = "Demanda"."id" 
  AND "TriagemDemanda"."tenant_id" IS NULL;

ALTER TABLE "TriagemDemanda" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "TriagemDemanda" ADD CONSTRAINT "TriagemDemanda_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "TriagemDemanda_tenant_id_idx" ON "TriagemDemanda"("tenant_id");

