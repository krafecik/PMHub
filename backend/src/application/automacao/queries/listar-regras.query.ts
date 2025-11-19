import { IQuery, IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IRegraAutomacaoRepository } from '@domain/automacao/repositories/regra-automacao.repository';

export class ListarRegrasQuery implements IQuery {
  constructor(
    public readonly tenantId: string,
    public readonly apenasAtivas?: boolean,
  ) {}
}

export interface RegraListItem {
  id: string;
  nome: string;
  descricao?: string;
  ativo: boolean;
  ordem: number;
  qtdCondicoes: number;
  qtdAcoes: number;
  criadoPor: string;
  criadoEm: Date;
  atualizadoEm: Date;
}

@QueryHandler(ListarRegrasQuery)
export class ListarRegrasHandler implements IQueryHandler<ListarRegrasQuery> {
  constructor(
    @Inject('RegraAutomacaoRepository')
    private readonly regraRepository: IRegraAutomacaoRepository,
  ) {}

  async execute(query: ListarRegrasQuery): Promise<RegraListItem[]> {
    const regras = query.apenasAtivas
      ? await this.regraRepository.findAtivasByTenant(query.tenantId)
      : await this.regraRepository.findByTenant(query.tenantId);

    return regras
      .map((regra: any) => ({
        id: regra.id.toValue(),
        nome: regra.nome.getValue(),
        descricao: regra.descricao,
        ativo: regra.ativo,
        ordem: regra.ordem,
        qtdCondicoes: regra.condicoes.length,
        qtdAcoes: regra.acoes.length,
        criadoPor: regra.criadoPor,
        criadoEm: regra.criadoEm,
        atualizadoEm: regra.atualizadoEm,
      }))
      .sort((a: any, b: any) => a.ordem - b.ordem);
  }
}
