import { Comentario } from '@domain/demandas';

export const COMENTARIO_REPOSITORY_TOKEN = Symbol('IComentarioRepository');

export interface IComentarioRepository {
  save(comentario: Comentario): Promise<string>;
  findByDemandaId(demandaId: string): Promise<Comentario[]>;
  update(comentario: Comentario): Promise<void>;
  delete(id: string): Promise<void>;
}
