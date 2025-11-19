export * from './criar-documento.command';
export * from './criar-documento.handler';
export * from './atualizar-documento-cabecalho.command';
export * from './atualizar-documento-cabecalho.handler';
export * from './atualizar-documento-secoes.command';
export * from './atualizar-documento-secoes.handler';
export * from './criar-nova-versao.command';
export * from './criar-nova-versao.handler';

import { CriarDocumentoHandler } from './criar-documento.handler';
import { AtualizarDocumentoCabecalhoHandler } from './atualizar-documento-cabecalho.handler';
import { AtualizarDocumentoSecoesHandler } from './atualizar-documento-secoes.handler';
import { CriarNovaVersaoHandler } from './criar-nova-versao.handler';

export const DocumentacaoCommandHandlers = [
  CriarDocumentoHandler,
  AtualizarDocumentoCabecalhoHandler,
  AtualizarDocumentoSecoesHandler,
  CriarNovaVersaoHandler,
];
