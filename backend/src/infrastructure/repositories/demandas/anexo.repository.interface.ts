export const ANEXO_REPOSITORY_TOKEN = Symbol('IAnexoRepository');

export interface AnexoData {
  demandaId: string;
  arquivoUrl: string;
  nome: string;
  tipoMime: string;
  tamanho: number;
  criadoPorId: string;
}

export interface Anexo {
  id: string;
  demandaId: string;
  arquivoUrl: string;
  nome: string;
  tipoMime: string;
  tamanho: number;
  criadoPorId: string;
  createdAt: Date;
}

export interface IAnexoRepository {
  save(data: AnexoData): Promise<string>;
  findByDemandaId(demandaId: string): Promise<Anexo[]>;
  delete(id: string): Promise<void>;
}
