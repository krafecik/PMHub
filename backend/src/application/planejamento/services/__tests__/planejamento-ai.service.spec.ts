import { PlanejamentoAiService } from '../planejamento-ai.service';
import { OpenAiService } from '@infra/ai/openai.service';
import { NotFoundException } from '@nestjs/common';

describe('PlanejamentoAiService', () => {
  const setup = () => {
    const openAiService: jest.Mocked<OpenAiService> = {
      createChatCompletion: jest.fn(),
    } as any;

    const epicoRepository = {
      findById: jest.fn(),
    };
    const featureRepository = {
      listByEpico: jest.fn(),
      findById: jest.fn(),
      list: jest.fn(),
    };
    const dependenciaRepository = {
      listAll: jest.fn(),
    };
    const capacityRepository = {
      listSnapshots: jest.fn(),
    };
    const commitmentRepository = {
      listByTenant: jest.fn(),
    };

    const service = new PlanejamentoAiService(
      openAiService,
      epicoRepository as any,
      featureRepository as any,
      dependenciaRepository as any,
      capacityRepository as any,
      commitmentRepository as any,
    );

    return {
      service,
      openAiService,
      epicoRepository,
      featureRepository,
      dependenciaRepository,
      capacityRepository,
      commitmentRepository,
    };
  };

  it('gera sugestão de prioridade para épico existente', async () => {
    const {
      service,
      openAiService,
      epicoRepository,
      featureRepository,
    } = setup();

    const epico = {
      titulo: 'Epico Alpha',
      status: { getValue: () => 'IN_PROGRESS' },
      health: { getValue: () => 'GREEN' },
      toObject: () => ({
        objetivo: 'Aumentar conversão',
        valueProposition: null,
        descricao: 'Detalhes do épico',
        progressPercent: 45,
      }),
    };

    epicoRepository.findById.mockResolvedValue(epico);
    featureRepository.listByEpico.mockResolvedValue([
      {
        toObject: () => ({
          titulo: 'Feature 1',
          status: 'IN_PROGRESS',
          pontos: 5,
        }),
      },
    ]);

    openAiService.createChatCompletion.mockResolvedValue({
      content: JSON.stringify({
        prioridade: 'ALTA',
        justificativa: 'Impacto alto',
        alertas: [],
      }),
      raw: { usage: { prompt_tokens: 10, completion_tokens: 20 } },
    } as any);

    const resultado = await service.sugerirPrioridade('tenant-1', 'epico-1');

    expect(epicoRepository.findById).toHaveBeenCalledWith('epico-1', 'tenant-1');
    expect(openAiService.createChatCompletion).toHaveBeenCalled();
    expect(resultado).toEqual({
      prioridade: 'ALTA',
      justificativa: 'Impacto alto',
      alertas: [],
    });
  });

  it('lança NotFoundException ao sugerir dependências para feature inexistente', async () => {
    const { service, featureRepository } = setup();
    featureRepository.findById.mockResolvedValue(null);

    await expect(
      service.sugerirDependencias('tenant-1', 'feature-1'),
    ).rejects.toThrow(NotFoundException);
  });
});

