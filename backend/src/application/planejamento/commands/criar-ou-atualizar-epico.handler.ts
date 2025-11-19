import { Inject, Injectable } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  Epico,
  EpicoHealth,
  EpicoHealthVO,
  EpicoStatus,
  EpicoStatusVO,
  QuarterVO,
} from '@domain/planejamento';
import {
  IPlanejamentoEpicoRepository,
  PLANEJAMENTO_EPICO_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { CriarOuAtualizarEpicoCommand } from './criar-ou-atualizar-epico.command';

@CommandHandler(CriarOuAtualizarEpicoCommand)
@Injectable()
export class CriarOuAtualizarEpicoHandler implements ICommandHandler<CriarOuAtualizarEpicoCommand> {
  constructor(
    @Inject(PLANEJAMENTO_EPICO_REPOSITORY_TOKEN)
    private readonly epicoRepository: IPlanejamentoEpicoRepository,
  ) {}

  async execute(command: CriarOuAtualizarEpicoCommand): Promise<{ epicoId: string }> {
    const { tenantId, payload } = command;
    const quarterVO = QuarterVO.create(payload.quarter);
    let epico: Epico | null = null;

    if (payload.epicoId) {
      epico = await this.epicoRepository.findById(payload.epicoId, tenantId);
    }

    if (!epico) {
      epico = Epico.create({
        tenantId,
        produtoId: payload.produtoId,
        planningCycleId: payload.planningCycleId,
        squadId: payload.squadId,
        titulo: payload.titulo,
        descricao: payload.descricao,
        objetivo: payload.objetivo,
        valueProposition: payload.valueProposition,
        quarter: quarterVO,
        ownerId: payload.ownerId,
        sponsorId: payload.sponsorId,
        criteriosAceite: payload.criteriosAceite,
        riscos: payload.riscos,
        status: payload.status ? EpicoStatusVO.fromEnum(payload.status as EpicoStatus) : undefined,
        health: payload.health ? EpicoHealthVO.fromEnum(payload.health as EpicoHealth) : undefined,
      });
    } else {
      epico.atualizarDescricao(payload.descricao);
      epico.atualizarObjetivo(payload.objetivo, payload.valueProposition);
      epico.definirCriteriosERiscos(payload.criteriosAceite, payload.riscos);
      epico.atribuirSquad(payload.squadId);
      epico.definirDatas(payload.startDate, payload.endDate);
      epico.atualizarProgresso(payload.progressPercent ?? epico.toObject().progressPercent ?? 0);
      if (payload.status) {
        epico.atualizarStatus(EpicoStatusVO.fromEnum(payload.status as EpicoStatus));
      }
      if (payload.health) {
        epico.atualizarHealth(EpicoHealthVO.fromEnum(payload.health as EpicoHealth));
      }
    }

    const epicoId = await this.epicoRepository.save(epico);

    return { epicoId };
  }
}
