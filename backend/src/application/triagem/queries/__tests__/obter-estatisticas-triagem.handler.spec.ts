import { ObterEstatisticasTriagemHandler } from '../obter-estatisticas-triagem.handler';
import { ObterEstatisticasTriagemQuery } from '../obter-estatisticas-triagem.query';
import { StatusTriagemEnum } from '@domain/triagem';

describe('ObterEstatisticasTriagemHandler', () => {
  const setup = () => {
    const triagemRepository = {
      findByTenantAndPeriodo: jest.fn(),
    };
    const solicitacaoRepository = {
      findByTenant: jest.fn(),
    };

    const handler = new ObterEstatisticasTriagemHandler(
      triagemRepository as any,
      solicitacaoRepository as any,
    );

    return { handler, triagemRepository, solicitacaoRepository };
  };

  it('calcula métricas agregadas considerando status, impacto e urgência', async () => {
    const { handler, triagemRepository, solicitacaoRepository } = setup();
    const now = new Date();
    const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    triagemRepository.findByTenantAndPeriodo.mockResolvedValue([
      {
        statusTriagem: { value: StatusTriagemEnum.PENDENTE_TRIAGEM },
        impacto: { value: 'ALTO' },
        urgencia: { value: 'ALTA' },
        triadoEm: null,
        createdAt: hourAgo,
      },
      {
        statusTriagem: { value: StatusTriagemEnum.AGUARDANDO_INFO },
        impacto: { value: 'MEDIO' },
        urgencia: null,
        triadoEm: null,
        createdAt: hourAgo,
      },
      {
        statusTriagem: { value: StatusTriagemEnum.PRONTO_DISCOVERY },
        impacto: null,
        urgencia: null,
        triadoEm: now,
        createdAt: hourAgo,
      },
      {
        statusTriagem: { value: StatusTriagemEnum.DUPLICADO },
        impacto: null,
        urgencia: null,
        triadoEm: null,
        createdAt: hourAgo,
      },
      {
        statusTriagem: { value: StatusTriagemEnum.ARQUIVADO_TRIAGEM },
        impacto: null,
        urgencia: null,
        triadoEm: null,
        createdAt: hourAgo,
      },
    ]);

    solicitacaoRepository.findByTenant.mockResolvedValue([
      { createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), respondidoEm: now },
    ]);

    const resultado = await handler.execute(
      new ObterEstatisticasTriagemQuery('tenant-1', undefined),
    );

    expect(resultado.totalPendentes).toBe(1);
    expect(resultado.aguardandoInfo).toBe(1);
    expect(resultado.prontosDiscovery).toBe(1);
    expect(resultado.duplicados).toBe(1);
    expect(resultado.arquivados).toBe(1);
    expect(resultado.distribuicaoPorImpacto.ALTO).toBe(1);
    expect(resultado.distribuicaoPorUrgencia.ALTA).toBe(1);
    expect(resultado.slaMedio).toBeGreaterThanOrEqual(1); // em horas
    expect(resultado.tempoMedioAguardandoInfo).toBeGreaterThanOrEqual(2); // em dias
    expect(resultado.taxaDuplicacao).toBe(20);
    expect(resultado.taxaArquivamento).toBe(20);
    expect(resultado.taxaAprovacao).toBe(20);
  });

  it('retorna métricas zeradas quando não há dados', async () => {
    const { handler, triagemRepository, solicitacaoRepository } = setup();
    triagemRepository.findByTenantAndPeriodo.mockResolvedValue([]);
    solicitacaoRepository.findByTenant.mockResolvedValue([]);

    const resultado = await handler.execute(
      new ObterEstatisticasTriagemQuery('tenant-1', undefined),
    );

    expect(resultado.totalPendentes).toBe(0);
    expect(resultado.taxaDuplicacao).toBe(0);
    expect(resultado.distribuicaoPorStatus).toEqual({});
  });
});

