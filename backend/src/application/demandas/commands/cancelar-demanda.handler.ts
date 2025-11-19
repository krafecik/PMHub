import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { CancelarDemandaCommand } from './cancelar-demanda.command';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import { StatusDemandaVO } from '@domain/demandas';

@CommandHandler(CancelarDemandaCommand)
export class CancelarDemandaHandler implements ICommandHandler<CancelarDemandaCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: CancelarDemandaCommand): Promise<void> {
    const { tenantId, demandaId, motivoCancelamento } = command;

    if (!motivoCancelamento || motivoCancelamento.trim().length === 0) {
      throw new BadRequestException('Motivo do cancelamento é obrigatório');
    }

    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new NotFoundException('Demanda não encontrada');
    }

    // Buscar status "arquivado" (usado para cancelamento)
    const statusArquivado = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.STATUS_DEMANDA,
      slug: 'arquivado',
    });

    const statusArquivadoVO = StatusDemandaVO.fromCatalogItem(statusArquivado);

    // Cancelar a demanda
    demanda.cancelar(statusArquivadoVO, motivoCancelamento.trim());

    await this.demandaRepository.update(demanda);
  }
}
