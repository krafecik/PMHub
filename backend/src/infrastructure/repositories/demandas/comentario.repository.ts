import { Injectable } from '@nestjs/common';
import { PrismaService } from '@infra/database';
import { Comentario } from '@domain/demandas';
import { IComentarioRepository } from './comentario.repository.interface';

@Injectable()
export class ComentarioRepository implements IComentarioRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(comentario: Comentario): Promise<string> {
    const data = this.toPrisma(comentario);
    
    const created = await this.prisma.comentario.create({
      data: {
        demanda_id: BigInt(data.demanda_id),
        usuario_id: BigInt(data.usuario_id),
        texto: data.texto,
      },
    });

    return created.id.toString();
  }

  async findByDemandaId(demandaId: string): Promise<Comentario[]> {
    const comentarios = await this.prisma.comentario.findMany({
      where: {
        demanda_id: BigInt(demandaId),
      },
      orderBy: {
        created_at: 'desc',
      },
    });

    return comentarios.map((c: any) => this.toDomain(c));
  }

  async update(comentario: Comentario): Promise<void> {
    if (!comentario.id) throw new Error('Comentário sem ID não pode ser atualizado');
    
    await this.prisma.comentario.update({
      where: { id: BigInt(comentario.id) },
      data: {
        texto: comentario.texto,
        updated_at: new Date(),
      },
    });
  }

  async delete(id: string): Promise<void> {
    await this.prisma.comentario.delete({
      where: { id: BigInt(id) },
    });
  }

  private toPrisma(comentario: Comentario): any {
    const obj = comentario.toObject();
    return {
      id: obj.id ? BigInt(obj.id) : undefined,
      demanda_id: obj.demandaId,
      usuario_id: obj.usuarioId,
      texto: obj.texto,
      created_at: obj.createdAt,
      updated_at: obj.updatedAt,
    };
  }

  private toDomain(prismaData: any): Comentario {
    return Comentario.restore({
      id: prismaData.id.toString(),
      demandaId: prismaData.demanda_id.toString(),
      usuarioId: prismaData.usuario_id.toString(),
      texto: prismaData.texto,
      createdAt: prismaData.created_at,
      updatedAt: prismaData.updated_at,
    });
  }
}
