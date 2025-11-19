import { TriagemAutomacaoService } from '../triagem-automacao.service';
import { ExecutorRegrasService } from '@domain/automacao/services/executor-regras.service';
import { createPrioridadeAlta, createStatusDemanda } from '../../../../../test/fixtures';

describe('TriagemAutomacaoService', () => {
  const setup = () => {
    const regraAutomacaoRepository = {
      findAtivasByTenant: jest.fn(),
    };
    const executorRegrasService = {
      executarRegrasParaContexto: jest.fn(),
    };
    const catalogoRepository = {
      getRequiredItem: jest.fn(),
    };

    const service = new TriagemAutomacaoService(
      regraAutomacaoRepository as any,
      executorRegrasService as unknown as ExecutorRegrasService,
      catalogoRepository as any,
    );

    return { service, regraAutomacaoRepository, executorRegrasService, catalogoRepository };
  };

  const createDemandaStub = () =>
    ({
      id: 'demanda-1',
      titulo: { getValue: () => 'Titulo' },
      descricao: 'descricao',
      tipo: { slug: 'feature' },
      origem: { slug: 'interno' },
      status: {
        slug: 'novo',
        equals: jest.fn().mockReturnValue(false),
        label: 'Novo',
        canTransitionTo: jest.fn().mockReturnValue(true),
      },
      prioridade: { slug: 'media' },
      produtoId: 'produto-1',
      alterarPrioridade: jest.fn(),
      alterarStatus: jest.fn(),
      atribuirResponsavel: jest.fn(),
    }) as any;

  const createTriagemStub = () =>
    ({
      id: 'triagem-1',
      statusTriagem: { value: 'PENDENTE_TRIAGEM' },
      impacto: undefined,
      urgencia: undefined,
      complexidadeEstimada: undefined,
      definirAvaliacao: jest.fn(),
    }) as any;

  it('retorna flags falsos quando não existem regras ativas', async () => {
    const { service, regraAutomacaoRepository } = setup();
    const demanda = createDemandaStub();
    const triagem = createTriagemStub();

    regraAutomacaoRepository.findAtivasByTenant.mockResolvedValue([]);

    const resultado = await service.executar('tenant-1', demanda, triagem, 'usuario-1');

    expect(resultado).toEqual({ triagemAlterada: false, demandaAlterada: false });
  });

  it('aplica resultados de automação alterando triagem e demanda', async () => {
    const { service, regraAutomacaoRepository, executorRegrasService, catalogoRepository } = setup();
    const demanda = createDemandaStub();
    const triagem = createTriagemStub();

    regraAutomacaoRepository.findAtivasByTenant.mockResolvedValue([{} as any]);
    executorRegrasService.executarRegrasParaContexto.mockResolvedValue([
      {
        sucesso: true,
        acoesExecutadas: [
          { tipo: 'DEFINIR_IMPACTO', resultado: { impacto: 'ALTO' } },
          { tipo: 'ATRIBUIR_PM', resultado: { pmId: 'pm-1' } },
          { tipo: 'MUDAR_PRIORIDADE', resultado: { novaPrioridade: 'alta' } },
          { tipo: 'MUDAR_STATUS', resultado: { novoStatus: 'triagem' } },
        ],
      },
    ]);

    catalogoRepository.getRequiredItem.mockImplementation(async ({ category, slug }) => {
      if (category === 'prioridade_nivel' && slug === 'alta') {
        return createPrioridadeAlta();
      }
      if (category === 'status_demanda' && slug === 'triagem') {
        return createStatusDemanda('triagem');
      }
      throw new Error('item não encontrado');
    });

    const resultado = await service.executar('tenant-1', demanda, triagem, 'usuario-1');

    expect(triagem.definirAvaliacao).toHaveBeenCalledWith(expect.anything());
    expect(demanda.atribuirResponsavel).toHaveBeenCalledWith('pm-1');
    expect(demanda.alterarPrioridade).toHaveBeenCalled();
    expect(demanda.alterarStatus).toHaveBeenCalled();
    expect(resultado).toEqual({ triagemAlterada: true, demandaAlterada: true });
  });
});

