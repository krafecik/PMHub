import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';
import { AcaoRegra } from '../acao-regra.vo';
import { CondicaoRegra } from '../condicao-regra.vo';
import { NomeRegra } from '../nome-regra.vo';
import { RegraAutomacaoId } from '../regra-automacao-id.vo';
import { createCatalogItem } from '../../../../../test/fixtures';

const createAcaoProps = (metadata?: Record<string, unknown>) =>
  createCatalogItem({
    categorySlug: CatalogCategorySlugs.AUTOMACAO_ACOES,
    slug: 'definir_campo',
    label: 'Definir Campo',
    metadata: { legacyValue: 'definir_campo', ...(metadata ?? {}) },
  }).toJSON();

const createCampoProps = (metadata?: Record<string, unknown>) =>
  createCatalogItem({
    categorySlug: CatalogCategorySlugs.AUTOMACAO_CAMPOS,
    slug: 'triagem.status',
    label: 'Status da Triagem',
    metadata,
  }).toJSON();

const createOperadorProps = (slug: string, metadata?: Record<string, unknown>) =>
  createCatalogItem({
    categorySlug: CatalogCategorySlugs.AUTOMACAO_OPERADORES,
    slug,
    label: slug,
    metadata: { legacyValue: slug, ...(metadata ?? {}) },
  }).toJSON();

describe('NomeRegra', () => {
  it('normaliza valores e valida limites', () => {
    const nome = new NomeRegra('  Regra ABC  ');
    expect(nome.value).toBe('Regra ABC');
    expect(nome.equals(new NomeRegra('Regra ABC'))).toBe(true);
    expect(nome.toString()).toBe('Regra ABC');

    expect(() => new NomeRegra('')).toThrow('Nome da regra não pode ser vazio');
    expect(() => new NomeRegra('ab')).toThrow('Nome da regra deve ter pelo menos 3 caracteres');
    expect(() => new NomeRegra('a'.repeat(101))).toThrow(
      'Nome da regra não pode ter mais de 100 caracteres',
    );
  });
});

describe('RegraAutomacaoId', () => {
  it('gera UUID automaticamente quando não informado', () => {
    const spy = jest.spyOn(require('crypto'), 'randomUUID').mockReturnValue('regra-uuid');
    const generated = new RegraAutomacaoId();
    expect(generated.toValue()).toBe('regra-uuid');
    spy.mockRestore();
  });

  it('utiliza valor informado e compara igualdade', () => {
    const id = new RegraAutomacaoId('regra-01');
    expect(id.equals(new RegraAutomacaoId('regra-01'))).toBe(true);
    expect(id.equals(new RegraAutomacaoId('regra-02'))).toBe(false);
  });
});

describe('AcaoRegra', () => {
  it('cria ação completa e serializa diferentes formatos', () => {
    const acao = new AcaoRegra({
      tipo: createAcaoProps({
        requiresField: true,
        requiresValue: true,
        requiresConfig: true,
      }),
      campo: createCampoProps({ path: 'demanda.status' }),
      valor: 'APROVADO',
      configuracao: { template: 'email' },
    });

    expect(acao.getCodigo()).toBe('DEFINIR_CAMPO');
    expect(acao.getCampo()?.slug).toBe('triagem.status');
    expect(acao.getValor()).toBe('APROVADO');
    expect(acao.getConfiguracao()).toEqual({ template: 'email' });

    expect(acao.toPersistence()).toEqual({
      tipoId: acao.getTipo().id,
      campoId: acao.getCampo()?.id,
      valor: 'APROVADO',
      configuracao: { template: 'email' },
    });

    const execution = acao.toExecution();
    expect(execution.campoPath).toBe('demanda.status');
    expect(execution.codigo).toBe('DEFINIR_CAMPO');
  });

  it('usa slug como caminho quando metadado não definido', () => {
    const acao = new AcaoRegra({
      tipo: createAcaoProps({ requiresField: true }),
      campo: createCampoProps(),
      valor: 'valor',
      configuracao: {},
    });

    expect(acao.toExecution().campoPath).toBe('triagem.status');
  });

  it('valida obrigatoriedade de campo, valor e configuração', () => {
    expect(
      () =>
        new AcaoRegra({
          tipo: createAcaoProps({ requiresField: true }),
          valor: 'valor',
        }),
    ).toThrow('Campo é obrigatório para a ação definir_campo');

    expect(
      () =>
        new AcaoRegra({
          tipo: createAcaoProps({ requiresValue: true }),
          campo: createCampoProps(),
        }),
    ).toThrow('Valor é obrigatório para a ação definir_campo');

    expect(
      () =>
        new AcaoRegra({
          tipo: createAcaoProps({ requiresConfig: true }),
          campo: createCampoProps(),
          valor: 'valor',
        }),
    ).toThrow('Configuração é obrigatória para a ação definir_campo');
  });
});

describe('CondicaoRegra', () => {
  const campo = createCampoProps({ path: 'demanda.status' });

  it('cria condição com valor obrigatório e gera DTOs', () => {
    const condicao = new CondicaoRegra({
      campo,
      operador: createOperadorProps('igual'),
      valor: 'NOVO',
      logica: 'OU',
    });

    expect(condicao.getValor()).toBe('NOVO');
    expect(condicao.getLogica()).toBe('OU');
    expect(condicao.toPersistence()).toEqual({
      campoId: condicao.getCampo().id,
      operadorId: condicao.getOperador().id,
      valor: 'NOVO',
      logica: 'OU',
    });
    expect(condicao.toDTO().operadorSlug).toBe('igual');
  });

  it('resolve caminho pelo metadata path do campo', () => {
    const condicao = new CondicaoRegra({
      campo,
      operador: createOperadorProps('igual'),
      valor: 'NOVO',
    });

    expect(
      condicao.avaliar({
        demanda: { status: 'NOVO' },
      }),
    ).toBe(true);
  });

  it('suporta operadores que não requerem valor', () => {
    const condicao = new CondicaoRegra({
      campo,
      operador: createOperadorProps('vazio', { requiresValue: false }),
    });

    expect(
      condicao.avaliar({
        demanda: {},
      }),
    ).toBe(true);
  });

  it('avalia corretamente todos os operadores suportados', () => {
    const contexto = {
      demanda: {
        status: 'NOVO',
        prioridade: 3,
        tags: ['growth', 'cs'],
        descricao: 'Demanda de crescimento',
      },
    };

    const campoTexto = createCampoProps({ path: 'demanda.descricao' });

    const casos = [
      { slug: 'igual', valor: 'NOVO', esperado: true },
      { slug: 'diferente', valor: 'TRIAGEM', esperado: true },
      { slug: 'contem', valor: 'crescimento', campo: campoTexto, esperado: true },
      { slug: 'nao_contem', valor: 'financeiro', campo: campoTexto, esperado: true },
      { slug: 'maior_que', valor: 2, campo: createCampoProps({ path: 'demanda.prioridade' }), esperado: true },
      { slug: 'menor_que', valor: 5, campo: createCampoProps({ path: 'demanda.prioridade' }), esperado: true },
      { slug: 'maior_ou_igual', valor: 3, campo: createCampoProps({ path: 'demanda.prioridade' }), esperado: true },
      { slug: 'menor_ou_igual', valor: 3, campo: createCampoProps({ path: 'demanda.prioridade' }), esperado: true },
      {
        slug: 'em',
        valor: ['NOVO', 'TRIAGEM'],
        campo: createCampoProps({ path: 'demanda.status' }),
        esperado: true,
      },
      {
        slug: 'nao_em',
        valor: ['TRIAGEM', 'APROVADO'],
        campo: createCampoProps({ path: 'demanda.status' }),
        esperado: true,
      },
      {
        slug: 'vazio',
        campo: createCampoProps({ path: 'demanda.inexistente' }),
        metadata: { requiresValue: false },
        esperado: true,
      },
      {
        slug: 'nao_vazio',
        campo: createCampoProps({ path: 'demanda.descricao' }),
        metadata: { requiresValue: false },
        esperado: true,
      },
    ] as Array<{
      slug: string;
      valor?: unknown;
      campo?: ReturnType<typeof createCampoProps>;
      metadata?: Record<string, unknown>;
      esperado: boolean;
    }>;

    casos.forEach(({ slug, valor, campo: campoCustom, metadata, esperado }) => {
      const condicao = new CondicaoRegra({
        campo: campoCustom ?? campo,
        operador: createOperadorProps(slug, metadata),
        valor,
      });
      expect(condicao.avaliar(contexto)).toBe(esperado);
    });
  });

  it('lança erro para operador desconhecido', () => {
    expect(
      () =>
        new CondicaoRegra({
          campo,
          operador: createOperadorProps('custom_desconhecido'),
        }),
    ).toThrow('Operador de automação desconhecido: custom_desconhecido');
  });
});

