import { ICommand } from '@nestjs/cqrs';

export class GerarInsightCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly discoveryId: string,
    public readonly entrevistaId: string | undefined,
    public readonly descricao: string,
    public readonly impacto: string = 'MEDIO',
    public readonly confianca: string = 'MEDIA',
    public readonly tags: string[] = [],
    public readonly evidenciasIds: string[] = [],
  ) {}
}

import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Insight } from '../../../domain/discovery/entities';
import { IInsightRepository, IDiscoveryRepository } from '../../../domain/discovery/repositories';
import { InsightGeradoEvent } from '../../../domain/discovery/events';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import {
  DiscoveryId,
  EntrevistaId,
  ImpactoInsightVO,
  ConfiancaInsightVO,
  StatusInsightVO,
} from '../../../domain/discovery/value-objects';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(GerarInsightCommand)
export class GerarInsightHandler implements ICommandHandler<GerarInsightCommand> {
  private readonly logger = new Logger(GerarInsightHandler.name);

  constructor(
    @Inject('IInsightRepository')
    private readonly insightRepository: IInsightRepository,
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    private readonly eventBus: EventBus,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: GerarInsightCommand): Promise<string> {
    const {
      tenantId,
      discoveryId,
      entrevistaId,
      descricao,
      impacto,
      confianca,
      tags,
      evidenciasIds,
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

    // Create insight
    if (!impacto || !confianca) {
      throw new Error('Impacto e confiança são obrigatórios');
    }

    const [impactoItem, confiancaItem, statusItem] = await Promise.all([
      this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.IMPACTO_INSIGHT,
        slug: normalizeCatalogSlug(impacto),
      }),
      this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.CONFIANCA_INSIGHT,
        slug: normalizeCatalogSlug(confianca),
      }),
      this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.STATUS_INSIGHT,
        slug: CatalogDefaultSlugs.STATUS_INSIGHT_RASCUNHO,
      }),
    ]);

    const impactoVO = ImpactoInsightVO.fromCatalogItem(impactoItem);
    const confiancaVO = ConfiancaInsightVO.fromCatalogItem(confiancaItem);
    const statusVO = StatusInsightVO.fromCatalogItem(statusItem);

    const insight = Insight.create({
      tenantId: new TenantId(tenantId),
      discoveryId: new DiscoveryId(discoveryId),
      entrevistaId: entrevistaId ? new EntrevistaId(entrevistaId) : undefined,
      descricao,
      impacto: impactoVO,
      confianca: confiancaVO,
      status: statusVO,
      tags,
      evidenciasIds,
    });

    // Save insight
    const savedInsight = await this.insightRepository.save(insight);
    const insightId = savedInsight.id?.getValue() ?? '';

    // Emit event
    const event = new InsightGeradoEvent(
      insightId,
      discoveryId,
      tenantId,
      descricao,
      impactoVO.getSlug(),
      confiancaVO.getSlug(),
      entrevistaId,
    );

    this.eventBus.publish(event);

    this.logger.log(`Insight gerado com ID: ${insightId} para Discovery: ${discoveryId}`);

    return insightId;
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
