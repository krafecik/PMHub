import {
  Complexidade,
  NivelComplexidadeEnum,
} from '../complexidade.vo';
import { Impacto, NivelImpactoEnum } from '../impacto.vo';
import { StatusTriagem, StatusTriagemEnum } from '../status-triagem.vo';
import { NivelUrgenciaEnum, Urgencia } from '../urgencia.vo';

describe('Complexidade', () => {
  it('cria instâncias válidas e expõe métricas derivadas', () => {
    const complexidade = Complexidade.media();

    expect(complexidade.value).toBe(NivelComplexidadeEnum.MEDIA);
    expect(complexidade.peso).toBe(2);
    expect(complexidade.diasEstimados).toBe(15);
    expect(complexidade.isMedia()).toBe(true);
    expect(complexidade.toString()).toBe('MEDIA');
    expect(complexidade.equals(Complexidade.fromString('MEDIA'))).toBe(true);
  });

  it('calcula prioridade combinada invertendo peso da complexidade', () => {
    const complexidade = Complexidade.baixa();
    const prioridade = complexidade.calcularPrioridade(Impacto.alto().peso, Urgencia.alta().peso);
    // impacto 3 * 0.4 + urgencia 3 * 0.4 + (4 - peso(1)) * 0.2 = 1.2 + 1.2 + 0.6 = 3
    expect(prioridade).toBeCloseTo(3);
  });

  it('lança erro para valores inválidos', () => {
    expect(() => Complexidade.fromString('INVALIDO')).toThrow(
      'Nível de complexidade inválido: INVALIDO',
    );
  });
});

describe('Impacto', () => {
  it('controle de labels, peso e verificações utilitárias', () => {
    const impacto = Impacto.critico();

    expect(impacto.value).toBe(NivelImpactoEnum.CRITICO);
    expect(impacto.getLabel()).toBe('Crítico');
    expect(impacto.getScore()).toBe(4);
    expect(impacto.isHighPriority()).toBe(true);
    expect(impacto.equals(Impacto.fromString('CRITICO'))).toBe(true);
  });

  it('valida valores inválidos', () => {
    expect(() => Impacto.fromString('DESCONHECIDO')).toThrow(
      'Nível de impacto inválido: DESCONHECIDO',
    );
  });
});

describe('Urgencia', () => {
  it('expõe peso, prazo e verificações utilitárias', () => {
    const urgencia = Urgencia.alta();

    expect(urgencia.value).toBe(NivelUrgenciaEnum.ALTA);
    expect(urgencia.peso).toBe(3);
    expect(urgencia.diasPrazo).toBe(7);
    expect(urgencia.isAlta()).toBe(true);
    expect(urgencia.equals(Urgencia.fromString('ALTA'))).toBe(true);
    expect(urgencia.toString()).toBe('ALTA');
  });

  it('rejeita valores inválidos', () => {
    expect(() => Urgencia.fromString('INVALIDO')).toThrow(
      'Nível de urgência inválido: INVALIDO',
    );
  });
});

describe('StatusTriagem', () => {
  it('valida transições permitidas e estados auxiliares', () => {
    const pendente = StatusTriagem.fromString(StatusTriagemEnum.PENDENTE_TRIAGEM);
    const aguardando = StatusTriagem.fromString(StatusTriagemEnum.AGUARDANDO_INFO);
    const prontoDiscovery = StatusTriagem.fromString(StatusTriagemEnum.PRONTO_DISCOVERY);
    const arquivado = StatusTriagem.fromString(StatusTriagemEnum.ARQUIVADO_TRIAGEM);

    expect(pendente.isPendente()).toBe(true);
    expect(pendente.canTransitionTo(StatusTriagemEnum.DUPLICADO)).toBe(true);
    expect(aguardando.isAguardandoInfo()).toBe(true);
    expect(aguardando.canTransitionTo(StatusTriagemEnum.RETOMADO_TRIAGEM)).toBe(true);
    expect(prontoDiscovery.isProntoDiscovery()).toBe(true);
    expect(prontoDiscovery.canTransitionTo(StatusTriagemEnum.AGUARDANDO_INFO)).toBe(false);
    expect(arquivado.isArquivado()).toBe(true);
  });

  it('identifica status duplicado corretamente', () => {
    const duplicado = StatusTriagem.fromString(StatusTriagemEnum.DUPLICADO);
    expect(duplicado.isDuplicado()).toBe(true);
    expect(duplicado.canTransitionTo(StatusTriagemEnum.PENDENTE_TRIAGEM)).toBe(false);
    expect(duplicado.toString()).toBe(StatusTriagemEnum.DUPLICADO);
  });

  it('rejeita status inválidos', () => {
    expect(() => StatusTriagem.fromString('INVALIDO')).toThrow(
      'Status de triagem inválido: INVALIDO',
    );
  });
});

