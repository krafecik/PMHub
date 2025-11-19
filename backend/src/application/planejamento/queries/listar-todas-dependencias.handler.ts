import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoDependenciaRepository,
  PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ListarTodasDependenciasQuery } from './listar-todas-dependencias.query';

@QueryHandler(ListarTodasDependenciasQuery)
@Injectable()
export class ListarTodasDependenciasHandler implements IQueryHandler<ListarTodasDependenciasQuery> {
  constructor(
    @Inject(PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN)
    private readonly dependenciaRepository: IPlanejamentoDependenciaRepository,
  ) {}

  async execute(query: ListarTodasDependenciasQuery) {
    const { tenantId, filtros } = query;
    const dependencias = await this.dependenciaRepository.listAll({
      tenantId,
      ...filtros,
    });

    return dependencias.map((dependencia) => {
      const obj = dependencia.toObject();
      return {
        ...obj,
        tipo: obj.tipo.getValue(),
        risco: obj.risco.getValue(),
      };
    });
  }
}
