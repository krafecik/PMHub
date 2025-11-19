import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListarDemandasPendentesQuery } from './listar-demandas-pendentes.query';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import {
  IDemandaRepository,
  DEMANDA_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/demanda.repository.interface';
import { PrismaService } from '@infra/database/prisma.service';
import { StatusTriagemEnum, TriagemDemanda } from '@domain/triagem';

export interface DemandaPendenteDto {
  id: string;
  titulo: string;
  descricao?: string;
  tipo: string;
  tipoLabel: string;
  origem: string;
  origemLabel: string;
  produto: {
    id: string;
    nome: string;
  };
  responsavel?: {
    id: string;
    nome: string;
  };
  criadoPor?: {
    id: string;
    nome: string;
  };
  triagem: {
    id: string;
    status: string;
    statusLabel: string;
    impacto?: string;
    urgencia?: string;
    complexidade?: string;
    checklist: any[];
    revisoesTriagem: number;
    diasEmTriagem: number;
    aguardandoInfo: boolean;
    possivelDuplicata?: boolean;
  };
  createdAt: string;
}

@QueryHandler(ListarDemandasPendentesQuery)
export class ListarDemandasPendentesHandler
  implements
    IQueryHandler<ListarDemandasPendentesQuery, { data: DemandaPendenteDto[]; total: number }>
{
  constructor(
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    @Inject(DEMANDA_REPOSITORY_TOKEN)
    private readonly demandaRepository: IDemandaRepository,
    private readonly prisma: PrismaService,
  ) {}

  async execute(
    query: ListarDemandasPendentesQuery,
  ): Promise<{ data: DemandaPendenteDto[]; total: number }> {
    const { tenantId, filtros = {}, paginacao = {} } = query;
    const { page = 1, pageSize = 20, orderBy = 'created_at', orderDirection = 'desc' } = paginacao;

    // Status de triagem que indicam demandas pendentes
    const statusPendentes = [
      StatusTriagemEnum.PENDENTE_TRIAGEM,
      StatusTriagemEnum.AGUARDANDO_INFO,
      StatusTriagemEnum.RETOMADO_TRIAGEM,
    ];

    // Buscar demandas com triagem nos status pendentes
    const { status: statusFiltroTriagem, ...filtrosRaw } = filtros;
    const statusFiltroTriagemArray = statusFiltroTriagem
      ? Array.isArray(statusFiltroTriagem)
        ? statusFiltroTriagem
        : [statusFiltroTriagem]
      : undefined;

    // Normalizar filtros para garantir que arrays sejam arrays
    const filtrosDemanda: {
      tipo?: string[];
      origem?: string[];
      produtoId?: string;
      responsavelId?: string;
      status: string[];
      page?: number;
      pageSize?: number;
      orderBy?: string;
      orderDirection?: 'asc' | 'desc';
    } = {
      status: ['NOVO', 'TRIAGEM'], // Status da demanda
      page,
      pageSize,
      orderBy,
      orderDirection,
    };

    if (filtrosRaw.tipo) {
      filtrosDemanda.tipo = Array.isArray(filtrosRaw.tipo) ? filtrosRaw.tipo : [filtrosRaw.tipo];
    }

    if (filtrosRaw.origem) {
      filtrosDemanda.origem = Array.isArray(filtrosRaw.origem)
        ? filtrosRaw.origem
        : [filtrosRaw.origem];
    }

    if (filtrosRaw.produtoId) {
      filtrosDemanda.produtoId = filtrosRaw.produtoId;
    }

    if (filtrosRaw.responsavelId) {
      filtrosDemanda.responsavelId = filtrosRaw.responsavelId;
    }

    const result = await this.demandaRepository.findAll(tenantId, filtrosDemanda);

    const demandas = result.data;
    const demandaIds = demandas.map((demanda) => demanda.id).filter((id): id is string => !!id);

    const triagens = await this.triagemRepository.findManyByDemandaIds(demandaIds);

    const [produtos, responsaveis, criadores] = await Promise.all([
      this.carregarProdutos(
        tenantId,
        demandas.map((demanda) => demanda.produtoId),
      ),
      this.carregarUsuarios(demandas.map((demanda) => demanda.responsavelId)),
      this.carregarUsuarios(demandas.map((demanda) => demanda.criadoPorId)),
    ]);

    const triagemPorDemanda = new Map(triagens.map((triagem) => [triagem.demandaId, triagem]));
    const produtoPorId = new Map(produtos.map((produto) => [produto.id.toString(), produto.nome]));
    const usuarioPorId = new Map(
      responsaveis.map((usuario) => [usuario.id.toString(), usuario.nome]),
    );
    const criadorPorId = new Map(criadores.map((usuario) => [usuario.id.toString(), usuario.nome]));

    // Criar registros de triagem automaticamente para demandas com status TRIAGEM que não têm registro
    const demandasSemTriagem = demandas.filter(
      (demanda) =>
        demanda.id &&
        demanda.status.slug.toUpperCase() === 'TRIAGEM' &&
        !triagemPorDemanda.has(demanda.id),
    );

    if (demandasSemTriagem.length > 0) {
      const novasTriagens = await Promise.all(
        demandasSemTriagem.map(async (demanda) => {
          const novaTriagem = TriagemDemanda.criarNova(demanda.id!);
          const triagemSalva = await this.triagemRepository.create(novaTriagem);
          return { demandaId: demanda.id!, triagem: triagemSalva };
        }),
      );

      // Atualizar o mapa de triagens
      novasTriagens.forEach(({ demandaId, triagem }) => {
        triagemPorDemanda.set(demandaId, triagem);
      });

      // Adicionar novas triagens à lista de triagens para carregar duplicatas
      triagens.push(...novasTriagens.map(({ triagem }) => triagem));
    }

    // Carregar duplicatas após criar novas triagens
    const todasDuplicatas = await this.carregarDuplicatas(triagens);
    const triagensComDuplicata = new Set(todasDuplicatas.map((dup) => dup.triagemId));

    const data = demandas
      .map((demanda) => {
        const demandaId = demanda.id;
        if (!demandaId) {
          return null;
        }

        const triagem = triagemPorDemanda.get(demandaId);

        // Só mostrar demandas que têm registro de triagem OU que têm status TRIAGEM
        // (as que têm status TRIAGEM já foram tratadas acima)
        if (!triagem) {
          return null;
        }

        const statusTriagem = triagem.statusTriagem.value;

        // Filtrar apenas status pendentes
        if (!statusPendentes.includes(statusTriagem as StatusTriagemEnum)) {
          return null;
        }

        // Aplicar filtro de status se fornecido
        if (statusFiltroTriagemArray) {
          if (!statusFiltroTriagemArray.includes(statusTriagem)) {
            return null;
          }
        }

        const checklist = triagem.checklist ?? TriagemDemanda.criarNova(demandaId).checklist;
        const diasEmTriagem = this.calcularDias(triagem.createdAt);

        return {
          id: demandaId,
          titulo: demanda.titulo.getValue(),
          descricao: demanda.descricao,
          tipo: demanda.tipo.slug,
          tipoLabel: this.getLabelForTipo(demanda.tipo.slug),
          origem: demanda.origem.slug,
          origemLabel: this.getLabelForOrigem(demanda.origem.slug),
          produto: {
            id: demanda.produtoId,
            nome: produtoPorId.get(demanda.produtoId) ?? `Produto ${demanda.produtoId}`,
          },
          responsavel: demanda.responsavelId
            ? {
                id: demanda.responsavelId,
                nome: usuarioPorId.get(demanda.responsavelId) ?? `Usuário ${demanda.responsavelId}`,
              }
            : undefined,
          criadoPor: demanda.criadoPorId
            ? {
                id: demanda.criadoPorId,
                nome: criadorPorId.get(demanda.criadoPorId) ?? `Usuário ${demanda.criadoPorId}`,
              }
            : undefined,
          triagem: {
            id: triagem.id ?? '',
            status: statusTriagem,
            statusLabel: this.getLabelForStatusTriagem(statusTriagem),
            impacto: triagem.impacto?.value,
            urgencia: triagem.urgencia?.value,
            complexidade: triagem.complexidadeEstimada?.value,
            checklist,
            revisoesTriagem: triagem.revisoesTriagem ?? 0,
            diasEmTriagem,
            aguardandoInfo: triagem.statusTriagem.isAguardandoInfo() ?? false,
            possivelDuplicata: triagensComDuplicata.has(triagem.id),
          },
          createdAt: demanda.createdAt?.toISOString() ?? new Date().toISOString(),
        } as DemandaPendenteDto;
      })
      .filter((item): item is DemandaPendenteDto => item !== null);

    return {
      data,
      total: data.length, // Total baseado nos itens filtrados
    };
  }

  private getLabelForTipo(tipo: string): string {
    const key = tipo.toUpperCase();
    const labels: Record<string, string> = {
      IDEIA: 'Ideia',
      PROBLEMA: 'Problema',
      OPORTUNIDADE: 'Oportunidade',
      OUTRO: 'Outro',
    };
    return labels[key] || tipo;
  }

  private getLabelForOrigem(origem: string): string {
    const key = origem.toUpperCase();
    const labels: Record<string, string> = {
      CLIENTE: 'Cliente',
      SUPORTE: 'Suporte',
      DIRETORIA: 'Diretoria',
      CS: 'Customer Success',
      VENDAS: 'Vendas',
      INTERNO: 'Interno',
    };
    return labels[key] || origem;
  }

  private getLabelForStatusTriagem(status: string): string {
    const labels: Record<string, string> = {
      PENDENTE_TRIAGEM: 'Pendente de Triagem',
      AGUARDANDO_INFO: 'Aguardando Informações',
      RETOMADO_TRIAGEM: 'Retomado para Triagem',
      PRONTO_DISCOVERY: 'Pronto para Discovery',
      EVOLUIU_EPICO: 'Evoluiu para Épico',
      ARQUIVADO_TRIAGEM: 'Arquivado',
      DUPLICADO: 'Duplicado',
    };
    return labels[status] || status;
  }

  private calcularDias(data?: Date): number {
    if (!data) {
      return 0;
    }

    const diffMs = Date.now() - data.getTime();
    return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
  }

  private async carregarProdutos(
    tenantId: string,
    ids: string[],
  ): Promise<Array<{ id: bigint; nome: string }>> {
    const produtoIds = Array.from(new Set(ids.filter((id) => !!id)));

    if (produtoIds.length === 0) {
      return [];
    }

    return this.prisma.produto.findMany({
      where: {
        tenant_id: BigInt(tenantId),
        id: { in: produtoIds.map((id) => BigInt(id)) },
      },
      select: {
        id: true,
        nome: true,
      },
    });
  }

  private async carregarUsuarios(
    ids: Array<string | undefined>,
  ): Promise<Array<{ id: bigint; nome: string }>> {
    const usuariosIds = Array.from(new Set(ids.filter((id): id is string => !!id)));

    if (usuariosIds.length === 0) {
      return [];
    }

    return this.prisma.user.findMany({
      where: {
        id: { in: usuariosIds.map((id) => BigInt(id)) },
      },
      select: {
        id: true,
        nome: true,
      },
    });
  }

  private async carregarDuplicatas(
    triagens: TriagemDemanda[],
  ): Promise<Array<{ triagemId: string }>> {
    if (triagens.length === 0) {
      return [];
    }

    const triagemIds = triagens.map((triagem) => triagem.id).filter((id): id is string => !!id);

    if (triagemIds.length === 0) {
      return [];
    }

    const duplicatas = await this.prisma.duplicatasDemanda.findMany({
      where: {
        demanda_id: {
          in: triagemIds.map((id) => BigInt(id)),
        },
      },
      select: {
        demanda_id: true,
      },
    });

    return duplicatas.map((item) => ({
      triagemId: item.demanda_id.toString(),
    }));
  }
}
