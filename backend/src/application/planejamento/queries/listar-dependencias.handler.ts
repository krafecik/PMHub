import { Inject, Injectable } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
  IPlanejamentoDependenciaRepository,
  PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN,
} from '@infra/repositories/planejamento';
import { ListarDependenciasQuery } from './listar-dependencias.query';

@QueryHandler(ListarDependenciasQuery)
@Injectable()
export class ListarDependenciasHandler implements IQueryHandler<ListarDependenciasQuery> {
  constructor(
    @Inject(PLANEJAMENTO_DEPENDENCIA_REPOSITORY_TOKEN)
    private readonly dependenciaRepository: IPlanejamentoDependenciaRepository,
  ) {}

  async execute(query: ListarDependenciasQuery) {
    const { tenantId, featureId } = query;
    const dependencias = await this.dependenciaRepository.listByFeature(featureId, tenantId);
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
