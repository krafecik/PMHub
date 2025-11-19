-- Add documento_id to DocumentoComentario
ALTER TABLE "DocumentoComentario" ADD COLUMN "documento_id" UUID;

-- Populate documento_id from versao_id
UPDATE "DocumentoComentario" dc
SET "documento_id" = dv."documento_id"
FROM "DocumentoVersao" dv
WHERE dc."versao_id" = dv."id";

-- Make documento_id NOT NULL
ALTER TABLE "DocumentoComentario" ALTER COLUMN "documento_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "DocumentoComentario"
  ADD CONSTRAINT "DocumentoComentario_documento_id_fkey" 
  FOREIGN KEY ("documento_id") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index
CREATE INDEX "DocumentoComentario_documento_idx" ON "DocumentoComentario" ("documento_id");

-- Add documento_id to DocumentoAprovacao
ALTER TABLE "DocumentoAprovacao" ADD COLUMN "documento_id" UUID;

-- Populate documento_id from versao_id
UPDATE "DocumentoAprovacao" da
SET "documento_id" = dv."documento_id"
FROM "DocumentoVersao" dv
WHERE da."versao_id" = dv."id";

-- Make documento_id NOT NULL
ALTER TABLE "DocumentoAprovacao" ALTER COLUMN "documento_id" SET NOT NULL;

-- Add foreign key constraint
ALTER TABLE "DocumentoAprovacao"
  ADD CONSTRAINT "DocumentoAprovacao_documento_id_fkey" 
  FOREIGN KEY ("documento_id") REFERENCES "Documento"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index
CREATE INDEX "DocumentoAprovacao_documento_idx" ON "DocumentoAprovacao" ("documento_id");

-- Make versao_atual_id unique
ALTER TABLE "Documento" ADD CONSTRAINT "Documento_versao_atual_id_key" UNIQUE ("versao_atual_id");

