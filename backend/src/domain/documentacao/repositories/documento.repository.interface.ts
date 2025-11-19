import { Documento } from '../entities/documento.aggregate';
import { DocumentoVersao } from '../entities/documento-versao.entity';

export interface ListarDocumentosFiltro {
  tenantId: string;
  termo?: string;
  tipos?: string[];
  status?: string[];
  produtoId?: string;
  pmId?: string;
  squadId?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
}

export interface ListarDocumentosResultado {
  itens: Documento[];
  total: number;
  page: number;
  pageSize: number;
}

export const DOCUMENTO_REPOSITORY_TOKEN = 'DocumentoRepository';

export interface DocumentoRepository {
  criar(documento: Documento): Promise<void>;
  salvar(documento: Documento): Promise<void>;
  encontrarPorId(tenantId: string, documentoId: string): Promise<Documento | null>;
  listar(filtro: ListarDocumentosFiltro): Promise<ListarDocumentosResultado>;
  criarVersao(versao: DocumentoVersao): Promise<void>;
  encontrarVersaoPorId(tenantId: string, versaoId: string): Promise<DocumentoVersao | null>;
  listarVersoes(documentoId: string, tenantId: string): Promise<DocumentoVersao[]>;
}
