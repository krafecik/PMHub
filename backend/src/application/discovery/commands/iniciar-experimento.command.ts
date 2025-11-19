import { ICommand } from '@nestjs/cqrs';

export class IniciarExperimentoCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly discoveryId: string,
    public readonly hipoteseId: string | undefined,
    public readonly titulo: string,
    public readonly descricao: string,
    public readonly tipo: string,
    public readonly metricaSucesso: string,
    public readonly grupoControle?: unknown,
    public readonly grupoVariante?: unknown,
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Experimento } from '../../../domain/discovery/entities';
import {
  IExperimentoRepository,
  IDiscoveryRepository,
} from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  DiscoveryId,
  HipoteseId,
  TipoExperimentoVO,
  StatusExperimentoVO,
  MetricaSucessoExperimentoVO,
} from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(IniciarExperimentoCommand)
export class IniciarExperimentoHandler implements ICommandHandler<IniciarExperimentoCommand> {
  private readonly logger = new Logger(IniciarExperimentoHandler.name);

  constructor(
    @Inject('IExperimentoRepository')
    private readonly experimentoRepository: IExperimentoRepository,
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    private readonly eventBus: EventBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: IniciarExperimentoCommand): Promise<string> {
    const {
      tenantId,
      discoveryId,
      hipoteseId,
      titulo,
      descricao,
      tipo,
      metricaSucesso,
      grupoControle,
      grupoVariante,
    } = command;

    // Validate that discovery exists and is active
    const discovery = await this.discoveryRepository.findById(
      new TenantId(tenantId),
      new DiscoveryId(discoveryId),
    );

    if (!discovery) {
      throw new NotFoundException('Discovery não encontrado');
    }

    if (!discovery.isActive()) {
      throw new Error('Discovery não está ativo');
    }

    const tipoSlug = normalizeCatalogSlug(tipo);
    const metricaSlug = metricaSucesso ? normalizeCatalogSlug(metricaSucesso) : undefined;

    const [tipoItem, statusPlanejadoItem, metricaItem] = await Promise.all([
      this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.TIPO_EXPERIMENTO,
        slug: tipoSlug,
      }),
      this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.STATUS_EXPERIMENTO,
        slug: CatalogDefaultSlugs.STATUS_EXPERIMENTO_PLANEJADO,
      }),
      metricaSlug
        ? this.catalogoRepository.findItem({
            tenantId,
            category: CatalogCategorySlugs.METRICA_SUCESSO_DISCOVERY,
            slug: metricaSlug,
          })
        : Promise.resolve(null),
    ]);

    const experimento = Experimento.create({
      tenantId: new TenantId(tenantId),
      discoveryId: new DiscoveryId(discoveryId),
      hipoteseId: hipoteseId ? new HipoteseId(hipoteseId) : undefined,
      titulo,
      descricao,
      tipo: TipoExperimentoVO.fromCatalogItem(tipoItem),
      metricaSucesso,
      metricaSucessoCatalogo: metricaItem
        ? MetricaSucessoExperimentoVO.fromCatalogItem(metricaItem)
        : undefined,
      grupoControle,
      grupoVariante,
      status: StatusExperimentoVO.fromCatalogItem(statusPlanejadoItem),
    });

    // If groups are provided, configure them
    if (grupoControle && grupoVariante) {
      experimento.configurarGrupos(grupoControle, grupoVariante);
    }

    // Save experimento
    const savedExperimento = await this.experimentoRepository.save(experimento);
    const experimentoId = savedExperimento.id?.getValue() ?? '';

    this.logger.log(`Experimento criado com ID: ${experimentoId} para Discovery: ${discoveryId}`);

    return experimentoId;
  }
}

const normalizeCatalogSlug = (value: string): string =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
