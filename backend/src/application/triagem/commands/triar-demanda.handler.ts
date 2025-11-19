import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { TriarDemandaCommand } from './triar-demanda.command';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import {
  TriagemDemanda,
  StatusTriagemEnum,
  Impacto,
  Urgencia,
  Complexidade,
  DemandaTriadaEvent,
} from '@domain/triagem';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';
import { StatusDemandaVO, Demanda } from '@domain/demandas';
import { TriagemAutomacaoService } from '../services/triagem-automacao.service';

@CommandHandler(TriarDemandaCommand)
export class TriarDemandaHandler implements ICommandHandler<TriarDemandaCommand> {
  constructor(
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
    private readonly automacaoService: TriagemAutomacaoService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: TriarDemandaCommand): Promise<void> {
    const {
      tenantId,
      demandaId,
      novoStatus,
      triadoPorId,
      impacto,
      urgencia,
      complexidade,
      checklistAtualizacoes,
    } = command;

    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new Error('Demanda não encontrada para triagem');
    }

    // Buscar ou criar triagem para a demanda
    let triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);

    if (!triagem) {
      triagem = await this.triagemRepository.create(TriagemDemanda.criarNova(demandaId));
    }

    const statusAnterior = triagem.statusTriagem.value;
    let triagemAlterada = false;
    let demandaAlterada = false;
    let statusEnum: StatusTriagemEnum | undefined;

    // Atualizar status apenas se fornecido
    if (novoStatus) {
      statusEnum = StatusTriagemEnum[novoStatus as keyof typeof StatusTriagemEnum];
      if (!statusEnum) {
        throw new Error(`Status de triagem inválido: ${novoStatus}`);
      }
      triagem.atualizarStatus(statusEnum, triadoPorId);
      triagemAlterada = true;
    }

    // Atualizar avaliações se fornecidas
    if (impacto || urgencia || complexidade) {
      triagem.definirAvaliacao(
        impacto ? Impacto.fromString(impacto) : undefined,
        urgencia ? Urgencia.fromString(urgencia) : undefined,
        complexidade ? Complexidade.fromString(complexidade) : undefined,
      );
      triagemAlterada = true;
    }

    // Atualizar checklist se fornecido
    if (checklistAtualizacoes) {
      for (const atualizacao of checklistAtualizacoes) {
        triagem.marcarChecklistItem(atualizacao.itemId, atualizacao.completed);
      }
      triagemAlterada = true;
    }

    // Se está sendo retomado após aguardar info, incrementar revisões
    if (statusEnum) {
      if (
        statusAnterior === StatusTriagemEnum.AGUARDANDO_INFO &&
        statusEnum === StatusTriagemEnum.RETOMADO_TRIAGEM
      ) {
        triagem.incrementarRevisoes();
        triagemAlterada = true;
      }
    }

    if (statusEnum) {
      const alterouDemanda = await this.sincronizarStatusDemanda(tenantId, demanda, statusEnum);
      demandaAlterada = demandaAlterada || alterouDemanda;
    }

    const automacao = await this.automacaoService.executar(tenantId, demanda, triagem, triadoPorId);
    if (automacao.triagemAlterada) {
      triagemAlterada = true;
    }
    if (automacao.demandaAlterada) {
      demandaAlterada = true;
    }

    if (triagemAlterada) {
      await this.triagemRepository.update(triagem);
    }

    if (demandaAlterada) {
      await this.demandaRepository.update(demanda);
    }

    if (statusEnum) {
      const evento = new DemandaTriadaEvent({
        demandaId,
        triagemId: triagem.id,
        statusAnterior,
        statusNovo: statusEnum,
        triadoPorId,
        timestamp: new Date(),
      });

      this.eventBus.publish(evento);
    }
  }

  private async sincronizarStatusDemanda(
    tenantId: string,
    demanda: Demanda,
    statusTriagem: StatusTriagemEnum,
  ): Promise<boolean> {
    const demandaStatusSlugByTriagem: Partial<Record<StatusTriagemEnum, string>> = {
      [StatusTriagemEnum.PRONTO_DISCOVERY]: CatalogDefaultSlugs.STATUS_DEMANDA_TRIAGEM,
      [StatusTriagemEnum.ARQUIVADO_TRIAGEM]: CatalogDefaultSlugs.STATUS_DEMANDA_ARQUIVADO,
      [StatusTriagemEnum.DUPLICADO]: CatalogDefaultSlugs.STATUS_DEMANDA_ARQUIVADO,
    };

    const demandaStatusSlug = demandaStatusSlugByTriagem[statusTriagem];

    if (!demandaStatusSlug) {
      return false;
    }

    const statusItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.STATUS_DEMANDA,
      slug: demandaStatusSlug,
    });
    const statusVO = StatusDemandaVO.fromCatalogItem(statusItem);

    if (statusTriagem === StatusTriagemEnum.PRONTO_DISCOVERY) {
      demanda.marcarParaTriagem(statusVO);
    } else {
      demanda.arquivar(statusVO);
    }

    return true;
  }
}
