import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ListarComentariosQuery } from './listar-comentarios.query';
import { Comentario } from '@domain/demandas';
import {
  IComentarioRepository,
  COMENTARIO_REPOSITORY_TOKEN,
} from '@infra/repositories/demandas/comentario.repository.interface';
import { PrismaService } from '@infra/database/prisma.service';

export interface ComentarioListItem {
  id: string;
  demandaId: string;
  usuarioId: string;
  usuarioNome?: string;
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
    private readonly prisma: PrismaService,
  ) {}

  async execute(query: ListarComentariosQuery): Promise<ComentarioListItem[]> {
    const comentarios = await this.comentarioRepository.findByDemandaId(query.demandaId);

    // Buscar nomes dos usuários
    const usuarioIds = Array.from(new Set(comentarios.map((c) => c.usuarioId)));

    const usuarios = await this.prisma.user.findMany({
      where: {
        id: { in: usuarioIds.map((id) => BigInt(id)) },
      },
      select: {
        id: true,
        nome: true,
      },
    });

    const usuarioPorId = new Map(usuarios.map((u) => [u.id.toString(), u.nome]));

    return comentarios.map((comentario: Comentario) => ({
      id: comentario.id!,
      demandaId: comentario.demandaId,
      usuarioId: comentario.usuarioId,
      usuarioNome: usuarioPorId.get(comentario.usuarioId) || `Usuário #${comentario.usuarioId}`,
      texto: comentario.texto,
      createdAt: comentario.createdAt!,
      updatedAt: comentario.updatedAt!,
      foiEditado: comentario.foiEditado(),
    }));
  }
}
