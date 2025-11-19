-- Create enums
CREATE TYPE "PlanejamentoEpicoStatus" AS ENUM ('PLANNED', 'IN_PROGRESS', 'AT_RISK', 'DONE', 'ON_HOLD');
CREATE TYPE "PlanejamentoEpicoHealth" AS ENUM ('GREEN', 'YELLOW', 'RED');
CREATE TYPE "PlanejamentoFeatureStatus" AS ENUM ('BACKLOG', 'PLANNED', 'IN_PROGRESS', 'BLOCKED', 'DONE', 'ON_HOLD');
CREATE TYPE "PlanejamentoDependenciaTipo" AS ENUM ('HARD', 'SOFT', 'RECURSO');
CREATE TYPE "PlanejamentoDependenciaRisco" AS ENUM ('ALTO', 'MEDIO', 'BAIXO');
CREATE TYPE "PlanejamentoCommitmentTier" AS ENUM ('COMMITTED', 'TARGETED', 'ASPIRATIONAL');
CREATE TYPE "PlanejamentoCenarioStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "SquadStatus" AS ENUM ('ACTIVE', 'INACTIVE');
CREATE TYPE "PlanningCycleStatus" AS ENUM ('NOT_STARTED', 'PREPARATION', 'ALIGNMENT', 'COMMITMENT', 'CLOSED');

-- Planejamento squads
CREATE TABLE "PlanejamentoSquad" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_tenant" BIGINT NOT NULL,
  "produto_id" BIGINT,
  "nome" TEXT NOT NULL,
  "slug" TEXT NOT NULL,
  "descricao" TEXT,
  "status" "SquadStatus" NOT NULL DEFAULT 'ACTIVE',
  "cor_token" TEXT,
  "timezone" TEXT DEFAULT 'America/Sao_Paulo',
  "capacidade_padrao" INTEGER,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ
);

CREATE UNIQUE INDEX "PlanejamentoSquad_id_tenant_slug_key" ON "PlanejamentoSquad"("id_tenant", "slug");
CREATE INDEX "PlanejamentoSquad_id_tenant_idx" ON "PlanejamentoSquad"("id_tenant");
CREATE INDEX "PlanejamentoSquad_produto_id_idx" ON "PlanejamentoSquad"("produto_id");

-- Planning cycle
CREATE TABLE "PlanningCycle" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_tenant" BIGINT NOT NULL,
  "produto_id" BIGINT,
  "quarter" TEXT NOT NULL,
  "status" "PlanningCycleStatus" NOT NULL DEFAULT 'NOT_STARTED',
  "fase_atual" INTEGER NOT NULL DEFAULT 1,
  "checklist" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "agenda_url" TEXT,
  "participantes_confirmados" INTEGER,
  "participantes_totais" INTEGER,
  "dados_preparacao" JSONB,
  "iniciado_em" TIMESTAMPTZ,
  "finalizado_em" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "PlanningCycle_tenant_quarter_idx" ON "PlanningCycle"("id_tenant", "quarter");
CREATE INDEX "PlanningCycle_produto_id_idx" ON "PlanningCycle"("produto_id");

-- Planejamento épicos
CREATE TABLE "PlanejamentoEpico" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_tenant" BIGINT NOT NULL,
  "produto_id" BIGINT NOT NULL,
  "planning_cycle_id" BIGINT,
  "squad_id" BIGINT,
  "owner_id" BIGINT NOT NULL,
  "sponsor_id" BIGINT,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "objetivo" TEXT,
  "value_proposition" TEXT,
  "criterios_aceite" TEXT,
  "riscos" TEXT,
  "status" "PlanejamentoEpicoStatus" NOT NULL DEFAULT 'PLANNED',
  "health" "PlanejamentoEpicoHealth" NOT NULL DEFAULT 'GREEN',
  "quarter" TEXT NOT NULL,
  "progress_percent" INTEGER NOT NULL DEFAULT 0,
  "data_inicio" TIMESTAMPTZ,
  "data_fim" TIMESTAMPTZ,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ
);

CREATE INDEX "PlanejamentoEpico_id_tenant_idx" ON "PlanejamentoEpico"("id_tenant");
CREATE INDEX "PlanejamentoEpico_produto_id_idx" ON "PlanejamentoEpico"("produto_id");
CREATE INDEX "PlanejamentoEpico_quarter_idx" ON "PlanejamentoEpico"("quarter");
CREATE INDEX "PlanejamentoEpico_squad_id_idx" ON "PlanejamentoEpico"("squad_id");

-- Planejamento features
CREATE TABLE "PlanejamentoFeature" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_tenant" BIGINT NOT NULL,
  "epico_id" BIGINT NOT NULL,
  "squad_id" BIGINT,
  "titulo" TEXT NOT NULL,
  "descricao" TEXT,
  "pontos" INTEGER,
  "status" "PlanejamentoFeatureStatus" NOT NULL DEFAULT 'PLANNED',
  "riscos" TEXT,
  "criterios_aceite" TEXT,
  "dependencias_json" JSONB DEFAULT '[]'::jsonb,
  "revisado_por_id" BIGINT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "deleted_at" TIMESTAMPTZ
);

CREATE INDEX "PlanejamentoFeature_id_tenant_idx" ON "PlanejamentoFeature"("id_tenant");
CREATE INDEX "PlanejamentoFeature_epico_id_idx" ON "PlanejamentoFeature"("epico_id");
CREATE INDEX "PlanejamentoFeature_squad_id_idx" ON "PlanejamentoFeature"("squad_id");
CREATE INDEX "PlanejamentoFeature_status_idx" ON "PlanejamentoFeature"("status");

-- Dependências
CREATE TABLE "PlanejamentoDependencia" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_tenant" BIGINT NOT NULL,
  "feature_bloqueada_id" BIGINT NOT NULL,
  "feature_bloqueadora_id" BIGINT NOT NULL,
  "tipo" "PlanejamentoDependenciaTipo" NOT NULL,
  "risco" "PlanejamentoDependenciaRisco" NOT NULL,
  "nota" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "PlanejamentoDependencia_feature_pair_key"
  ON "PlanejamentoDependencia"("feature_bloqueada_id", "feature_bloqueadora_id");
CREATE INDEX "PlanejamentoDependencia_id_tenant_idx" ON "PlanejamentoDependencia"("id_tenant");
CREATE INDEX "PlanejamentoDependencia_bloqueada_idx" ON "PlanejamentoDependencia"("feature_bloqueada_id");
CREATE INDEX "PlanejamentoDependencia_bloqueadora_idx" ON "PlanejamentoDependencia"("feature_bloqueadora_id");

-- Capacity snapshots
CREATE TABLE "PlanejamentoCapacitySnapshot" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_tenant" BIGINT NOT NULL,
  "squad_id" BIGINT NOT NULL,
  "quarter" TEXT NOT NULL,
  "capacidade_total" INTEGER NOT NULL,
  "capacidade_usada" INTEGER NOT NULL,
  "buffer_percentual" INTEGER NOT NULL DEFAULT 0,
  "ajustes_json" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "PlanejamentoCapacitySnapshot_squad_quarter_key"
  ON "PlanejamentoCapacitySnapshot"("squad_id", "quarter");
CREATE INDEX "PlanejamentoCapacitySnapshot_tenant_quarter_idx"
  ON "PlanejamentoCapacitySnapshot"("id_tenant", "quarter");

-- Commitments
CREATE TABLE "PlanejamentoCommitment" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_tenant" BIGINT NOT NULL,
  "produto_id" BIGINT NOT NULL,
  "planning_cycle_id" BIGINT,
  "quarter" TEXT NOT NULL,
  "committed_epicos" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "targeted_epicos" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "aspirational_epicos" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "assinaturas" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "documento_url" TEXT,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "PlanejamentoCommitment_produto_quarter_key"
  ON "PlanejamentoCommitment"("produto_id", "quarter");
CREATE INDEX "PlanejamentoCommitment_id_tenant_idx" ON "PlanejamentoCommitment"("id_tenant");

-- Cenários
CREATE TABLE "PlanejamentoCenario" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_tenant" BIGINT NOT NULL,
  "planning_cycle_id" BIGINT,
  "quarter" TEXT NOT NULL,
  "nome" TEXT NOT NULL,
  "descricao" TEXT,
  "status" "PlanejamentoCenarioStatus" NOT NULL DEFAULT 'DRAFT',
  "ajustes_capacidade" JSONB NOT NULL DEFAULT '[]'::jsonb,
  "incluir_contractors" BOOLEAN NOT NULL DEFAULT FALSE,
  "considerar_ferias" BOOLEAN NOT NULL DEFAULT FALSE,
  "buffer_risco_percentual" INTEGER NOT NULL DEFAULT 0,
  "resultado" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "PlanejamentoCenario_tenant_quarter_idx"
  ON "PlanejamentoCenario"("id_tenant", "quarter");

-- Decision logs
CREATE TABLE "PlanejamentoDecisionLog" (
  "id" BIGSERIAL PRIMARY KEY,
  "id_tenant" BIGINT NOT NULL,
  "planning_cycle_id" BIGINT,
  "usuario_id" BIGINT NOT NULL,
  "tipo" TEXT NOT NULL,
  "descricao" TEXT NOT NULL,
  "payload" JSONB,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX "PlanejamentoDecisionLog_id_tenant_idx" ON "PlanejamentoDecisionLog"("id_tenant");

-- Foreign keys
ALTER TABLE "PlanejamentoSquad"
  ADD CONSTRAINT "PlanejamentoSquad_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoSquad_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlanningCycle"
  ADD CONSTRAINT "PlanningCycle_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanningCycle_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlanejamentoEpico"
  ADD CONSTRAINT "PlanejamentoEpico_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoEpico_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoEpico_planning_cycle_id_fkey" FOREIGN KEY ("planning_cycle_id") REFERENCES "PlanningCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoEpico_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "PlanejamentoSquad"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoEpico_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoEpico_sponsor_id_fkey" FOREIGN KEY ("sponsor_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlanejamentoFeature"
  ADD CONSTRAINT "PlanejamentoFeature_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoFeature_epico_id_fkey" FOREIGN KEY ("epico_id") REFERENCES "PlanejamentoEpico"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoFeature_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "PlanejamentoSquad"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoFeature_revisado_por_id_fkey" FOREIGN KEY ("revisado_por_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlanejamentoDependencia"
  ADD CONSTRAINT "PlanejamentoDependencia_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoDependencia_feature_bloqueada_id_fkey" FOREIGN KEY ("feature_bloqueada_id") REFERENCES "PlanejamentoFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoDependencia_feature_bloqueadora_id_fkey" FOREIGN KEY ("feature_bloqueadora_id") REFERENCES "PlanejamentoFeature"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlanejamentoCapacitySnapshot"
  ADD CONSTRAINT "PlanejamentoCapacitySnapshot_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoCapacitySnapshot_squad_id_fkey" FOREIGN KEY ("squad_id") REFERENCES "PlanejamentoSquad"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "PlanejamentoCommitment"
  ADD CONSTRAINT "PlanejamentoCommitment_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoCommitment_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "Produto"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoCommitment_planning_cycle_id_fkey" FOREIGN KEY ("planning_cycle_id") REFERENCES "PlanningCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlanejamentoCenario"
  ADD CONSTRAINT "PlanejamentoCenario_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoCenario_planning_cycle_id_fkey" FOREIGN KEY ("planning_cycle_id") REFERENCES "PlanningCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "PlanejamentoDecisionLog"
  ADD CONSTRAINT "PlanejamentoDecisionLog_id_tenant_fkey" FOREIGN KEY ("id_tenant") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoDecisionLog_planning_cycle_id_fkey" FOREIGN KEY ("planning_cycle_id") REFERENCES "PlanningCycle"("id") ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT "PlanejamentoDecisionLog_usuario_id_fkey" FOREIGN KEY ("usuario_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

