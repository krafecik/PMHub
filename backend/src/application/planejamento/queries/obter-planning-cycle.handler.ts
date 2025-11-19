import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanningCycleRepository,
  PLANNING_CYCLE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ObterPlanningCycleQuery } from './obter-planning-cycle.query';

@QueryHandler(ObterPlanningCycleQuery)
@Injectable()
export class ObterPlanningCycleHandler implements IQueryHandler<ObterPlanningCycleQuery> {
  constructor(
    @Inject(PLANNING_CYCLE_REPOSITORY_TOKEN)
    private readonly planningCycleRepository: IPlanningCycleRepository,
  ) {}

  async execute(query: ObterPlanningCycleQuery) {
    const cycle = await this.planningCycleRepository.findById(query.cycleId, query.tenantId);
    if (!cycle) {
      throw new NotFoundException('Planning cycle não encontrado');
    }
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
  }
}
