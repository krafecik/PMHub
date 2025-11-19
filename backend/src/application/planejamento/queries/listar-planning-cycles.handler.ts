import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanningCycleRepository,
  PLANNING_CYCLE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ListarPlanningCyclesQuery } from './listar-planning-cycles.query';

@QueryHandler(ListarPlanningCyclesQuery)
@Injectable()
export class ListarPlanningCyclesHandler implements IQueryHandler<ListarPlanningCyclesQuery> {
  constructor(
    @Inject(PLANNING_CYCLE_REPOSITORY_TOKEN)
    private readonly planningCycleRepository: IPlanningCycleRepository,
  ) {}

  async execute(query: ListarPlanningCyclesQuery) {
    const cycles = await this.planningCycleRepository.list(query.tenantId, query.filters);
    return cycles.map((cycle) => {
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
    });
  }
}
