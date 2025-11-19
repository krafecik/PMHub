import { CriarOuAtualizarEpicoHandler } from '../criar-ou-atualizar-epico.handler';
import { CriarOuAtualizarEpicoCommand } from '../criar-ou-atualizar-epico.command';
import { IPlanejamentoEpicoRepository } from '@infra/repositories/planejamento';
import { Epico } from '@domain/planejamento';

describe('CriarOuAtualizarEpicoHandler', () => {
  const setup = () => {
    const epicoRepository: jest.Mocked<IPlanejamentoEpicoRepository> = {
      findById: jest.fn(),
      save: jest.fn(),
    } as any;

    const handler = new CriarOuAtualizarEpicoHandler(epicoRepository);
    return { handler, epicoRepository };
  };

  const basePayload = {
    produtoId: 'produto-1',
    planningCycleId: 'pc-1',
    squadId: 'squad-1',
    titulo: 'Epico Planejado',
    descricao: 'Descrição do épico',
    objetivo: 'Objetivo principal',
    valueProposition: 'Proposta de valor',
    criteriosAceite: 'Critérios',
    riscos: 'Riscos identificados',
    quarter: 'Q3 2026',
    ownerId: 'owner-1',
    sponsorId: 'sponsor-1',
    status: 'IN_PROGRESS',
    health: 'YELLOW',
    progressPercent: 35,
    startDate: new Date('2026-07-01'),
    endDate: new Date('2026-09-30'),
  };

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('cria novo épico quando identificador não é fornecido', async () => {
    const { handler, epicoRepository } = setup();
    epicoRepository.save.mockResolvedValue('epico-123');

    const saveSpy = jest.spyOn(Epico, 'create');

    const result = await handler.execute(
      new CriarOuAtualizarEpicoCommand('tenant-1', basePayload),
    );

    expect(saveSpy).toHaveBeenCalled();
    expect(epicoRepository.save).toHaveBeenCalledWith(expect.any(Epico));
    expect(result).toEqual({ epicoId: 'epico-123' });
  });

  it('atualiza épico existente preservando progresso quando não informado', async () => {
    const { handler, epicoRepository } = setup();
    const existente = Epico.create({
      tenantId: 'tenant-1',
      produtoId: 'produto-1',
      titulo: 'Epico Atual',
      quarter: 'Q2 2026',
      ownerId: 'owner-1',
      descricao: 'Antiga',
      objetivo: 'Objetivo antigo',
      valueProposition: 'Valor',
      planningCycleId: 'cycle-1',
      status: undefined,
      health: undefined,
    });

    epicoRepository.findById.mockResolvedValue(existente);
    epicoRepository.save.mockResolvedValue('epico-456');

    const payload = { ...basePayload, epicoId: 'epico-456', progressPercent: undefined };

    const result = await handler.execute(
      new CriarOuAtualizarEpicoCommand('tenant-1', payload),
    );

    const atualizado = existente.toObject();
    expect(atualizado.descricao).toBe(basePayload.descricao);
    expect(atualizado.criteriosAceite).toBe(basePayload.criteriosAceite);
    expect(atualizado.squadId).toBe(basePayload.squadId);
    expect(atualizado.progressPercent).toBeGreaterThanOrEqual(0);
    expect(epicoRepository.save).toHaveBeenCalledWith(existente);
    expect(result).toEqual({ epicoId: 'epico-456' });
  });
});

