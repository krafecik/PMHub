import { CriarDocumentoHandler } from '../criar-documento.handler';
import { CriarDocumentoCommand } from '../criar-documento.command';
import { DocumentoRepository } from '@domain/documentacao';
import { Documento } from '@domain/documentacao/entities/documento.aggregate';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => 'doc-uuid'),
}));

describe('CriarDocumentoHandler', () => {
  const setup = () => {
    const repository: jest.Mocked<DocumentoRepository> = {
      criar: jest.fn(),
      atualizar: jest.fn(),
      buscarPorId: jest.fn(),
    } as any;

    const handler = new CriarDocumentoHandler(repository);
    return { handler, repository };
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cria documento com versão inicial e retorna id', async () => {
    const { handler, repository } = setup();
    const command = new CriarDocumentoCommand({
      tenantId: 'tenant-1',
      tipo: 'PRD',
      titulo: 'Documento Teste',
      resumo: 'Resumo inicial',
      produtoId: 'produto-1',
      pmId: 'pm-1',
      squadId: 'squad-1',
      criadoPorId: 'pm-1',
      versao: '1.0',
      objetivo: 'Objetivo inicial',
    });

    const documentoInstance = { idValue: 'doc-uuid' } as unknown as Documento;
    const createSpy = jest.spyOn(Documento, 'criar').mockReturnValue(documentoInstance);

    const documentoId = await handler.execute(command);

    expect(createSpy).toHaveBeenCalled();
    expect(repository.criar).toHaveBeenCalledWith(documentoInstance);
    expect(documentoId).toBe('doc-uuid');
  });
});

