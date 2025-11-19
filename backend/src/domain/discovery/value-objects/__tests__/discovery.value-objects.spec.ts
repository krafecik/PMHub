import {
  DecisaoDiscoveryId,
} from '../decisao-discovery-id.vo';
import { DiscoveryId } from '../discovery-id.vo';
import { HipoteseId } from '../hipotese-id.vo';
import { ExperimentoId } from '../experimento-id.vo';
import { EvidenciaId } from '../evidencia-id.vo';
import { InsightId } from '../insight-id.vo';
import { PesquisaId } from '../pesquisa-id.vo';
import { EntrevistaId } from '../entrevista-id.vo';
import { NivelConfiancaEnum, NivelConfiancaVO } from '../nivel-confianca.vo';
import { TipoEvidenciaEnum, TipoEvidenciaVO } from '../tipo-evidencia.vo';
import { ConfiancaInsightVO } from '../confianca-insight.vo';
import { ImpactoInsightVO } from '../impacto-insight.vo';
import { ImpactoHipoteseVO } from '../impacto-hipotese.vo';
import { PrioridadeHipoteseVO } from '../prioridade-hipotese.vo';
import { SeveridadeProblemaVO } from '../severidade-problema.vo';
import {
  StatusDiscoveryEnum,
  StatusDiscoveryVO,
} from '../status-discovery.vo';
import {
  StatusHipoteseEnum,
  StatusHipoteseVO,
} from '../status-hipotese.vo';
import {
  StatusPesquisaEnum,
  StatusPesquisaVO,
} from '../status-pesquisa.vo';
import {
  StatusExperimentoEnum,
  StatusExperimentoVO,
} from '../status-experimento.vo';
import {
  StatusInsightEnum,
  StatusInsightVO,
} from '../status-insight.vo';
import { TipoExperimentoVO } from '../tipo-experimento.vo';
import { MetricaSucessoExperimentoVO } from '../metrica-sucesso-experimento.vo';
import { MetodoPesquisaVO } from '../metodo-pesquisa.vo';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import { createCatalogItem } from '../../../../../test/fixtures';

const makeCatalogItem = (
  categorySlug: string,
  slug: string,
  label = slug,
  metadata?: Record<string, unknown>,
) =>
  createCatalogItem({
    categorySlug,
    slug,
    label,
    metadata,
  });

describe('Identificadores de Discovery', () => {
  const cases: Array<{
    name: string;
    factory: (value?: string) => { getValue(): string; equals(other: any): boolean };
    errorMessage: string;
  }> = [
    { name: 'DecisaoDiscoveryId', factory: (v) => new DecisaoDiscoveryId(v ?? 'decisao-1'), errorMessage: 'DecisaoDiscoveryId não pode ser vazio' },
    { name: 'DiscoveryId', factory: (v) => new DiscoveryId(v ?? 'discovery-1'), errorMessage: 'DiscoveryId não pode ser vazio' },
    { name: 'HipoteseId', factory: (v) => new HipoteseId(v ?? 'hipotese-1'), errorMessage: 'HipoteseId não pode ser vazio' },
    { name: 'ExperimentoId', factory: (v) => new ExperimentoId(v ?? 'experimento-1'), errorMessage: 'ExperimentoId não pode ser vazio' },
    { name: 'EvidenciaId', factory: (v) => new EvidenciaId(v ?? 'evidencia-1'), errorMessage: 'EvidenciaId não pode ser vazio' },
    { name: 'InsightId', factory: (v) => new InsightId(v ?? 'insight-1'), errorMessage: 'InsightId não pode ser vazio' },
    { name: 'PesquisaId', factory: (v) => new PesquisaId(v ?? 'pesquisa-1'), errorMessage: 'PesquisaId não pode ser vazio' },
    { name: 'EntrevistaId', factory: (v) => new EntrevistaId(v ?? 'entrevista-1'), errorMessage: 'EntrevistaId não pode ser vazio' },
  ];

  cases.forEach(({ name, factory, errorMessage }) => {
    it(`${name} valida valor e igualdade`, () => {
      expect(() => factory('')).toThrow(errorMessage);
      const id = factory('valor-1');
      expect(id.getValue()).toBe('valor-1');
      expect(id.equals(factory('valor-1'))).toBe(true);
      expect(id.equals(factory('valor-2'))).toBe(false);
    });
  });
});

describe('NivelConfiancaVO', () => {
  it('retorna rótulos e pontuação para níveis válidos', () => {
    const confianca = new NivelConfiancaVO(NivelConfiancaEnum.ALTA);
    expect(confianca.getValue()).toBe(NivelConfiancaEnum.ALTA);
    expect(confianca.getLabel()).toBe('Alta');
    expect(confianca.getScore()).toBe(3);
    expect(confianca.equals(new NivelConfiancaVO(NivelConfiancaEnum.ALTA))).toBe(true);
  });

  it('rejeita níveis inválidos', () => {
    expect(() => new NivelConfiancaVO('INVALIDO' as NivelConfiancaEnum)).toThrow(
      'Nível de confiança inválido: INVALIDO',
    );
  });
});

describe('TipoEvidenciaVO', () => {
  it('identifica quando requer arquivo e expõe rótulos', () => {
    const video = new TipoEvidenciaVO(TipoEvidenciaEnum.VIDEO);
    const feedback = new TipoEvidenciaVO(TipoEvidenciaEnum.FEEDBACK_USUARIO);

    expect(video.requiresFile()).toBe(true);
    expect(video.getLabel()).toBe('Vídeo');
    expect(feedback.requiresFile()).toBe(false);
    expect(() => new TipoEvidenciaVO('RELATORIO' as TipoEvidenciaEnum)).toThrow(
      'Tipo de evidência inválido: RELATORIO',
    );
  });
});

describe('ConfiancaInsightVO e ImpactoInsightVO', () => {
  it('usa metadados quando disponíveis e valores padrão quando ausentes', () => {
    const confianca = ConfiancaInsightVO.fromCatalogItem(
      makeCatalogItem('confianca_insight', 'alto', 'Alta', { score: 5 }),
    );
    expect(confianca.getScore()).toBe(5);
    expect(confianca.getValue()).toBe('ALTO');

    const impacto = ImpactoInsightVO.fromCatalogItem(
      makeCatalogItem('impacto_insight', 'critico', 'Crítico', { weight: 6 }),
    );
    expect(impacto.getScore()).toBe(6);
    expect(impacto.isHighImpact()).toBe(true);

    const impactoDefault = ImpactoInsightVO.fromCatalogItem(
      makeCatalogItem('impacto_insight', 'medio', 'Médio'),
    );
    expect(impactoDefault.getScore()).toBe(2);
  });
});

describe('ImpactoHipoteseVO e PrioridadeHipoteseVO', () => {
  it('calcula peso, cor e flags utilitárias', () => {
    const impacto = ImpactoHipoteseVO.fromCatalogItem(
      makeCatalogItem('impacto_hipotese', 'estrategico', 'Estratégico', { weight: 10 }),
    );
    expect(impacto.getNumericValue()).toBe(10);
    expect(impacto.isHighImpact()).toBe(true);

    const prioridade = PrioridadeHipoteseVO.fromCatalogItem(
      makeCatalogItem('prioridade_hipotese', 'alta', 'Alta', { weight: 5, color: 'amber' }),
    );
    expect(prioridade.getNumericValue()).toBe(5);
    expect(prioridade.getColor()).toBe('amber');
    expect(prioridade.isHighPriority()).toBe(true);
  });
});

describe('SeveridadeProblemaVO', () => {
  it('converte slug em nível de impacto e instancia VO', () => {
    const severidade = SeveridadeProblemaVO.fromCatalogItem(
      makeCatalogItem('severidade_problema', 'alto', 'Alto'),
    );

    expect(severidade.getImpacto().getValue()).toBe('ALTO');
    expect(severidade.getLabel()).toBe('Alto');
    expect(() => SeveridadeProblemaVO.slugToImpactoEnum('desconhecido')).toThrow(
      'Slug de severidade inválido: desconhecido',
    );
  });
});

describe('StatusDiscoveryVO', () => {
  const makeStatus = (slug: string, metadata?: Record<string, unknown>) =>
    StatusDiscoveryVO.fromCatalogItem(
      makeCatalogItem('status_discovery', slug, slug, metadata),
    );

  it('mapeia slug para enum e avalia flags', () => {
    const emPesquisa = makeStatus('em_pesquisa');
    const fechado = makeStatus('fechado');
    const canceladoMeta = makeStatus('cancelado', { isActive: true, isFinal: false });

    expect(StatusDiscoveryVO.enumToSlug(StatusDiscoveryEnum.VALIDANDO)).toBe('validando');
    expect(StatusDiscoveryVO.enumFromSlug('fechado')).toBe(StatusDiscoveryEnum.FECHADO);
    expect(emPesquisa.isActive()).toBe(true);
    expect(fechado.isFinal()).toBe(true);
    expect(canceladoMeta.isActive()).toBe(true);
    expect(canceladoMeta.isFinal()).toBe(false);
  });

  it('valida correspondência de enum com item de catálogo', () => {
    const item = makeCatalogItem('status_discovery', 'validando', 'Validando');
    expect(() => StatusDiscoveryVO.fromEnum(StatusDiscoveryEnum.VALIDANDO, item)).not.toThrow();

    const mismatch = makeCatalogItem('status_discovery', 'em_pesquisa', 'Em Pesquisa');
    expect(() => StatusDiscoveryVO.fromEnum(StatusDiscoveryEnum.FECHADO, mismatch)).toThrow(
      'Slug (em_pesquisa) não corresponde ao enum informado (FECHADO)',
    );
  });
});

describe('StatusHipoteseVO', () => {
  const makeStatus = (slug: string) =>
    StatusHipoteseVO.fromCatalogItem(makeCatalogItem('status_hipotese', slug, slug));

  it('identifica estados finais e de sucesso', () => {
    const pendente = makeStatus('pendente');
    const validada = makeStatus('validada');

    expect(pendente.isActive()).toBe(true);
    expect(validada.isFinal()).toBe(true);
    expect(validada.isSuccess()).toBe(true);
  });

  it('garante slug esperado para ações específicas', () => {
    const emTeste = makeStatus('em_teste');
    expect(() => emTeste.ensureSlug('em_teste', 'aprovar')).not.toThrow();
    expect(() => emTeste.ensureSlug('validada', 'aprovar')).toThrow(
      'Status de hipótese inválido para aprovar. Esperado validada, recebido em_teste',
    );
  });
});

describe('StatusPesquisaVO', () => {
  const makeStatus = (slug: string) =>
    StatusPesquisaVO.fromCatalogItem(makeCatalogItem('status_pesquisa', slug, slug));

  it('avalia estados ativos e finais', () => {
    const planejada = makeStatus('planejada');
    const andamento = makeStatus('em_andamento');
    const concluida = makeStatus('concluida');

    expect(planejada.isActive()).toBe(true);
    expect(andamento.canAddEntrevista()).toBe(true);
    expect(concluida.isFinal()).toBe(true);
  });

  it('valida slug esperado para transições', () => {
    const andamento = makeStatus('em_andamento');
    expect(() => andamento.ensureSlug('em_andamento', 'iniciar entrevistas')).not.toThrow();
    expect(() => andamento.ensureSlug('planejada', 'iniciar entrevistas')).toThrow(
      'Status de pesquisa inválido para iniciar entrevistas. Esperado planejada, recebido em_andamento',
    );
  });
});

describe('StatusExperimentoVO', () => {
  const makeStatus = (slug: string) =>
    StatusExperimentoVO.fromCatalogItem(makeCatalogItem('status_experimento', slug, slug));

  it('identifica estados intermediários e finais', () => {
    const planejado = makeStatus('planejado');
    const emExecucao = makeStatus('em_execucao');
    const cancelado = makeStatus('cancelado');

    expect(planejado.canStartExecution()).toBe(true);
    expect(emExecucao.isActive()).toBe(true);
    expect(emExecucao.canFinish()).toBe(true);
    expect(cancelado.isFinal()).toBe(true);
  });

  it('garante slug esperado e trata erros de slug desconhecido', () => {
    const emExecucao = makeStatus('em_execucao');
    expect(() =>
      emExecucao.ensureSlug('em_execucao', 'finalizar experimento'),
    ).not.toThrow();
    expect(() =>
      emExecucao.ensureSlug('planejado', 'finalizar experimento'),
    ).toThrow(
      'Status de experimento inválido para finalizar experimento. Esperado planejado, recebido em_execucao',
    );

    expect(() =>
      StatusExperimentoVO.fromCatalogItem(makeCatalogItem('status_experimento', 'custom', 'Custom')),
    ).toThrow('Slug de status de experimento desconhecido: custom');
  });
});

describe('StatusInsightVO', () => {
  const makeStatus = (slug: string) =>
    StatusInsightVO.fromCatalogItem(makeCatalogItem('status_insight', slug, slug));

  it('identifica rascunho e estados finais', () => {
    const rascunho = makeStatus('rascunho');
    const validado = makeStatus('validado');

    expect(rascunho.isDraft()).toBe(true);
    expect(validado.isFinal()).toBe(true);
  });

  it('garante slug esperado', () => {
    const rascunho = makeStatus('rascunho');
    expect(() => rascunho.ensureSlug('rascunho', 'editar')).not.toThrow();
    expect(() => rascunho.ensureSlug('validado', 'editar')).toThrow(
      'Status de insight inválido para editar. Esperado validado, recebido rascunho',
    );
  });
});

describe('TipoExperimentoVO, MetricaSucessoExperimentoVO e MetodoPesquisaVO', () => {
  it('preservam dados de catálogo e comparam igualdade', () => {
    const tipo = TipoExperimentoVO.fromCatalogItem(
      makeCatalogItem(CatalogCategorySlugs.TIPO_EXPERIMENTO, 'a_b', 'Teste A/B'),
    );
    const metrica = MetricaSucessoExperimentoVO.fromCatalogItem(
      makeCatalogItem(CatalogCategorySlugs.METRICA_SUCESSO_DISCOVERY, 'conversion_rate', 'Conversão'),
    );
    const metodo = MetodoPesquisaVO.fromCatalogItem(
      makeCatalogItem(CatalogCategorySlugs.METODO_PESQUISA, 'qualitativa', 'Qualitativa'),
    );

    expect(tipo.equals(tipo)).toBe(true);
    expect(metrica.toCatalogItem().slug).toBe('conversion_rate');
    expect(metodo.getLabel()).toBe('Qualitativa');
  });
});

