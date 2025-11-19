import { DemandaId } from '../demanda-id.vo';
import { OrigemDemandaVO } from '../origem-demanda.vo';
import { PrioridadeVO } from '../prioridade.vo';
import { StatusDemandaVO } from '../status-demanda.vo';
import { TipoDemandaVO } from '../tipo-demanda.vo';
import { TituloVO } from '../titulo.vo';
import {
  createOrigemDemanda,
  createPrioridadeAlta,
  createPrioridadeCritica,
  createStatusDemanda,
  createTipoDemanda,
} from '../../../../../test/fixtures';

describe('TituloVO', () => {
  it('cria título válido removendo espaços e calcula métricas', () => {
    const titulo = TituloVO.create('  Demanda Importante  ');
    expect(titulo.getValue()).toBe('Demanda Importante');
    expect(titulo.length()).toBe(18);
    expect(titulo.contains('importante')).toBe(true);
    expect(titulo.equals(TituloVO.create('Demanda Importante'))).toBe(true);
    expect(titulo.toString()).toBe('Demanda Importante');
  });

  it('valida tamanho mínimo e máximo', () => {
    expect(() => TituloVO.create('')).toThrow('Título é obrigatório');
    expect(() => TituloVO.create('abcd')).toThrow('Título deve ter no mínimo 5 caracteres');

    const oversized = 'a'.repeat(256);
    expect(() => TituloVO.create(oversized)).toThrow('Título deve ter no máximo 255 caracteres');
  });
});

describe('DemandaId', () => {
  it('não permite valor vazio e compara corretamente', () => {
    expect(() => new DemandaId('')).toThrow('DemandaId não pode ser vazio');

    const id = new DemandaId('demanda-1');
    expect(id.getValue()).toBe('demanda-1');
    expect(id.equals(new DemandaId('demanda-1'))).toBe(true);
    expect(id.equals(new DemandaId('demanda-2'))).toBe(false);
  });
});

describe('TipoDemandaVO', () => {
  it('cria valor válido a partir de item de catálogo', () => {
    const item = createTipoDemanda('feature');
    const tipo = TipoDemandaVO.create(item.toJSON());

    expect(tipo.getLabel()).toBe('Feature');
    expect(tipo.getValue()).toBe('FEATURE');
    expect(tipo.equals(TipoDemandaVO.fromCatalogItem(item))).toBe(true);
    expect(tipo.toCatalogItem().slug).toBe(item.slug);
  });

  it('valida categoria correta', () => {
    const item = createOrigemDemanda('cliente');
    expect(() => TipoDemandaVO.fromCatalogItem(item)).toThrow(
      'Catalog item category mismatch. Expected tipo_demanda, received origem_demanda.',
    );
  });
});

describe('OrigemDemandaVO', () => {
  it('identifica origens externas corretamente', () => {
    const interno = OrigemDemandaVO.create(createOrigemDemanda('interno').toJSON());
    const cliente = OrigemDemandaVO.create(createOrigemDemanda('cliente').toJSON());

    expect(interno.isExternal()).toBe(false);
    expect(cliente.isExternal()).toBe(true);
    expect(cliente.equals(OrigemDemandaVO.fromCatalogItem(createOrigemDemanda('cliente')))).toBe(
      true,
    );
  });
});

describe('PrioridadeVO', () => {
  it('calcula cor, peso e comparações com metadados personalizados', () => {
    const alta = PrioridadeVO.fromCatalogItem(
      createPrioridadeAlta({
        metadata: { weight: 5, color: 'purple' },
      }),
    );

    expect(alta.getColor()).toBe('purple');
    expect(alta.getNumericValue()).toBe(5);
    expect(alta.isHighPriority()).toBe(true);
    expect(alta.getLabel()).toBe('Alta');

    const critica = PrioridadeVO.fromCatalogItem(createPrioridadeCritica());
    expect(alta.compareTo(critica)).toBeGreaterThan(0);
  });

  it('usa valores padrão quando metadados não informados', () => {
    const prioridade = PrioridadeVO.fromCatalogItem(
      createPrioridadeAlta({ metadata: undefined }),
    );

    expect(prioridade.getColor()).toBe('orange');
    expect(prioridade.getNumericValue()).toBe(3);
    expect(prioridade.toCatalogItem().slug).toBe('alta');
  });

  it('cria prioridade padrão somente quando item fornecido', () => {
    const item = createPrioridadeAlta();
    expect(() => PrioridadeVO.default(item)).not.toThrow();
    expect(() => PrioridadeVO.default()).toThrow(
      'Prioridade padrão requer item de catálogo explicitado',
    );
  });
});

describe('StatusDemandaVO', () => {
  it('respeita metadados personalizados de transição e flags', () => {
    const item = createStatusDemanda('novo', {
      metadata: {
        allowedTransitions: ['triagem'],
        isEditable: false,
        isTerminal: true,
      },
    });
    const status = StatusDemandaVO.fromCatalogItem(item);

    const triagem = StatusDemandaVO.fromCatalogItem(createStatusDemanda('triagem'));
    expect(status.canTransitionTo(triagem)).toBe(true);
    expect(status.isEditable()).toBe(false);
    expect(status.isActive()).toBe(false);
  });

  it('usa configurações padrão quando metadados não informados', () => {
    const novo = StatusDemandaVO.fromCatalogItem(createStatusDemanda('novo'));
    const arquivado = StatusDemandaVO.fromCatalogItem(createStatusDemanda('arquivado'));

    expect(novo.canTransitionTo(arquivado)).toBe(true);
    expect(novo.isEditable()).toBe(true);
    expect(arquivado.isActive()).toBe(false);
  });

  it('serializa e compara corretamente', () => {
    const status = StatusDemandaVO.fromCatalogItem(createStatusDemanda('triagem'));
    const same = StatusDemandaVO.fromCatalogItem(createStatusDemanda('triagem'));
    const different = StatusDemandaVO.fromCatalogItem(createStatusDemanda('arquivado'));

    expect(status.equals(same)).toBe(true);
    expect(status.equals(different)).toBe(false);
    expect(status.toCatalogItem().slug).toBe('triagem');
  });
});

