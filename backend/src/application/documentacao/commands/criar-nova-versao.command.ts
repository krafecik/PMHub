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

export interface CriarNovaVersaoPayload {
  tenantId: string;
  documentoId: string;
  versao: string;
  criadoPorId: string;
  objetivo?: string;
  contexto?: ContextoProps;
  requisitosFuncionais?: RequisitoFuncionalProps[];
  regrasNegocio?: RegraNegocioProps[];
  requisitosNaoFuncionais?: RequisitoNaoFuncionalProps[];
  fluxos?: FluxoProps;
  criteriosAceite?: CriterioAceiteProps[];
  riscos?: RiscoProps[];
  changelogResumo?: string;
}

export class CriarNovaVersaoCommand implements ICommand {
  constructor(public readonly payload: CriarNovaVersaoPayload) {}
}
