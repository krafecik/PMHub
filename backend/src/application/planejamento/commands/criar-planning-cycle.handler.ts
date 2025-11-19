import { Inject, Injectable, BadRequestException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPlanningCycleRepository,
  PLANNING_CYCLE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { PlanningCycle, PlanningCycleStatusVO, QuarterVO } from '@domain/planejamento';
import { CriarPlanningCycleCommand } from './criar-planning-cycle.command';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(CriarPlanningCycleCommand)
@Injectable()
export class CriarPlanningCycleHandler implements ICommandHandler<CriarPlanningCycleCommand> {
  constructor(
    @Inject(PLANNING_CYCLE_REPOSITORY_TOKEN)
    private readonly planningCycleRepository: IPlanningCycleRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: CriarPlanningCycleCommand): Promise<{ cycleId: string }> {
    const { tenantId, payload } = command;

    const existing = await this.planningCycleRepository.list(tenantId, {
      quarter: payload.quarter,
      produtoId: payload.produtoId,
    });
    if (existing.length > 0) {
      throw new BadRequestException('Já existe um planning cycle para este quarter/produto');
    }

    const statusItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.PLANNING_CYCLE_STATUS,
      slug: CatalogDefaultSlugs.PLANNING_CYCLE_NOT_STARTED,
    });

    const cycle = PlanningCycle.create({
      tenantId,
      produtoId: payload.produtoId,
      quarter: QuarterVO.create(payload.quarter),
      status: PlanningCycleStatusVO.fromCatalogItem(statusItem),
      checklist: payload.checklist ?? [],
      agendaUrl: payload.agendaUrl,
      participantesConfirmados: payload.participantesConfirmados,
      participantesTotais: payload.participantesTotais,
      dadosPreparacao: payload.dadosPreparacao,
    });

    const cycleId = await this.planningCycleRepository.save(cycle);
    return { cycleId };
  }
}
