import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import { CenarioStatusVO } from '../cenario-status.vo';
import { CommitmentTierVO } from '../commitment-tier.vo';
import { DependenciaRisco, DependenciaRiscoVO } from '../dependencia-risco.vo';
import { DependenciaTipo, DependenciaTipoVO } from '../dependencia-tipo.vo';
import { EpicoHealth, EpicoHealthVO } from '../epico-health.vo';
import { EpicoStatus, EpicoStatusVO } from '../epico-status.vo';
import { FeatureStatus, FeatureStatusVO } from '../feature-status.vo';
import { PlanningCycleStatusVO } from '../planning-cycle-status.vo';
import { QuarterVO } from '../quarter.vo';
import { SquadStatusVO } from '../squad-status.vo';
import { createCatalogItem } from '../../../../../test/fixtures';

describe('EpicoStatusVO', () => {
  it('valida transições e estados finais', () => {
    const planned = EpicoStatusVO.planned();
    const inProgress = EpicoStatusVO.fromEnum(EpicoStatus.IN_PROGRESS);
    const done = EpicoStatusVO.fromEnum(EpicoStatus.DONE);

    expect(planned.getLabel()).toBe('Planejado');
    expect(planned.canTransitionTo(inProgress)).toBe(true);
    expect(planned.canTransitionTo(done)).toBe(false);
    expect(done.isFinal()).toBe(true);
    expect(() => EpicoStatusVO.create('INVALIDO')).toThrow('Status de épico inválido: INVALIDO');
  });
});

describe('EpicoHealthVO', () => {
  it('identifica estados críticos', () => {
    const green = EpicoHealthVO.green();
    const red = EpicoHealthVO.fromEnum(EpicoHealth.RED);

    expect(green.getLabel()).toBe('Saudável');
    expect(green.isCritical()).toBe(false);
    expect(red.isCritical()).toBe(true);
  });

  it('valida valores válidos', () => {
    expect(() => EpicoHealthVO.create('UNKNOWN')).toThrow('Health de épico inválido: UNKNOWN');
  });
});

describe('FeatureStatusVO', () => {
  it('exibe rótulos e flags utilitárias', () => {
    const blocked = FeatureStatusVO.fromEnum(FeatureStatus.BLOCKED);
    const done = FeatureStatusVO.fromEnum(FeatureStatus.DONE);

    expect(FeatureStatusVO.planned().getValue()).toBe(FeatureStatus.PLANNED);
    expect(blocked.isBlocked()).toBe(true);
    expect(done.isDone()).toBe(true);
    expect(() => FeatureStatusVO.create('UNKNOWN')).toThrow('Status de feature inválido: UNKNOWN');
  });
});

describe('QuarterVO', () => {
  it('valida formato e expõe utilidades', () => {
    const q = QuarterVO.create('Q2 2026');

    expect(q.getValue()).toBe('Q2 2026');
    expect(q.getYear()).toBe(2026);
    expect(q.getQuarterNumber()).toBe(2);
    expect(q.toString()).toBe('Q2 2026');
    expect(() => QuarterVO.create('2026 Q2')).toThrow(
      'Quarter inválido: 2026 Q2. Utilize o formato Q1 2026.',
    );
  });
});

describe('DependenciaTipoVO', () => {
  it('valida tipos de dependência', () => {
    const hard = DependenciaTipoVO.fromEnum(DependenciaTipo.HARD);
    const soft = DependenciaTipoVO.create('SOFT');

    expect(hard.getValue()).toBe(DependenciaTipo.HARD);
    expect(hard.isHard()).toBe(true);
    expect(soft.toString()).toBe('SOFT');
    expect(() => DependenciaTipoVO.create('UNKNOWN')).toThrow(
      'Tipo de dependência inválido: UNKNOWN',
    );
  });
});

describe('DependenciaRiscoVO', () => {
  it('identifica riscos críticos', () => {
    const alto = DependenciaRiscoVO.create('ALTO');
    const baixo = DependenciaRiscoVO.fromEnum(DependenciaRisco.BAIXO);

    expect(alto.isCritical()).toBe(true);
    expect(baixo.getLabel()).toBe('Baixo');
    expect(() => DependenciaRiscoVO.create('UNKNOWN')).toThrow(
      'Risco de dependência inválido: UNKNOWN',
    );
  });
});

describe('CommitmentTierVO', () => {
  it('cria a partir de item de catálogo válido e compara igualdade', () => {
    const item = createCatalogItem({
      categorySlug: CatalogCategorySlugs.PLANEJAMENTO_COMMITMENT_TIER,
      slug: 'committed',
      label: 'Committed',
    });

    const tier = CommitmentTierVO.fromCatalogItem(item);
    const same = CommitmentTierVO.create(item.toJSON());

    expect(tier.slug).toBe('committed');
    expect(tier.metadata).toEqual({});
    expect(tier.equals(same)).toBe(true);

    const wrongCategory = createCatalogItem({
      categorySlug: CatalogCategorySlugs.PLANEJAMENTO_SQUAD_STATUS,
      slug: 'ativo',
      label: 'Ativo',
    });
    expect(() => CommitmentTierVO.fromCatalogItem(wrongCategory)).toThrow(
      'Catalog item category mismatch. Expected planejamento_commitment_tier, received planejamento_squad_status.',
    );
  });
});

describe('CenarioStatusVO', () => {
  const buildItem = (slug: string, metadata?: Record<string, unknown>) =>
    createCatalogItem({
      categorySlug: CatalogCategorySlugs.PLANEJAMENTO_CENARIO_STATUS,
      slug,
      label: slug,
      metadata,
    });

  it('usa transições definidas em metadados', () => {
    const draft = CenarioStatusVO.fromCatalogItem(
      buildItem('draft', { allowedTransitions: ['published'], isTerminal: false }),
    );
    const published = CenarioStatusVO.fromCatalogItem(buildItem('published'));

    expect(draft.canTransitionTo(published)).toBe(true);
    expect(published.canTransitionTo(draft)).toBe(true); // sem metadados, transição liberada
    expect(draft.isTerminal()).toBe(false);
  });

  it('respeita flag de terminalidade', () => {
    const archived = CenarioStatusVO.fromCatalogItem(
      buildItem('archived', { isTerminal: true }),
    );
    expect(archived.isTerminal()).toBe(true);
  });
});

describe('PlanningCycleStatusVO', () => {
  const buildStatus = (slug: string, metadata?: Record<string, unknown>) =>
    PlanningCycleStatusVO.fromCatalogItem(
      createCatalogItem({
        categorySlug: CatalogCategorySlugs.PLANNING_CYCLE_STATUS,
        slug,
        label: slug,
        metadata,
      }),
    );

  it('identifica ciclo fechado por slug padrão', () => {
    const closed = buildStatus('closed');
    const preparation = buildStatus('preparation');

    expect(closed.isClosed()).toBe(true);
    expect(preparation.isClosed()).toBe(false);
  });

  it('sobrescreve terminalidade via metadados', () => {
    const status = buildStatus('custom', { isTerminal: true });
    expect(status.isClosed()).toBe(true);
  });
});

describe('SquadStatusVO', () => {
  const buildStatus = (slug: string, metadata?: Record<string, unknown>) =>
    SquadStatusVO.fromCatalogItem(
      createCatalogItem({
        categorySlug: CatalogCategorySlugs.PLANEJAMENTO_SQUAD_STATUS,
        slug,
        label: slug,
        metadata,
      }),
    );

  it('determina atividade com base no slug e legacyValue', () => {
    const ativo = buildStatus('ativo');
    const inactive = buildStatus('inactive');
    const legacyActive = buildStatus('custom', { legacyValue: 'active' });

    expect(ativo.isActive()).toBe(true);
    expect(inactive.isActive()).toBe(false);
    expect(legacyActive.isActive()).toBe(true);
  });
});

