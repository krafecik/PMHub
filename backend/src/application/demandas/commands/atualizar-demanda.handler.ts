import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException } from '@nestjs/common';
import { AtualizarDemandaCommand } from './atualizar-demanda.command';
import {
  TituloVO,
  TipoDemandaVO,
  OrigemDemandaVO,
  PrioridadeVO,
  StatusDemandaVO,
} from '@domain/demandas';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';

@CommandHandler(AtualizarDemandaCommand)
export class AtualizarDemandaHandler implements ICommandHandler<AtualizarDemandaCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
  ) {}

  async execute(command: AtualizarDemandaCommand): Promise<void> {
    const { tenantId, demandaId, ...updates } = command;

    // Buscar demanda existente
    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    // Aplicar atualizações
    if (updates.titulo !== undefined) {
      demanda.atualizarTitulo(TituloVO.create(updates.titulo));
    }

    if (updates.descricao !== undefined) {
      demanda.atualizarDescricao(updates.descricao);
    }

    if (updates.prioridade !== undefined) {
      demanda.alterarPrioridade(PrioridadeVO.create(updates.prioridade));
    }

    if (updates.responsavelId !== undefined) {
      if (updates.responsavelId === null) {
        demanda.removerResponsavel();
      } else {
        demanda.atribuirResponsavel(updates.responsavelId);
      }
    }

    if (updates.status !== undefined) {
      demanda.alterarStatus(StatusDemandaVO.create(updates.status));
    }

    // Salvar alterações
    await this.demandaRepository.update(demanda);
  }
}
