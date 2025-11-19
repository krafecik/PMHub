import { TriagemDemanda, TriagemDemandaProps, ChecklistItem } from '../triagem-demanda.entity';
import { StatusTriagem, StatusTriagemEnum, Impacto, Urgencia, Complexidade } from '../../value-objects';

const makeChecklist = (overrides: Partial<ChecklistItem>[] = []): ChecklistItem[] => {
  const base: ChecklistItem[] = [
    { id: 'c1', label: 'Item obrigatório', required: true, completed: false },
    { id: 'c2', label: 'Item opcional', required: false, completed: false },
  ];
  overrides.forEach((override, index) => {
    base[index] = { ...base[index], ...override };
  });
  return base;
};

const buildTriagem = (overrides: Partial<TriagemDemandaProps> = {}): TriagemDemanda => {
  const now = new Date();
  return new TriagemDemanda({
    id: overrides.id ?? 'triagem-1',
    demandaId: overrides.demandaId ?? 'demanda-1',
    statusTriagem:
      overrides.statusTriagem ?? new StatusTriagem(StatusTriagemEnum.PENDENTE_TRIAGEM),
    impacto: overrides.impacto,
    urgencia: overrides.urgencia,
    complexidadeEstimada: overrides.complexidadeEstimada,
    checklist: overrides.checklist ?? makeChecklist(),
    triadoPorId: overrides.triadoPorId,
    triadoEm: overrides.triadoEm,
    revisoesTriagem: overrides.revisoesTriagem ?? 0,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  });
};

describe('TriagemDemanda', () => {
  it('cria nova triagem com checklist padrão', () => {
    const triagem = TriagemDemanda.criarNova('demanda-xyz');
    expect(triagem.demandaId).toBe('demanda-xyz');
    expect(triagem.checklist.length).toBeGreaterThan(0);
    expect(triagem.revisoesTriagem).toBe(0);
  });

  it('calcula prioridades e identifica checklist pendente', () => {
    const triagem = buildTriagem({
      impacto: Impacto.alto(),
      urgencia: Urgencia.alta(),
      complexidadeEstimada: Complexidade.baixa(),
      checklist: makeChecklist([{ completed: true }, { completed: true }]),
    });

    expect(triagem.isProntoParaDiscovery()).toBe(true);
    expect(triagem.calcularPrioridade()).toBeGreaterThan(0);
  });

  it('retorna prioridade zero quando avaliações estão incompletas', () => {
    const triagem = buildTriagem();
    expect(triagem.calcularPrioridade()).toBe(0);
    expect(triagem.getChecklistPendentes()).toHaveLength(1);
  });

  it('atualiza status para finais registrando responsável e data', () => {
    const triagem = buildTriagem();
    triagem.atualizarStatus(StatusTriagemEnum.PRONTO_DISCOVERY, 'pm-99');

    expect(triagem.statusTriagem.value).toBe(StatusTriagemEnum.PRONTO_DISCOVERY);
    expect(triagem.triadoPorId).toBe('pm-99');
    expect(triagem.triadoEm).toBeInstanceOf(Date);
  });

  it('impede transições inválidas de status', () => {
    const triagem = buildTriagem({
      statusTriagem: new StatusTriagem(StatusTriagemEnum.PRONTO_DISCOVERY),
    });

    expect(() =>
      triagem.atualizarStatus(StatusTriagemEnum.PENDENTE_TRIAGEM, 'pm-2'),
    ).toThrow('Transição inválida de PRONTO_DISCOVERY para PENDENTE_TRIAGEM');
  });

  it('define avaliações individualmente sem sobrescrever valores inexistentes', () => {
    const triagem = buildTriagem();
    triagem.definirAvaliacao(Impacto.medio());
    triagem.definirAvaliacao(undefined, Urgencia.baixa());
    triagem.definirAvaliacao(undefined, undefined, Complexidade.media());

    expect(triagem.impacto?.getValue()).toBe('MEDIO');
    expect(triagem.urgencia?.value).toBe('BAIXA');
    expect(triagem.complexidadeEstimada?.value).toBe('MEDIA');
  });

  it('marca itens do checklist e remove marcação quando solicitado', () => {
    const triagem = buildTriagem();
    triagem.marcarChecklistItem('c1', true);

    const item = triagem.checklist.find((c) => c.id === 'c1');
    expect(item?.completed).toBe(true);
    expect(item?.completedAt).toBeInstanceOf(Date);

    triagem.marcarChecklistItem('c1', false);
    expect(item?.completed).toBe(false);
    expect(item?.completedAt).toBeUndefined();
  });

  it('lança erro ao marcar item inexistente', () => {
    const triagem = buildTriagem();
    expect(() => triagem.marcarChecklistItem('inexistente', true)).toThrow(
      'Item de checklist não encontrado: inexistente',
    );
  });

  it('incrementa revisões e atualiza timestamp', () => {
    const triagem = buildTriagem();
    const before = triagem.updatedAt;

    triagem.incrementarRevisoes();
    expect(triagem.revisoesTriagem).toBe(1);
    expect(triagem.updatedAt).not.toBe(before);
    expect(triagem.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });
});

