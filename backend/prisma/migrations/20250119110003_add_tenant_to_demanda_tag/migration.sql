-- Add tenant_id to DemandaTag (via Demanda)
ALTER TABLE "DemandaTag" ADD COLUMN IF NOT EXISTS "tenant_id" BIGINT;

UPDATE "DemandaTag" 
SET "tenant_id" = "Demanda"."tenant_id"
FROM "Demanda"
WHERE "DemandaTag"."demanda_id" = "Demanda"."id" 
  AND "DemandaTag"."tenant_id" IS NULL;

ALTER TABLE "DemandaTag" ALTER COLUMN "tenant_id" SET NOT NULL;
ALTER TABLE "DemandaTag" ADD CONSTRAINT "DemandaTag_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "DemandaTag_tenant_id_idx" ON "DemandaTag"("tenant_id");

