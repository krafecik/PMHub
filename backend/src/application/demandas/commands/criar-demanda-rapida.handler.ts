import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { CriarDemandaRapidaCommand } from './criar-demanda-rapida.command';
import {
  Demanda,
  DemandaCriadaEvent,
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
import { CatalogCategorySlugs, CatalogDefaultSlugs } from '@domain/catalog/catalog.constants';

const normalizeCatalogSlug = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_');

@CommandHandler(CriarDemandaRapidaCommand)
export class CriarDemandaRapidaHandler implements ICommandHandler<CriarDemandaRapidaCommand> {
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: CriarDemandaRapidaCommand): Promise<string> {
    const {
      tenantId,
      titulo,
      tipo,
      produtoId,
      criadoPorId,
      descricao,
      origem,
      origemDetalhe,
      prioridade,
      status,
      responsavelId,
    } = command;

    const tituloVO = TituloVO.create(titulo);
    const tipoItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.TIPO_DEMANDA,
      legacyValue: tipo,
    });
    const tipoVO = TipoDemandaVO.fromCatalogItem(tipoItem);

    const origemValor = origem?.trim();
    const origemItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.ORIGEM_DEMANDA,
      ...(origemValor
        ? {
            legacyValue: origemValor.toUpperCase(),
            slug: normalizeCatalogSlug(origemValor),
          }
        : {
            legacyValue: 'INTERNO',
            slug: CatalogDefaultSlugs.ORIGEM_INTERNA,
          }),
    });
    const origemVO = OrigemDemandaVO.fromCatalogItem(origemItem);

    const prioridadeValor = prioridade?.trim();
    const prioridadeItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.PRIORIDADE_NIVEL,
      ...(prioridadeValor
        ? {
            legacyValue: prioridadeValor.toUpperCase(),
            slug: normalizeCatalogSlug(prioridadeValor),
          }
        : {
            legacyValue: 'MEDIA',
            slug: CatalogDefaultSlugs.PRIORIDADE_MEDIA,
          }),
    });
    const prioridadeVO = PrioridadeVO.fromCatalogItem(prioridadeItem);

    const statusValor = status?.trim();
    const statusItem = await this.catalogoRepository.getRequiredItem({
      tenantId,
      category: CatalogCategorySlugs.STATUS_DEMANDA,
      ...(statusValor
        ? {
            legacyValue: statusValor.toUpperCase(),
            slug: normalizeCatalogSlug(statusValor),
          }
        : {
            legacyValue: 'NOVO',
            slug: CatalogDefaultSlugs.STATUS_DEMANDA_NOVO,
          }),
    });
    const statusVO = StatusDemandaVO.fromCatalogItem(statusItem);

    const trimmedResponsavelId = responsavelId?.trim();
    const sanitizedResponsavelId = trimmedResponsavelId ? trimmedResponsavelId : undefined;

    const demanda = Demanda.create({
      tenantId,
      titulo: tituloVO,
      descricao,
      tipo: tipoVO,
      produtoId,
      origem: origemVO,
      origemDetalhe,
      responsavelId: sanitizedResponsavelId,
      prioridade: prioridadeVO,
      status: statusVO,
      criadoPorId,
    });

    const demandaId = await this.demandaRepository.save(demanda);

    this.eventBus.publish(
      new DemandaCriadaEvent(
        demandaId,
        tenantId,
        titulo,
        tipoVO.slug,
        produtoId,
        origemVO.slug,
        criadoPorId,
        prioridadeVO.slug,
      ),
    );

    return demandaId;
  }
}
