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

export interface CriarDocumentoCommandProps {
  tenantId: string;
  tipo: string;
  titulo: string;
  resumo?: string;
  status?: string;
  produtoId?: string;
  pmId?: string;
  squadId?: string;
  criadoPorId: string;
  versao?: string;
  objetivo?: string;
  contexto?: ContextoProps;
  requisitosFuncionais?: RequisitoFuncionalProps[];
  regrasNegocio?: RegraNegocioProps[];
  requisitosNaoFuncionais?: RequisitoNaoFuncionalProps[];
  fluxos?: FluxoProps;
  criteriosAceite?: CriterioAceiteProps[];
  riscos?: RiscoProps[];
}

export class CriarDocumentoCommand implements ICommand {
  constructor(public readonly props: CriarDocumentoCommandProps) {}
}
