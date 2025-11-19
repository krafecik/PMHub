import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import { PrismaService } from '@infra/database/prisma.service';
import { DeteccaoDuplicataService } from '@domain/triagem/services/deteccao-duplicata.service';
import { Demanda } from '@domain/demandas';

export class ObterHistoricoSolucoesQuery {
  constructor(
    public readonly tenantId: string,
    public readonly demandaId: string,
  ) {}
}

export interface HistoricoSolucaoDto {
  demandaId: string;
  titulo: string;
  produtoNome: string;
  tipo: string;
  statusTriagem: string;
  statusTriagemLabel: string;
  similaridade: number;
  criadoEm: string;
}

@QueryHandler(ObterHistoricoSolucoesQuery)
export class ObterHistoricoSolucoesHandler
  implements IQueryHandler<ObterHistoricoSolucoesQuery, { historico: HistoricoSolucaoDto[] }>
{
  constructor(
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    private readonly prisma: PrismaService,
    private readonly deteccaoDuplicataService: DeteccaoDuplicataService,
  ) {}

  async execute(query: ObterHistoricoSolucoesQuery): Promise<{ historico: HistoricoSolucaoDto[] }> {
    const { tenantId, demandaId } = query;

    const demandaAtual = await this.demandaRepository.findById(tenantId, demandaId);
    if (!demandaAtual) {
      throw new Error('Demanda não encontrada');
    }

    const historico = await this.buscarHistorico(
      tenantId,
      demandaAtual,
      demandaId,
      demandaAtual.produtoId,
    );

    return { historico };
  }

  private async buscarHistorico(
    tenantId: string,
    demandaAtual: Demanda,
    demandaId: string,
    produtoId: string,
  ): Promise<HistoricoSolucaoDto[]> {
    const statusTriagemSlugs = ['evoluiu_epico', 'pronto_discovery'];

    const resultados = await this.prisma.triagemDemanda.findMany({
      where: {
        status: {
          slug: { in: statusTriagemSlugs },
        },
        demanda: {
          tenant_id: BigInt(tenantId),
          produto_id: BigInt(produtoId),
          id: { not: BigInt(demandaId) },
        },
      },
      include: {
        status: true,
        demanda: {
          include: {
            produto: true,
            tipo: { include: { categoria: true } },
          },
        },
      },
      orderBy: {
        updated_at: 'desc',
      },
      take: 100,
    });

    const comparacoes = await Promise.all(
      resultados.map(async (item) => {
        const demandaComparacao = await this.demandaRepository.findById(
          tenantId,
          item.demanda_id.toString(),
        );

        if (!demandaComparacao) {
          return null;
        }

        const similaridade = this.deteccaoDuplicataService.calcularSimilaridade(
          demandaAtual,
          demandaComparacao,
        );

        return { item, similaridade, demandaComparacao };
      }),
    );

    const similares = comparacoes
      .filter((entrada): entrada is NonNullable<typeof entrada> => entrada !== null)
      .filter(({ similaridade }) => similaridade >= 40)
      .sort((a, b) => b.similaridade - a.similaridade)
      .slice(0, 5)
      .map(({ item, similaridade, demandaComparacao }) => ({
        demandaId: item.demanda_id.toString(),
        titulo: demandaComparacao.titulo.getValue(),
        produtoNome: item.demanda?.produto?.nome ?? 'Produto',
        tipo: item.demanda?.tipo?.label ?? demandaComparacao.tipo.label,
        statusTriagem: item.status?.slug ?? 'desconhecido',
        statusTriagemLabel: item.status?.label ?? 'Status desconhecido',
        similaridade,
        criadoEm: demandaComparacao.createdAt?.toISOString() ?? new Date().toISOString(),
      }));

    return similares;
  }
}
