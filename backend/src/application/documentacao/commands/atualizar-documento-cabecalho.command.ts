import { ICommand } from '@nestjs/cqrs';

export interface AtualizarDocumentoCabecalhoPayload {
  tenantId: string;
  documentoId: string;
  titulo?: string;
  resumo?: string;
  tipo?: string;
  status?: string;
  produtoId?: string;
  pmId?: string;
  squadId?: string;
  atualizadoPorId: string;
}

export class AtualizarDocumentoCabecalhoCommand implements ICommand {
  constructor(public readonly payload: AtualizarDocumentoCabecalhoPayload) {}
}
