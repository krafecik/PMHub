import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { BuscarDuplicatasQuery } from './buscar-duplicatas.query';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import {
  DuplicatasRepository,
  DUPLICATAS_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/duplicatas.repository.interface';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import { PrismaService } from '@infra/database/prisma.service';
import { DeteccaoDuplicataService } from '@domain/triagem/services/deteccao-duplicata.service';
import { Demanda } from '@domain/demandas';

export interface DuplicataSugeridaDto {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  origem: string;
  produtoNome: string;
  similaridade: number;
  createdAt: string;
  status: string;
}

@QueryHandler(BuscarDuplicatasQuery)
export class BuscarDuplicatasHandler
  implements IQueryHandler<BuscarDuplicatasQuery, DuplicataSugeridaDto[]>
{
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    @Inject(DUPLICATAS_REPOSITORY_TOKEN)
    private readonly duplicatasRepository: DuplicatasRepository,
    private readonly deteccaoService: DeteccaoDuplicataService,
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: BuscarDuplicatasQuery): Promise<DuplicataSugeridaDto[]> {
    const { tenantId, demandaId, limite = 5 } = query;

    const demanda = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demanda) {
      throw new Error(`Demanda não encontrada: ${demandaId}`);
    }

    // Buscar todas as demandas do mesmo tenant para comparação
    // (exceto arquivadas e a própria demanda)
    const demandasParaComparar = await this.demandaRepository.findAll(demanda.tenantId, {
      status: ['NOVO', 'RASCUNHO', 'TRIAGEM'],
      page: 1,
      pageSize: 1000, // Limitar busca para performance
    });

    // Buscar triagem da demanda
    const triagem = await this.triagemRepository.findByDemandaId(demandaId, tenantId);

    // Buscar duplicatas já registradas
    const duplicatasRegistradas = triagem
      ? await this.duplicatasRepository.findByDemanda(triagem.id)
      : [];

    const duplicataTriagemIds = new Set(duplicatasRegistradas.map((dup) => dup.demandaOriginalId));

    // Buscar triagens das demandas já marcadas como duplicatas
    const triagensDuplicatas =
      duplicataTriagemIds.size > 0
        ? await this.triagemRepository.findManyByDemandaIds(Array.from(duplicataTriagemIds))
        : [];

    const duplicataDemandaIds = new Set(triagensDuplicatas.map((triagem) => triagem.demandaId));

    // Calcular similaridade com cada demanda
    const similares = demandasParaComparar.data
      .filter((d: Demanda) => d.id !== demandaId && !duplicataDemandaIds.has(d.id ?? ''))
      .map((d: Demanda) => ({
        demanda: d,
        similaridade: this.deteccaoService.calcularSimilaridade(demanda, d),
      }))
      .filter((s: { demanda: Demanda; similaridade: number }) => s.similaridade >= 50) // Apenas similaridade acima de 50%
      .sort(
        (a: { similaridade: number }, b: { similaridade: number }) =>
          b.similaridade - a.similaridade,
      )
      .slice(0, limite);

    // Buscar produtos
    const produtoIds = Array.from(new Set(similares.map((s) => s.demanda.produtoId)));
    const produtos =
      produtoIds.length > 0
        ? await this.prisma.produto.findMany({
            where: {
              id: { in: produtoIds.map((id) => BigInt(id)) },
            },
            select: {
              id: true,
              nome: true,
            },
          })
        : [];

    const produtoPorId = new Map(produtos.map((produto) => [produto.id.toString(), produto.nome]));

    // Mapear para DTO
    return similares.map((s: { demanda: Demanda; similaridade: number }) => ({
      id: s.demanda.id || '',
      titulo: s.demanda.titulo.getValue(),
      descricao: s.demanda.descricao,
      tipo: s.demanda.tipo.slug,
      origem: s.demanda.origem.slug,
      produtoNome: produtoPorId.get(s.demanda.produtoId) ?? `Produto ${s.demanda.produtoId}`,
      similaridade: s.similaridade,
      createdAt: s.demanda.createdAt?.toISOString() || new Date().toISOString(),
      status: s.demanda.status.slug,
    }));
  }
}
