-- Add id_tenant to DiscoveryIdentificacao (via Discovery)
ALTER TABLE "DiscoveryIdentificacao" ADD COLUMN IF NOT EXISTS "id_tenant" BIGINT;

UPDATE "DiscoveryIdentificacao" 
SET "id_tenant" = "Discovery"."id_tenant"
FROM "Discovery"
WHERE "DiscoveryIdentificacao"."discovery_id" = "Discovery"."id" 
  AND "DiscoveryIdentificacao"."id_tenant" IS NULL;

ALTER TABLE "DiscoveryIdentificacao" ALTER COLUMN "id_tenant" SET NOT NULL;
ALTER TABLE "DiscoveryIdentificacao" ADD CONSTRAINT "DiscoveryIdentificacao_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "DiscoveryIdentificacao_id_tenant_idx" ON "DiscoveryIdentificacao"("id_tenant");

-- Add id_tenant to DiscoveryPublico (via Discovery)
ALTER TABLE "DiscoveryPublico" ADD COLUMN IF NOT EXISTS "id_tenant" BIGINT;

UPDATE "DiscoveryPublico" 
SET "id_tenant" = "Discovery"."id_tenant"
FROM "Discovery"
WHERE "DiscoveryPublico"."discovery_id" = "Discovery"."id" 
  AND "DiscoveryPublico"."id_tenant" IS NULL;

ALTER TABLE "DiscoveryPublico" ALTER COLUMN "id_tenant" SET NOT NULL;
ALTER TABLE "DiscoveryPublico" ADD CONSTRAINT "DiscoveryPublico_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE INDEX IF NOT EXISTS "DiscoveryPublico_id_tenant_idx" ON "DiscoveryPublico"("id_tenant");

