-- Add deleted_at column to RegrasAutomacaoTriagem
ALTER TABLE "RegrasAutomacaoTriagem" ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

