import { DeteccaoDuplicataService } from '../deteccao-duplicata.service';
import { buildDemanda, createOrigemDemanda, createTipoDemanda, createPrioridadeAlta } from '../../../../../test/fixtures';
import { TipoDemandaVO } from '@domain/demandas/value-objects/tipo-demanda.vo';
import { OrigemDemandaVO } from '@domain/demandas/value-objects/origem-demanda.vo';
import { PrioridadeVO } from '@domain/demandas/value-objects/prioridade.vo';

describe('DeteccaoDuplicataService', () => {
  const service = new DeteccaoDuplicataService();

  const demandaBase = buildDemanda({
    titulo: 'Erro ao gerar relatório financeiro mensal',
    descricao:
      'Usuários relatam falha ao exportar o relatório mensal em formato PDF quando há mais de 1000 registros.',
    tipo: TipoDemandaVO.fromCatalogItem(createTipoDemanda('feature')),
    origem: OrigemDemandaVO.fromCatalogItem(createOrigemDemanda('interno')),
    prioridade: PrioridadeVO.fromCatalogItem(createPrioridadeAlta()),
  });

  it('retorna alta similaridade para demandas muito próximas', () => {
    const demandaParecida = buildDemanda({
      titulo: 'Erro exportar relatório financeiro mensal',
      descricao:
        'Ao exportar relatório financeiro mensal com muitos registros o sistema falha ao gerar PDF.',
      tipo: TipoDemandaVO.fromCatalogItem(createTipoDemanda('feature')),
      origem: OrigemDemandaVO.fromCatalogItem(createOrigemDemanda('interno')),
      produtoId: demandaBase.produtoId,
    });

    const similaridade = service.calcularSimilaridade(demandaBase, demandaParecida);
    expect(similaridade).toBeGreaterThan(70);
  });

  it('reduz similaridade quando produtos e tipos diferem', () => {
    const demandaDiferente = buildDemanda({
      titulo: 'Melhorias no dashboard de marketing',
      descricao: 'Adicionar filtros e ordenação avançada no dashboard.',
      tipo: TipoDemandaVO.fromCatalogItem(createTipoDemanda('bug')),
      produtoId: 'produto-99',
    });

    const similaridade = service.calcularSimilaridade(demandaBase, demandaDiferente);
    expect(similaridade).toBeLessThan(40);
  });

  it('detecta padrões de duplicação em títulos e descrições', () => {
    const demandaDuplicada = buildDemanda({
      titulo: 'Cópia de demanda #123 - erro duplicado no checkout',
      descricao:
        'Parece ser duplicada da demanda #123. Cliente relata o mesmo comportamento descrito anteriormente.',
    });

    const padroes = service.detectarPadroesDuplicacao(demandaDuplicada);
    expect(padroes).toEqual(
      expect.arrayContaining(['referencia_outra_demanda', 'mencao_duplicacao', 'titulo_copiado']),
    );
  });
});

