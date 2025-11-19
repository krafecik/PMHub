import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ObterEstatisticasTriagemQuery } from './obter-estatisticas-triagem.query';
import {
  TriagemRepository,
  TRIAGEM_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/triagem.repository.interface';
import {
  SolicitacaoInfoRepository,
  SOLICITACAO_INFO_REPOSITORY_TOKEN,
} from '@infra/repositories/triagem/solicitacao-info.repository.interface';
import { StatusTriagemEnum } from '@domain/triagem';

export interface EstatisticasTriagemDto {
  totalPendentes: number;
  aguardandoInfo: number;
  prontosDiscovery: number;
  arquivados: number;
  duplicados: number;
  slaMedio: number; // em horas
  taxaDuplicacao: number; // percentual
  tempoMedioAguardandoInfo: number; // em dias
  taxaArquivamento: number; // percentual
  taxaAprovacao: number; // percentual (enviados para discovery)
  distribuicaoPorStatus: Record<string, number>;
  distribuicaoPorImpacto: Record<string, number>;
  distribuicaoPorUrgencia: Record<string, number>;
}

@QueryHandler(ObterEstatisticasTriagemQuery)
export class ObterEstatisticasTriagemHandler
  implements IQueryHandler<ObterEstatisticasTriagemQuery, EstatisticasTriagemDto>
{
  constructor(
    @Inject(TRIAGEM_REPOSITORY_TOKEN)
    private readonly triagemRepository: TriagemRepository,
    @Inject(SOLICITACAO_INFO_REPOSITORY_TOKEN)
    private readonly solicitacaoRepository: SolicitacaoInfoRepository,
  ) {}

  async execute(query: ObterEstatisticasTriagemQuery): Promise<EstatisticasTriagemDto> {
    const { tenantId, periodo } = query;

    // Buscar todas as triagens do período
    const triagens = await this.triagemRepository.findByTenantAndPeriodo(
      tenantId,
      periodo?.dataInicio,
      periodo?.dataFim,
    );

    // Contadores por status
    const distribuicaoPorStatus: Record<string, number> = {};
    const distribuicaoPorImpacto: Record<string, number> = {};
    const distribuicaoPorUrgencia: Record<string, number> = {};

    let totalPendentes = 0;
    let aguardandoInfo = 0;
    let prontosDiscovery = 0;
    let arquivados = 0;
    let duplicados = 0;
    let somaTempoTriagem = 0;
    let contagemTriadas = 0;

    for (const triagem of triagens) {
      // Contagem por status
      const status = triagem.statusTriagem.value;
      distribuicaoPorStatus[status] = (distribuicaoPorStatus[status] || 0) + 1;

      switch (status) {
        case StatusTriagemEnum.PENDENTE_TRIAGEM:
        case StatusTriagemEnum.RETOMADO_TRIAGEM:
          totalPendentes++;
          break;
        case StatusTriagemEnum.AGUARDANDO_INFO:
          aguardandoInfo++;
          break;
        case StatusTriagemEnum.PRONTO_DISCOVERY:
          prontosDiscovery++;
          break;
        case StatusTriagemEnum.ARQUIVADO_TRIAGEM:
          arquivados++;
          break;
        case StatusTriagemEnum.DUPLICADO:
          duplicados++;
          break;
      }

      // Distribuição por impacto
      if (triagem.impacto) {
        const impacto = triagem.impacto.value;
        distribuicaoPorImpacto[impacto] = (distribuicaoPorImpacto[impacto] || 0) + 1;
      }

      // Distribuição por urgência
      if (triagem.urgencia) {
        const urgencia = triagem.urgencia.value;
        distribuicaoPorUrgencia[urgencia] = (distribuicaoPorUrgencia[urgencia] || 0) + 1;
      }

      // Calcular tempo de triagem para triadas
      if (triagem.triadoEm) {
        const tempoTriagem = triagem.triadoEm.getTime() - triagem.createdAt.getTime();
        somaTempoTriagem += tempoTriagem;
        contagemTriadas++;
      }
    }

    const total = triagens.length;
    const slaMedio =
      contagemTriadas > 0
        ? Math.round(somaTempoTriagem / contagemTriadas / (1000 * 60 * 60)) // em horas
        : 0;

    // Buscar tempo médio aguardando informações
    const solicitacoes = await this.solicitacaoRepository.findByTenant(tenantId);
    let somaTempoResposta = 0;
    let contagemRespondidas = 0;

    for (const solicitacao of solicitacoes) {
      if (solicitacao.respondidoEm) {
        const tempoResposta = solicitacao.respondidoEm.getTime() - solicitacao.createdAt.getTime();
        somaTempoResposta += tempoResposta;
        contagemRespondidas++;
      }
    }

    const tempoMedioAguardandoInfo =
      contagemRespondidas > 0
        ? Math.round(somaTempoResposta / contagemRespondidas / (1000 * 60 * 60 * 24)) // em dias
        : 0;

    return {
      totalPendentes,
      aguardandoInfo,
      prontosDiscovery,
      arquivados,
      duplicados,
      slaMedio,
      taxaDuplicacao: total > 0 ? Math.round((duplicados / total) * 100) : 0,
      tempoMedioAguardandoInfo,
      taxaArquivamento: total > 0 ? Math.round((arquivados / total) * 100) : 0,
      taxaAprovacao: total > 0 ? Math.round((prontosDiscovery / total) * 100) : 0,
      distribuicaoPorStatus,
      distribuicaoPorImpacto,
      distribuicaoPorUrgencia,
    };
  }
}
