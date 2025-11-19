-- Add id_tenant column to RegrasAutomacaoTriagem
ALTER TABLE "RegrasAutomacaoTriagem" ADD COLUMN IF NOT EXISTS "id_tenant" BIGINT;

-- Add foreign key constraint
ALTER TABLE "RegrasAutomacaoTriagem" 
  ADD CONSTRAINT "RegrasAutomacaoTriagem_id_tenant_fkey" 
  FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Create index
CREATE INDEX IF NOT EXISTS "RegrasAutomacaoTriagem_id_tenant_idx" ON "RegrasAutomacaoTriagem"("id_tenant");

-- Set default tenant for existing records (if any)
-- UPDATE "RegrasAutomacaoTriagem" SET "id_tenant" = 1 WHERE "id_tenant" IS NULL;

-- Make id_tenant NOT NULL after setting defaults (uncomment after setting defaults above)
-- ALTER TABLE "RegrasAutomacaoTriagem" ALTER COLUMN "id_tenant" SET NOT NULL;

