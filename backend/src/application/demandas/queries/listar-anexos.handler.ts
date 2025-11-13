import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListarAnexosQuery } from './listar-anexos.query';
import {
  IAnexoRepository,
  ANEXO_REPOSITORY_TOKEN,
  Anexo,
} from '@infra/repositories/demandas/anexo.repository.interface';

@QueryHandler(ListarAnexosQuery)
export class ListarAnexosHandler implements IQueryHandler<ListarAnexosQuery> {
  constructor(
    @Inject(ANEXO_REPOSITORY_TOKEN)
    private readonly anexoRepository: IAnexoRepository,
  ) {}

  async execute(query: ListarAnexosQuery): Promise<Anexo[]> {
    return this.anexoRepository.findByDemandaId(query.demandaId);
  }
}
