import { DuplicatasDemanda } from '@domain/triagem';

export const DUPLICATAS_REPOSITORY_TOKEN = Symbol('DuplicatasRepository');

export interface DuplicatasRepository {
  findById(id: string): Promise<DuplicatasDemanda | null>;
  findByDemandaAndOriginal(
    demandaId: string,
    demandaOriginalId: string,
  ): Promise<DuplicatasDemanda | null>;
  findByDemanda(demandaId: string): Promise<DuplicatasDemanda[]>;
  findByDemandaOriginal(demandaOriginalId: string): Promise<DuplicatasDemanda[]>;
  create(duplicata: DuplicatasDemanda): Promise<DuplicatasDemanda>;
  delete(id: string): Promise<void>;
}
