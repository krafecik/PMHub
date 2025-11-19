-- Migration: Commitments vinculados a catálogos
-- Data: 2025-11-14

ALTER TABLE "PlanejamentoCommitment"
  ADD COLUMN "committed_item_id" BIGINT,
  ADD COLUMN "targeted_item_id" BIGINT,
  ADD COLUMN "aspirational_item_id" BIGINT;

-- Preencher referências para cada tenant utilizando slug padrão
WITH tier_category AS (
  SELECT id, tenant_id
  FROM "CatalogCategory"
  WHERE slug = 'planejamento_commitment_tier'
)
UPDATE "PlanejamentoCommitment" pc
SET committed_item_id = ci_committed.id,
    targeted_item_id = ci_targeted.id,
    aspirational_item_id = ci_aspirational.id
FROM tier_category cc
JOIN "CatalogItem" ci_committed
  ON ci_committed.category_id = cc.id
  AND ci_committed.slug = 'committed'
JOIN "CatalogItem" ci_targeted
  ON ci_targeted.category_id = cc.id
  AND ci_targeted.slug = 'targeted'
JOIN "CatalogItem" ci_aspirational
  ON ci_aspirational.category_id = cc.id
  AND ci_aspirational.slug = 'aspirational'
WHERE cc.tenant_id = pc.id_tenant;

-- Fallback: caso o slug tenha sido personalizado, utilizar legacyValue
UPDATE "PlanejamentoCommitment" pc
SET committed_item_id = ci.id
FROM "CatalogCategory" cc
JOIN "CatalogItem" ci ON ci.category_id = cc.id
WHERE cc.slug = 'planejamento_commitment_tier'
  AND cc.tenant_id = pc.id_tenant
  AND (ci.metadados ->> 'legacyValue') = 'COMMITTED'
  AND pc.committed_item_id IS NULL;

UPDATE "PlanejamentoCommitment" pc
SET targeted_item_id = ci.id
FROM "CatalogCategory" cc
JOIN "CatalogItem" ci ON ci.category_id = cc.id
WHERE cc.slug = 'planejamento_commitment_tier'
  AND cc.tenant_id = pc.id_tenant
  AND (ci.metadados ->> 'legacyValue') = 'TARGETED'
  AND pc.targeted_item_id IS NULL;

UPDATE "PlanejamentoCommitment" pc
SET aspirational_item_id = ci.id
FROM "CatalogCategory" cc
JOIN "CatalogItem" ci ON ci.category_id = cc.id
WHERE cc.slug = 'planejamento_commitment_tier'
  AND cc.tenant_id = pc.id_tenant
  AND (ci.metadados ->> 'legacyValue') = 'ASPIRATIONAL'
  AND pc.aspirational_item_id IS NULL;

ALTER TABLE "PlanejamentoCommitment"
  ALTER COLUMN "committed_item_id" SET NOT NULL,
  ALTER COLUMN "targeted_item_id" SET NOT NULL,
  ALTER COLUMN "aspirational_item_id" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "PlanejamentoCommitment_committed_item_idx"
  ON "PlanejamentoCommitment" ("committed_item_id");
CREATE INDEX IF NOT EXISTS "PlanejamentoCommitment_targeted_item_idx"
  ON "PlanejamentoCommitment" ("targeted_item_id");
CREATE INDEX IF NOT EXISTS "PlanejamentoCommitment_aspirational_item_idx"
  ON "PlanejamentoCommitment" ("aspirational_item_id");

ALTER TABLE "PlanejamentoCommitment"
  ADD CONSTRAINT "PlanejamentoCommitment_committed_item_id_fkey"
    FOREIGN KEY ("committed_item_id") REFERENCES "CatalogItem"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PlanejamentoCommitment"
  ADD CONSTRAINT "PlanejamentoCommitment_targeted_item_id_fkey"
    FOREIGN KEY ("targeted_item_id") REFERENCES "CatalogItem"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "PlanejamentoCommitment"
  ADD CONSTRAINT "PlanejamentoCommitment_aspirational_item_id_fkey"
    FOREIGN KEY ("aspirational_item_id") REFERENCES "CatalogItem"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remover enum legado
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'PlanejamentoCommitmentTier') THEN
    DROP TYPE "PlanejamentoCommitmentTier";
  END IF;
END
$$;


