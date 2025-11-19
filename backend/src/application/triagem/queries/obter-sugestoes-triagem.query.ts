import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import {
  ANEXO_REPOSITORY_TOKEN,
  IAnexoRepository,
} from '@infra/repositories/demandas/anexo.repository.interface';
import {
  DuplicatasRepository,
  DUPLICATAS_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/duplicatas.repository.interface';
import { DeteccaoDuplicataService } from '@domain/triagem/services/deteccao-duplicata.service';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import {
  SugestoesTriagemService,
  SugestoesTriagemContexto,
  TriagemSugestao,
  PossivelDuplicataResumo,
  DiscoveryRelacionadoResumo,
} from '@domain/triagem/services/sugestoes-triagem.service';
import { TenantId } from '@domain/shared/value-objects/tenant-id.vo';
import { ProductId } from '@domain/shared/value-objects/product-id.vo';
import { IDiscoveryRepository } from '@domain/discovery/repositories';
import { Demanda } from '@domain/demandas';

export class ObterSugestoesTriagemQuery {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
  ) {}
}

export interface TriagemSugestoesDto {
  sugestoes: Array<{
    tipo: string;
    titulo: string;
    descricao: string;
    prioridade: 'alta' | 'media' | 'baixa';
    relacionados?: Array<{
      id: string;
      titulo: string;
      referencia?: string;
      tipo: 'demanda' | 'discovery';
      metadados?: Record<string, unknown>;
    }>;
  }>;
}

@QueryHandler(ObterSugestoesTriagemQuery)
export class ObterSugestoesTriagemHandler
  implements IQueryHandler<ObterSugestoesTriagemQuery, TriagemSugestoesDto>
{
  constructor(
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(ANEXO_REPOSITORY_TOKEN)
    private readonly anexoRepository: IAnexoRepository,
    @Inject(DUPLICATAS_REPOSITORY_TOKEN)
    private readonly duplicatasRepository: DuplicatasRepository,
    private readonly deteccaoDuplicataService: DeteccaoDuplicataService,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
    @Inject('IDiscoveryRepository')
    private readonly discoveryRepository: IDiscoveryRepository,
    private readonly sugestoesService: SugestoesTriagemService,
  ) {}

  async execute(query: ObterSugestoesTriagemQuery): Promise<TriagemSugestoesDto> {
    const { tenantId, demandaId } = query;

    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new Error('Demanda não encontrada');
    }

    const triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);
    if (!triagem) {
      throw new Error('Triagem não encontrada');
    }

    const anexos = await this.anexoRepository.findByDemandaId(demandaId);

    const impactoMeta = await this.getCatalogMetadata(
      tenantId,
      CatalogCategorySlugs.IMPACTO_NIVEL,
      triagem.impacto?.value,
    );
    const complexidadeMeta = await this.getCatalogMetadata(
      tenantId,
      CatalogCategorySlugs.COMPLEXIDADE_NIVEL,
      triagem.complexidadeEstimada?.value,
    );

    const minPalavrasValores = [
      this.getMetadataNumber(impactoMeta, 'descriptionMinWords'),
      this.getMetadataNumber(complexidadeMeta, 'descriptionMinWords'),
    ].filter((valor): valor is number => valor !== null);
    const minCaracteresValores = [
      this.getMetadataNumber(impactoMeta, 'descriptionMinChars'),
      this.getMetadataNumber(complexidadeMeta, 'descriptionMinChars'),
    ].filter((valor): valor is number => valor !== null);

    const minPalavras = minPalavrasValores.length > 0 ? Math.max(...minPalavrasValores) : 20;
    const minCaracteres = minCaracteresValores.length > 0 ? Math.max(...minCaracteresValores) : 160;
    const descricao = (demanda.descricao ?? '').trim();
    const descricaoDetalhada = this.isDescricaoDetalhada(descricao, minPalavras, minCaracteres);

    const requireEvidence =
      this.getMetadataBoolean(impactoMeta, 'requireEvidence') ||
      this.getMetadataBoolean(complexidadeMeta, 'requireEvidence');
    const anexosPendentes = requireEvidence && anexos.length === 0;
    const checklistPendentes = triagem.getChecklistPendentes().length;

    const duplicatas = await this.encontrarDuplicatas(demanda, triagem, tenantId, demandaId, 3);
    const discoveriesRelacionados = await this.buscarDiscoveriesRelacionados(
      tenantId,
      demanda.produtoId,
    );

    const contexto: SugestoesTriagemContexto = {
      impacto: triagem.impacto?.value,
      urgencia: triagem.urgencia?.value,
      complexidade: triagem.complexidadeEstimada?.value,
      descricaoDetalhada,
      possuiDuplicatas: duplicatas.length > 0,
      duplicatas,
      discoveriesRelacionados,
      checklistPendentes,
      anexosObrigatoriosPendentes: anexosPendentes,
    };

    const sugestoes = this.sugestoesService.gerarSugestoes(contexto);

    return {
      sugestoes: sugestoes.map((sugestao) => this.toDto(sugestao)),
    };
  }

  private async encontrarDuplicatas(
    demanda: Demanda,
    triagem: Awaited<ReturnType<TriagemRepository['findByDemandaId']>>,
    tenantId: string,
    demandaId: string,
    limite: number,
  ): Promise<PossivelDuplicataResumo[]> {
    const demandasComparacao = await this.demandaRepository.findAll(demanda.tenantId, {
      status: ['NOVO', 'RASCUNHO', 'TRIAGEM'],
      page: 1,
      pageSize: 500,
    });

    const duplicatasRegistradas = triagem
      ? await this.duplicatasRepository.findByDemanda(triagem.id)
      : [];
    const duplicataTriagemIds = new Set(duplicatasRegistradas.map((dup) => dup.demandaOriginalId));

    const similares = demandasComparacao.data
      .filter((d: Demanda) => d.id !== demandaId && !duplicataTriagemIds.has(d.id ?? ''))
      .map((d: Demanda) => ({
        demanda: d,
        similaridade: this.deteccaoDuplicataService.calcularSimilaridade(demanda, d),
      }))
      .filter((s) => s.similaridade >= 50)
      .sort((a, b) => b.similaridade - a.similaridade)
      .slice(0, limite);

    return similares.map((item) => ({
      id: item.demanda.id ?? '',
      titulo: item.demanda.titulo.getValue(),
      similaridade: item.similaridade,
    }));
  }

  private async buscarDiscoveriesRelacionados(
    tenantId: string,
    produtoId: string,
  ): Promise<DiscoveryRelacionadoResumo[]> {
    if (!produtoId) {
      return [];
    }

    const resultado = await this.discoveryRepository.findByProduto(
      new TenantId(tenantId),
      new ProductId(produtoId),
      {
        page: 1,
        pageSize: 3,
        sortBy: 'updatedAt',
        sortOrder: 'desc',
      },
    );

    return resultado.items.map((discovery) => ({
      id: discovery.id?.getValue() ?? '',
      titulo: discovery.titulo,
      status: discovery.status.getSlug(),
      responsavel: discovery.responsavelNome,
    }));
  }

  private isDescricaoDetalhada(
    descricao: string,
    minPalavras: number,
    minCaracteres: number,
  ): boolean {
    const palavras = descricao.length > 0 ? descricao.split(/\s+/).filter(Boolean) : [];
    return descricao.length >= minCaracteres && palavras.length >= minPalavras;
  }

  private getMetadataNumber(metadata: Record<string, unknown> | null, key: string): number | null {
    if (!metadata) return null;
    const value = metadata[key];
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
      const parsed = Number(value);
      return Number.isFinite(parsed) ? parsed : null;
    }
    return null;
  }

  private getMetadataBoolean(metadata: Record<string, unknown> | null, key: string): boolean {
    if (!metadata) return false;
    const value = metadata[key];
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'sim'].includes(value.trim().toLowerCase());
    }
    if (typeof value === 'number') {
      return value > 0;
    }
    return false;
  }

  private async getCatalogMetadata(
    tenantId: string,
    categorySlug: string,
    value?: string,
  ): Promise<Record<string, unknown> | null> {
    if (!value) {
      return null;
    }

    const slug = this.toSlug(value);
    const items = await this.catalogoRepository.listItemsByCategory(tenantId, categorySlug);

    const item =
      items.find((catalogo) => catalogo.slug === slug) ||
      items.find(
        (catalogo) =>
          ((catalogo.metadata?.legacyValue as string | undefined) ?? '').toUpperCase() ===
          value.toUpperCase(),
      );

    return (item?.metadata as Record<string, unknown> | null | undefined) ?? null;
  }

  private toSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private toDto(sugestao: TriagemSugestao) {
    return {
      tipo: sugestao.tipo,
      titulo: sugestao.titulo,
      descricao: sugestao.descricao,
      prioridade: sugestao.prioridade,
      relacionados: sugestao.relacionados?.map((relacionado) => ({
        id: relacionado.id,
        titulo: relacionado.titulo,
        referencia: relacionado.referencia,
        tipo: relacionado.tipo,
        metadados: relacionado.metadados,
      })),
    };
  }
}
