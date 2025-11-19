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
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(AtualizarDemandaCommand)
export class AtualizarDemandaHandler implements ICommandHandler<AtualizarDemandaCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: AtualizarDemandaCommand): Promise<void> {
    const { tenantId, demandaId, ...updates } = command;

    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    if (updates.titulo !== undefined) {
      demanda.atualizarTitulo(TituloVO.create(updates.titulo));
    }

    if (updates.descricao !== undefined) {
      demanda.atualizarDescricao(updates.descricao);
    }

    if (updates.tipo !== undefined) {
      const tipoItem = await this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.TIPO_DEMANDA,
        legacyValue: updates.tipo,
      });
      demanda.alterarTipo(TipoDemandaVO.fromCatalogItem(tipoItem));
    }

    if (updates.origem !== undefined) {
      const origemItem = await this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.ORIGEM_DEMANDA,
        legacyValue: updates.origem,
      });
      demanda.alterarOrigem(OrigemDemandaVO.fromCatalogItem(origemItem), updates.origemDetalhe);
    } else if (updates.origemDetalhe !== undefined) {
      demanda.alterarOrigem(demanda.origem, updates.origemDetalhe);
    }

    if (updates.prioridade !== undefined) {
      const prioridadeItem = await this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.PRIORIDADE_NIVEL,
        legacyValue: updates.prioridade,
      });
      demanda.alterarPrioridade(PrioridadeVO.fromCatalogItem(prioridadeItem));
    }

    if (updates.responsavelId !== undefined) {
      if (updates.responsavelId === null) {
        demanda.removerResponsavel();
      } else {
        demanda.atribuirResponsavel(updates.responsavelId);
      }
    }

    if (updates.status !== undefined) {
      const statusItem = await this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.STATUS_DEMANDA,
        legacyValue: updates.status,
      });
      demanda.alterarStatus(StatusDemandaVO.fromCatalogItem(statusItem));
    }

    await this.demandaRepository.update(demanda);
  }
}
