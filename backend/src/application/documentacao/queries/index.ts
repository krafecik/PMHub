export * from './listar-documentos.query';
export * from './listar-documentos.handler';
export * from './obter-documento.query';
export * from './obter-documento.handler';
export * from './listar-versoes-documento.query';
export * from './listar-versoes-documento.handler';
export * from './comparar-versoes-documento.query';
export * from './comparar-versoes-documento.handler';

import { ListarDocumentosHandler } from './listar-documentos.handler';
import { ObterDocumentoHandler } from './obter-documento.handler';
import { ListarVersoesDocumentoHandler } from './listar-versoes-documento.handler';
import { CompararVersoesDocumentoHandler } from './comparar-versoes-documento.handler';

export const DocumentacaoQueryHandlers = [
  ListarDocumentosHandler,
  ObterDocumentoHandler,
  ListarVersoesDocumentoHandler,
  CompararVersoesDocumentoHandler,
];
