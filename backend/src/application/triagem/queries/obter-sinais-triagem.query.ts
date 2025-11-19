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
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import {
  AnaliseSinaisService,
  TriagemSinal,
  TriagemAnaliseContexto,
} from '@domain/triagem/services/analise-sinais.service';

export class ObterSinaisTriagemQuery {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
  ) {}
}

export interface TriagemSinaisDto {
  sinais: Array<{
    tipo: string;
    titulo: string;
    descricao: string;
    severidade: 'danger' | 'warning' | 'success';
  }>;
}

@QueryHandler(ObterSinaisTriagemQuery)
export class ObterSinaisTriagemHandler
  implements IQueryHandler<ObterSinaisTriagemQuery, TriagemSinaisDto>
{
  constructor(
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(ANEXO_REPOSITORY_TOKEN)
    private readonly anexoRepository: IAnexoRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
    private readonly analiseSinaisService: AnaliseSinaisService,
  ) {}

  async execute(query: ObterSinaisTriagemQuery): Promise<TriagemSinaisDto> {
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
    ].filter((value): value is number => value !== null);
    const minCaracteresValores = [
      this.getMetadataNumber(impactoMeta, 'descriptionMinChars'),
      this.getMetadataNumber(complexidadeMeta, 'descriptionMinChars'),
    ].filter((value): value is number => value !== null);

    const minPalavras = minPalavrasValores.length > 0 ? Math.max(...minPalavrasValores) : 20;
    const minCaracteres = minCaracteresValores.length > 0 ? Math.max(...minCaracteresValores) : 160;
    const requireEvidence =
      this.getMetadataBoolean(impactoMeta, 'requireEvidence') ||
      this.getMetadataBoolean(complexidadeMeta, 'requireEvidence');

    const contexto: TriagemAnaliseContexto = {
      descricao: demanda.descricao,
      anexosCount: anexos.length,
      requireEvidence,
      minPalavrasDescricao: minPalavras,
      minCaracteresDescricao: minCaracteres,
    };

    const sinais = this.analiseSinaisService.avaliar(contexto);

    return {
      sinais: sinais.map((sinal) => this.toDto(sinal)),
    };
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

  private toSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private toDto(sinal: TriagemSinal) {
    return {
      tipo: sinal.tipo,
      titulo: sinal.titulo,
      descricao: sinal.descricao,
      severidade: sinal.severidade,
    };
  }
}
