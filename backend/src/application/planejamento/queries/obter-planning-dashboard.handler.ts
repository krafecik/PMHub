import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanningCycleRepository,
  PLANNING_CYCLE_REPOSITORY_TOKEN,
  IPlanejamentoCapacityRepository,
  PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN,
  IPlanejamentoEpicoRepository,
  PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
  IPlanejamentoCommitmentRepository,
  PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ObterPlanningDashboardQuery } from './obter-planning-dashboard.query';
import { PlanejamentoInsightService } from '@application/planejamento/services/planejamento-insight.service';

@QueryHandler(ObterPlanningDashboardQuery)
@Injectable()
export class ObterPlanningDashboardHandler implements IQueryHandler<ObterPlanningDashboardQuery> {
  constructor(
    @Inject(PLANNING_CYCLE_REPOSITORY_TOKEN)
    private readonly planningCycleRepository: IPlanningCycleRepository,
    @Inject(PLANEJAMENTO_CAPACITY_REPOSITORY_TOKEN)
    private readonly capacityRepository: IPlanejamentoCapacityRepository,
    @Inject(PLANEJAMENTO_EPICO_REPOSITORY_TOKEN)
    private readonly epicoRepository: IPlanejamentoEpicoRepository,
    @Inject(PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN)
    private readonly commitmentRepository: IPlanejamentoCommitmentRepository,
    private readonly insightService: PlanejamentoInsightService,
  ) {}

  async execute(query: ObterPlanningDashboardQuery) {
    const { tenantId, quarter, produtoId } = query;

    const [cycle, capacity, epicosResult, commitment] = await Promise.all([
      this.planningCycleRepository.findActiveByQuarter(tenantId, quarter),
      this.capacityRepository.listByQuarter(tenantId, quarter),
      this.epicoRepository.list({ tenantId, quarter, page: 1, pageSize: 200 }),
      produtoId ? this.commitmentRepository.findByQuarter(tenantId, produtoId, quarter) : null,
    ]);

    const totalCapacity = capacity.reduce(
      (acc, snapshot) => acc + snapshot.toObject().capacidadeTotal,
      0,
    );
    const totalAllocated = capacity.reduce(
      (acc, snapshot) => acc + snapshot.toObject().capacidadeUsada,
      0,
    );

    const alerts = this.insightService.buildCapacityAlerts(capacity);

    const planningCyclePayload = cycle
      ? (() => {
          const obj = cycle.toObject();
          const status = obj.status;
          return {
            id: obj.id,
            tenantId: obj.tenantId,
            produtoId: obj.produtoId,
            quarter: obj.quarter.getValue(),
            status: status.slug,
            statusSlug: status.slug,
            statusLabel: status.label,
            statusId: status.id,
            statusMetadata: status.metadata ?? null,
            faseAtual: obj.faseAtual,
            checklist: obj.checklist,
            agendaUrl: obj.agendaUrl,
            participantesConfirmados: obj.participantesConfirmados,
            participantesTotais: obj.participantesTotais,
            dadosPreparacao: obj.dadosPreparacao,
            iniciadoEm: obj.iniciadoEm,
            finalizadoEm: obj.finalizadoEm,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt,
          };
        })()
      : null;

    return {
      quarter,
      planningCycle: planningCyclePayload,
      capacity: {
        total: totalCapacity,
        allocated: totalAllocated,
        utilization:
          totalCapacity > 0 ? Number(((totalAllocated / totalCapacity) * 100).toFixed(2)) : 0,
        squads: capacity.map((snapshot) => {
          const obj = snapshot.toObject();
          return {
            ...obj,
            quarter: obj.quarter.getValue(),
          };
        }),
      },
      epicos: {
        total: epicosResult.total,
        data: epicosResult.data.map((epico) => {
          const obj = epico.toObject();
          return {
            ...obj,
            status: obj.status.getValue(),
            health: obj.health.getValue(),
            quarter: obj.quarter.getValue(),
          };
        }),
      },
      commitment: commitment ? commitment.toResponse() : null,
      insights: alerts,
    };
  }
}
