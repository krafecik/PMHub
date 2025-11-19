import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoDependenciaRepository,
  PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { RemoverDependenciaCommand } from './remover-dependencia.command';

@CommandHandler(RemoverDependenciaCommand)
@Injectable()
export class RemoverDependenciaHandler implements ICommandHandler<RemoverDependenciaCommand> {
  constructor(
    @Inject(PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN)
    private readonly dependenciaRepository: IPlanejamentoDependenciaRepository,
  ) {}

  async execute(command: RemoverDependenciaCommand): Promise<void> {
    const { tenantId, dependenciaId } = command;
    await this.dependenciaRepository.deleteById(dependenciaId, tenantId);
  }
}
