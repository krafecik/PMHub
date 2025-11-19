import { ICommand } from '@nestjs/cqrs';

export class CriarHipoteseCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly discoveryId: string,
    public readonly titulo: string,
    public readonly descricao: string,
    public readonly comoValidar: string,
    public readonly metricaAlvo?: string,
    public readonly impactoEsperado: string = 'MEDIO',
    public readonly prioridade: string = 'MEDIA',
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Hipotese } from '../../../domain/discovery/entities';
import { IHipoteseRepository, IDiscoveryRepository } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  DiscoveryId,
  ImpactoHipoteseVO,
  PrioridadeHipoteseVO,
  StatusHipoteseEnum,
  StatusHipoteseVO,
} from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(CriarHipoteseCommand)
export class CriarHipoteseHandler implements ICommandHandler<CriarHipoteseCommand> {
  private readonly logger = new Logger(CriarHipoteseHandler.name);

  constructor(
    @Inject('IHipoteseRepository')
    private readonly hipoteseRepository: IHipoteseRepository,
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    private readonly eventBus: EventBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: CriarHipoteseCommand): Promise<string> {
    const {
      tenantId,
      discoveryId,
      titulo,
      descricao,
      comoValidar,
      metricaAlvo,
      impactoEsperado,
      prioridade,
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

    const impactoSlug = normalizeCatalogSlug(impactoEsperado ?? 'medio');
    const prioridadeSlug = normalizeCatalogSlug(prioridade ?? 'media');
    const statusSlug = StatusHipoteseVO.enumToSlug(StatusHipoteseEnum.PENDENTE);

    const [impactoItem, prioridadeItem, statusItem] = await Promise.all([
      this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.IMPACTO_HIPOTESE,
        slug: impactoSlug,
      }),
      this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.PRIORIDADE_HIPOTESE,
        slug: prioridadeSlug,
      }),
      this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.STATUS_HIPOTESE,
        slug: statusSlug,
      }),
    ]);

    const hipotese = Hipotese.create({
      tenantId: new TenantId(tenantId),
      discoveryId: new DiscoveryId(discoveryId),
      titulo,
      descricao,
      comoValidar,
      metricaAlvo,
      impactoEsperado: ImpactoHipoteseVO.fromCatalogItem(impactoItem),
      prioridade: PrioridadeHipoteseVO.fromCatalogItem(prioridadeItem),
      status: StatusHipoteseVO.fromCatalogItem(statusItem),
    });

    // Save hipotese
    const savedHipotese = await this.hipoteseRepository.save(hipotese);
    const hipoteseId = savedHipotese.id?.getValue() ?? '';

    this.logger.log(`Hipótese criada com ID: ${hipoteseId} para Discovery: ${discoveryId}`);

    return hipoteseId;
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
