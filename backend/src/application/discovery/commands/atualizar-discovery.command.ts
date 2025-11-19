import { ICommand } from '@nestjs/cqrs';

export class AtualizarDiscoveryCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly discoveryId: string,
    public readonly titulo?: string,
    public readonly descricao?: string,
    public readonly contexto?: string,
    public readonly publicoAfetado?: string[],
    public readonly volumeImpactado?: string,
    public readonly severidade?: string,
    public readonly comoIdentificado?: string[],
  ) {}
}

import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger, NotFoundException } from '@nestjs/common';
import { IDiscoveryRepository } from '../../../domain/discovery/repositories';
import { TenantId } from '../../../domain/shared/value-objects/tenant-id.vo';
import { DiscoveryId, SeveridadeProblemaVO } from '../../../domain/discovery/value-objects';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

@CommandHandler(AtualizarDiscoveryCommand)
export class AtualizarDiscoveryHandler implements ICommandHandler<AtualizarDiscoveryCommand> {
  private readonly logger = new Logger(AtualizarDiscoveryHandler.name);

  constructor(
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: AtualizarDiscoveryCommand): Promise<void> {
    const {
      tenantId,
      discoveryId,
      titulo,
      descricao,
      contexto,
      publicoAfetado,
      volumeImpactado,
      severidade,
      comoIdentificado,
    } = command;

    const tenant = new TenantId(tenantId);
    const discoveryIdVO = new DiscoveryId(discoveryId);

    const discovery = await this.discoveryRepository.findById(tenant, discoveryIdVO);

    if (!discovery) {
      throw new NotFoundException('Discovery não encontrado');
    }

    if (titulo !== undefined && titulo !== discovery.titulo) {
      discovery.updateTitulo(titulo);
    }

    if (descricao !== undefined && descricao !== discovery.descricao) {
      discovery.updateDescricao(descricao);
    }

    if (contexto !== undefined && contexto !== discovery.contexto) {
      discovery.updateContexto(contexto);
    }

    if (publicoAfetado) {
      discovery.updatePublicoAfetado(publicoAfetado);
    }

    if (comoIdentificado) {
      discovery.updateComoIdentificado(comoIdentificado);
    }

    if (volumeImpactado !== undefined && volumeImpactado !== discovery.volumeImpactado) {
      discovery.updateVolumeImpactado(volumeImpactado);
    }

    if (severidade) {
      const severidadeItem = await this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.SEVERIDADE_PROBLEMA,
        slug: normalizeCatalogSlug(severidade),
      });
      discovery.updateSeveridade(SeveridadeProblemaVO.fromCatalogItem(severidadeItem));
    }

    await this.discoveryRepository.update(discovery);

    this.logger.log(`Discovery ${discoveryId} atualizado com sucesso`);
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
