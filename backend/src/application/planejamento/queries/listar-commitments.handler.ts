import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoCommitmentRepository,
  PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ListarCommitmentsQuery } from './listar-commitments.query';

@QueryHandler(ListarCommitmentsQuery)
@Injectable()
export class ListarCommitmentsHandler implements IQueryHandler<ListarCommitmentsQuery> {
  constructor(
    @Inject(PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN)
    private readonly commitmentRepository: IPlanejamentoCommitmentRepository,
  ) {}

  async execute(query: ListarCommitmentsQuery) {
    const { tenantId, filtros } = query;
    const commitments = await this.commitmentRepository.listAll({
      tenantId,
      ...filtros,
    });

    return commitments.map((commitment) => {
      const obj = commitment.toPersistence();
      return {
        ...obj,
        quarter: obj.quarter.getValue(),
        tiers: {
          committed: {
            id: obj.tiers.committed.id,
            nome: obj.tiers.committed.label,
          },
          targeted: {
            id: obj.tiers.targeted.id,
            nome: obj.tiers.targeted.label,
          },
          aspirational: {
            id: obj.tiers.aspirational.id,
            nome: obj.tiers.aspirational.label,
          },
        },
      };
    });
  }
}
