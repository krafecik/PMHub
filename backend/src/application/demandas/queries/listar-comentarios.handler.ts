import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListarComentariosQuery } from './listar-comentarios.query';
import { Comentario } from '@domain/demandas';
import {
  IComentarioRepository,
  COMENTARIO_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/comentario.repository.interface';

export interface ComentarioListItem {
  id: string;
  demandaId: string;
  usuarioId: string;
  texto: string;
  createdAt: Date;
  updatedAt: Date;
  foiEditado: boolean;
}

@QueryHandler(ListarComentariosQuery)
export class ListarComentariosHandler implements IQueryHandler<ListarComentariosQuery> {
  constructor(
    @Inject(COMENTARIO_REPOSITORY_TOKEN)
    private readonly comentarioRepository: IComentarioRepository,
  ) {}

  async execute(query: ListarComentariosQuery): Promise<ComentarioListItem[]> {
    const comentarios = await this.comentarioRepository.findByDemandaId(
      query.demandaId,
    );

    return comentarios.map((comentario: Comentario) => ({
      id: comentario.id!,
      demandaId: comentario.demandaId,
      usuarioId: comentario.usuarioId,
      texto: comentario.texto,
      createdAt: comentario.createdAt!,
      updatedAt: comentario.updatedAt!,
      foiEditado: comentario.foiEditado(),
    }));
  }
}
