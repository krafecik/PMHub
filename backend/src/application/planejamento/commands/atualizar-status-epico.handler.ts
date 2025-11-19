import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { EpicoHealth, EpicoHealthVO, EpicoStatus, EpicoStatusVO } from '@domain/planejamento';
import {
  IPlanejamentoEpicoRepository,
  PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { AtualizarStatusEpicoCommand } from './atualizar-status-epico.command';

@CommandHandler(AtualizarStatusEpicoCommand)
@Injectable()
export class AtualizarStatusEpicoHandler implements ICommandHandler<AtualizarStatusEpicoCommand> {
  constructor(
    @Inject(PLANEJAMENTO_EPICO_REPOSITORY_TOKEN)
    private readonly epicoRepository: IPlanejamentoEpicoRepository,
  ) {}

  async execute(command: AtualizarStatusEpicoCommand): Promise<void> {
    const { epicoId, tenantId, status, health, progressPercent } = command;
    const epico = await this.epicoRepository.findById(epicoId, tenantId);

    if (!epico) {
      throw new NotFoundException('Épico não encontrado');
    }

    epico.atualizarStatus(EpicoStatusVO.fromEnum(status as EpicoStatus));
    if (health) {
      epico.atualizarHealth(EpicoHealthVO.fromEnum(health as EpicoHealth));
    }
    if (typeof progressPercent === 'number') {
      epico.atualizarProgresso(progressPercent);
    }

    await this.epicoRepository.save(epico);
  }
}
