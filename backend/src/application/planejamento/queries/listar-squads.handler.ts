import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoSquadRepository,
  PLANEJAMENTO_SQUAD_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ListarSquadsQuery } from './listar-squads.query';

@QueryHandler(ListarSquadsQuery)
@Injectable()
export class ListarSquadsHandler implements IQueryHandler<ListarSquadsQuery> {
  constructor(
    @Inject(PLANEJAMENTO_SQUAD_REPOSITORY_TOKEN)
    private readonly squadRepository: IPlanejamentoSquadRepository,
  ) {}

  async execute(query: ListarSquadsQuery) {
    const squads = await this.squadRepository.listByTenant(query.tenantId);
    return squads.map((squad) => {
      const obj = squad.toObject();
      const status = obj.status;
      const statusMetadata = status.metadata ?? undefined;
      const statusLegacy = status.legacyValue ?? status.slug;
      return {
        ...obj,
        status: statusLegacy,
        statusSlug: status.slug,
        statusLabel: status.label,
        statusMetadata,
        statusId: status.id,
      };
    });
  }
}
