import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPlanningCycleRepository,
  PLANNING_CYCLE_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { RemoverPlanningCycleCommand } from './remover-planning-cycle.command';

@CommandHandler(RemoverPlanningCycleCommand)
@Injectable()
export class RemoverPlanningCycleHandler implements ICommandHandler<RemoverPlanningCycleCommand> {
  constructor(
    @Inject(PLANNING_CYCLE_REPOSITORY_TOKEN)
    private readonly planningCycleRepository: IPlanningCycleRepository,
  ) {}

  async execute(command: RemoverPlanningCycleCommand): Promise<void> {
    const { tenantId, cycleId } = command;
    const existing = await this.planningCycleRepository.findById(cycleId, tenantId);
    if (!existing) {
      throw new NotFoundException('Planning cycle não encontrado');
    }
    await this.planningCycleRepository.delete(cycleId, tenantId);
  }
}
