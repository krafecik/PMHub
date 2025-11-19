import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { DocumentacaoAiService } from '../documentacao-ai.service';
import { OpenAiService } from '@infra/ai/openai.service';
import { DOCUMENTO_REPOSITORY_TOKEN, DocumentoRepository } from '@domain/documentacao';

describe('DocumentacaoAiService', () => {
  let service: DocumentacaoAiService;
  let openAiService: jest.Mocked<OpenAiService>;
  let documentoRepository: jest.Mocked<DocumentoRepository>;

  beforeEach(async () => {
    const mockOpenAiService = {
      createChatCompletion: jest.fn(),
    };

    const mockDocumentoRepository = {
      encontrarPorId: jest.fn(),
      listarVersoes: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DocumentacaoAiService,
        {
          provide: OpenAiService,
          useValue: mockOpenAiService,
        },
        {
          provide: DOCUMENTO_REPOSITORY_TOKEN,
          useValue: mockDocumentoRepository,
        },
      ],
    }).compile();

    service = module.get<DocumentacaoAiService>(DocumentacaoAiService);
    openAiService = module.get(OpenAiService);
    documentoRepository = module.get(DOCUMENTO_REPOSITORY_TOKEN);
  });

  describe('gerarPrdDraft', () => {
    it('deve lançar NotFoundException se documento não existir', async () => {
      documentoRepository.encontrarPorId.mockResolvedValue(null);

      await expect(service.gerarPrdDraft('tenant1', 'doc1')).rejects.toThrow(NotFoundException);
    });

    it('deve lançar NotFoundException se documento não tiver versão atual', async () => {
      const mockDocumento = {
        idValue: 'doc1',
        titulo: 'Test Doc',
        resumo: 'Test',
        versaoAtual: null,
        toJSON: jest.fn(),
      } as any;

      documentoRepository.encontrarPorId.mockResolvedValue(mockDocumento);

      await expect(service.gerarPrdDraft('tenant1', 'doc1')).rejects.toThrow(NotFoundException);
    });

    it('deve gerar PRD draft com sucesso', async () => {
      const mockVersao = {
        toJSON: jest.fn().mockReturnValue({
          objetivo: 'Test objective',
          contexto: { problema: 'Test problem' },
          requisitosFuncionais: [{ descricao: 'RF1' }],
          requisitosNaoFuncionais: [{ descricao: 'RNF1' }],
          riscos: [{ descricao: 'Risk1' }],
        }),
      };

      const mockDocumento = {
        idValue: 'doc1',
        titulo: 'Test Doc',
        resumo: 'Test summary',
        versaoAtual: mockVersao,
        toJSON: jest.fn(),
      } as any;

      documentoRepository.encontrarPorId.mockResolvedValue(mockDocumento);

      const mockAiResponse = {
        content: JSON.stringify({
          objetivo: 'Generated objective',
          contexto: 'Generated context',
          escopoFuncional: ['Scope1'],
          requisitosNaoFuncionais: ['RNF1'],
          regrasNegocio: ['Rule1'],
          fluxos: ['Flow1'],
          criteriosAceite: ['CA1'],
          riscos: ['Risk1'],
        }),
        raw: {
          usage: {
            prompt_tokens: 100,
            completion_tokens: 200,
            total_tokens: 300,
          },
        },
      };

      openAiService.createChatCompletion.mockResolvedValue(mockAiResponse as any);

      const result = await service.gerarPrdDraft('tenant1', 'doc1');

      expect(result).toBeDefined();
      expect(result.objetivo).toBe('Generated objective');
      expect(openAiService.createChatCompletion).toHaveBeenCalled();
    });
  });
});

