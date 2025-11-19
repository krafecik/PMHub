import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPlanningCycleRepository,
  PLANNING_CYCLE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { PlanningCycleStatusVO } from '@domain/planejamento';
import { AtualizarPlanningCycleCommand } from './atualizar-planning-cycle.command';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(AtualizarPlanningCycleCommand)
@Injectable()
export class AtualizarPlanningCycleHandler
  implements ICommandHandler<AtualizarPlanningCycleCommand>
{
  constructor(
    @Inject(PLANNING_CYCLE_REPOSITORY_TOKEN)
    private readonly planningCycleRepository: IPlanningCycleRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: AtualizarPlanningCycleCommand): Promise<void> {
    const { tenantId, cycleId, payload } = command;
    const cycle = await this.planningCycleRepository.findById(cycleId, tenantId);

    if (!cycle) {
      throw new NotFoundException('Planning cycle não encontrado');
    }

    if (payload.statusSlug) {
      const novoStatus = await this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.PLANNING_CYCLE_STATUS,
        slug: payload.statusSlug.toLowerCase(),
        legacyValue: payload.statusSlug.toUpperCase(),
      });
      cycle.atualizarStatus(PlanningCycleStatusVO.fromCatalogItem(novoStatus), payload.faseAtual);
    } else if (typeof payload.faseAtual === 'number') {
      cycle.atualizarStatus(cycle.toObject().status, payload.faseAtual);
    }

    if (payload.checklist) {
      cycle.atualizarChecklist(payload.checklist);
    }

    if (
      typeof payload.participantesConfirmados === 'number' ||
      typeof payload.participantesTotais === 'number'
    ) {
      cycle.registrarParticipantes({
        confirmados: payload.participantesConfirmados ?? 0,
        total: payload.participantesTotais ?? 0,
      });
    }

    if (payload.agendaUrl !== undefined) {
      cycle.atualizarAgenda(payload.agendaUrl);
    }

    if (payload.dadosPreparacao) {
      cycle.atualizarDadosPreparacao(payload.dadosPreparacao);
    }

    await this.planningCycleRepository.save(cycle);
  }
}
