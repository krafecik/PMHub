import { ICommand } from '@nestjs/cqrs';
import {
  CriterioAceiteProps,
  ContextoProps,
  FluxoProps,
  RegraNegocioProps,
  RequisitoFuncionalProps,
  RequisitoNaoFuncionalProps,
  RiscoProps,
} from '@domain/documentacao';

export interface AtualizarDocumentoSecoesPayload {
  tenantId: string;
  documentoId: string;
  atualizadoPorId: string;
  objetivo?: string;
  contexto?: ContextoProps;
  requisitosFuncionais?: RequisitoFuncionalProps[];
  regrasNegocio?: RegraNegocioProps[];
  requisitosNaoFuncionais?: RequisitoNaoFuncionalProps[];
  fluxos?: FluxoProps;
  criteriosAceite?: CriterioAceiteProps[];
  riscos?: RiscoProps[];
}

export class AtualizarDocumentoSecoesCommand implements ICommand {
  constructor(public readonly payload: AtualizarDocumentoSecoesPayload) {}
}
