-- Set default tenant (1) for existing records that don't have a tenant
UPDATE "RegrasAutomacaoTriagem" SET "id_tenant" = 1 WHERE "id_tenant" IS NULL;

-- Make id_tenant NOT NULL now that all records have a value
ALTER TABLE "RegrasAutomacaoTriagem" ALTER COLUMN "id_tenant" SET NOT NULL;

