import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Dependencia,
  DependenciaRisco,
  DependenciaRiscoVO,
  DependenciaTipo,
  DependenciaTipoVO,
} from '@domain/planejamento';
import {
  IPlanejamentoDependenciaRepository,
  PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { RegistrarDependenciaCommand } from './registrar-dependencia.command';

@CommandHandler(RegistrarDependenciaCommand)
@Injectable()
export class RegistrarDependenciaHandler implements ICommandHandler<RegistrarDependenciaCommand> {
  constructor(
    @Inject(PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN)
    private readonly dependenciaRepository: IPlanejamentoDependenciaRepository,
  ) {}

  async execute(command: RegistrarDependenciaCommand): Promise<void> {
    const { dependenciaId, nota, risco, tenantId, tipo, featureBloqueadaId, featureBloqueadoraId } =
      command;

    if (dependenciaId) {
      const dependencias = await this.dependenciaRepository.listByFeature(
        featureBloqueadaId,
        tenantId,
      );
      const dependencia = dependencias.find((dep) => dep.id === dependenciaId);
      if (!dependencia) {
        throw new Error('Dependência não encontrada para atualização');
      }
      dependencia.atualizarRisco(DependenciaRiscoVO.fromEnum(risco as DependenciaRisco));
      dependencia.atualizarTipo(DependenciaTipoVO.fromEnum(tipo as DependenciaTipo));
      dependencia.adicionarNota(nota);
      await this.dependenciaRepository.save(dependencia);
      return;
    }

    const entidade = Dependencia.create({
      tenantId,
      featureBloqueadaId,
      featureBloqueadoraId,
      tipo: DependenciaTipoVO.fromEnum(tipo as DependenciaTipo),
      risco: DependenciaRiscoVO.fromEnum(risco as DependenciaRisco),
      nota,
    });

    await this.dependenciaRepository.save(entidade);
  }
}
