-- Migration: Catálogos flexíveis – Etapa 2 (modelagem e FKs adicionais)
-- Data: 2025-11-14

-- Users: optional catalog references for tipo/cargo
ALTER TABLE "User"
  ADD COLUMN "tipo_usuario_id" BIGINT,
  ADD COLUMN "cargo_usuario_id" BIGINT;

CREATE INDEX IF NOT EXISTS "User_tipo_usuario_idx" ON "User" ("tipo_usuario_id");
CREATE INDEX IF NOT EXISTS "User_cargo_usuario_idx" ON "User" ("cargo_usuario_id");

ALTER TABLE "User"
  ADD CONSTRAINT "User_tipo_usuario_id_fkey"
    FOREIGN KEY ("tipo_usuario_id") REFERENCES "CatalogItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "User"
  ADD CONSTRAINT "User_cargo_usuario_id_fkey"
    FOREIGN KEY ("cargo_usuario_id") REFERENCES "CatalogItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Anexos: classificar uploads por catálogo
ALTER TABLE "Anexo"
  ADD COLUMN "tipo_id" BIGINT;

CREATE INDEX IF NOT EXISTS "Anexo_tipo_idx" ON "Anexo" ("tipo_id");

ALTER TABLE "Anexo"
  ADD CONSTRAINT "Anexo_tipo_id_fkey"
    FOREIGN KEY ("tipo_id") REFERENCES "CatalogItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Discovery: severidade obrigatória e decisões parciais
ALTER TABLE "Discovery"
  ADD COLUMN "decisao_parcial_id" BIGINT;

CREATE INDEX IF NOT EXISTS "Discovery_decisao_parcial_idx" ON "Discovery" ("decisao_parcial_id");

ALTER TABLE "Discovery"
  ADD CONSTRAINT "Discovery_decisao_parcial_id_fkey"
    FOREIGN KEY ("decisao_parcial_id") REFERENCES "CatalogItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Assegurar severidade padrão antes de aplicar NOT NULL
DO $$
DECLARE
  discovery_row RECORD;
  default_severidade_id BIGINT;
BEGIN
  FOR discovery_row IN SELECT id, id_tenant FROM "Discovery" WHERE severidade_id IS NULL LOOP
    SELECT ci.id
      INTO default_severidade_id
      FROM "CatalogItem" ci
      JOIN "CatalogCategory" cc ON cc.id = ci.category_id
      WHERE cc.slug = 'severidade_problema'
        AND cc.tenant_id = discovery_row.id_tenant
      ORDER BY ci.ordem ASC, ci.id ASC
      LIMIT 1;

    IF default_severidade_id IS NOT NULL THEN
      UPDATE "Discovery"
        SET severidade_id = default_severidade_id
        WHERE id = discovery_row.id;
    END IF;
  END LOOP;
END
$$;

ALTER TABLE "Discovery"
  ALTER COLUMN "severidade_id" SET NOT NULL;

-- Entrevistas: persona catalogada
ALTER TABLE "Entrevista"
  ADD COLUMN "persona_id" BIGINT;

CREATE INDEX IF NOT EXISTS "Entrevista_persona_idx" ON "Entrevista" ("persona_id");

ALTER TABLE "Entrevista"
  ADD CONSTRAINT "Entrevista_persona_id_fkey"
    FOREIGN KEY ("persona_id") REFERENCES "CatalogItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

-- Experimentos: métrica de sucesso catalogada
ALTER TABLE "Experimento"
  ADD COLUMN "metrica_sucesso_id" BIGINT;

CREATE INDEX IF NOT EXISTS "Experimento_metrica_idx" ON "Experimento" ("metrica_sucesso_id");

ALTER TABLE "Experimento"
  ADD CONSTRAINT "Experimento_metrica_sucesso_id_fkey"
    FOREIGN KEY ("metrica_sucesso_id") REFERENCES "CatalogItem"("id")
    ON DELETE SET NULL ON UPDATE CASCADE;

