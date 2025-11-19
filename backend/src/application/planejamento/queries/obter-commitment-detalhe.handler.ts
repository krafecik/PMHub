import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoCommitmentRepository,
  PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ObterCommitmentDetalheQuery } from './obter-commitment-detalhe.query';

@QueryHandler(ObterCommitmentDetalheQuery)
@Injectable()
export class ObterCommitmentDetalheHandler implements IQueryHandler<ObterCommitmentDetalheQuery> {
  constructor(
    @Inject(PLANEJAMENTO_COMMITMENT_REPOSITORY_TOKEN)
    private readonly commitmentRepository: IPlanejamentoCommitmentRepository,
  ) {}

  async execute(query: ObterCommitmentDetalheQuery) {
    const { tenantId, commitmentId } = query;
    const commitment = await this.commitmentRepository.findById(commitmentId, tenantId);

    if (!commitment) {
      throw new NotFoundException('Commitment não encontrado');
    }

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
  }
}
