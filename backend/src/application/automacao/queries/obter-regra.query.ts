import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IRegraAutomacaoRepository } from '@domain/automacao/repositories/regra-automacao.repository';
import { CondicaoRegraDTO } from '@domain/automacao/value-objects/condicao-regra.vo';
import { AcaoRegraDTO } from '@domain/automacao/value-objects/acao-regra.vo';

export class ObterRegraQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
  ) {}
}

export interface RegraDetalhada {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  ordem: number;
  condicoes: CondicaoRegraDTO[];
  acoes: AcaoRegraDTO[];
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

@QueryHandler(ObterRegraQuery)
export class ObterRegraHandler implements IQueryHandler<ObterRegraQuery> {
  constructor(
    @Inject('RegraAutomacaoRepository')
    private readonly regraRepository: IRegraAutomacaoRepository,
  ) {}

  async execute(query: ObterRegraQuery): Promise<RegraDetalhada | null> {
    const regra = await this.regraRepository.findById(query.tenantId, query.id);

    if (!regra) {
      return null;
    }

    const dto = regra.toDTO();

    return {
      id: dto.id ?? regra.id.toValue(),
      nome: dto.nome,
      descricao: dto.descricao,
      ativo: dto.ativo,
      ordem: dto.ordem,
      condicoes: dto.condicoes,
      acoes: dto.acoes,
      criadoPor: dto.criadoPor,
      criadoEm: dto.criadoEm,
      atualizadoEm: dto.atualizadoEm,
    };
  }
}
