import { ExecutorRegrasService, ContextoExecucao } from '../executor-regras.service';
import { RegraAutomacao } from '../../entities/regra-automacao.entity';

const createContexto = (): ContextoExecucao => ({
  demanda: {
    id: 'demanda-1',
    titulo: 'Melhoria na jornada',
    status: 'novo',
    prioridade: 'media',
    produtoId: 'produto-1',
  },
  usuario: {
    id: 'usuario-1',
    nome: 'Usuário Teste',
    email: 'user@example.com',
    papel: 'PM',
  },
  tenant: {
    id: 'tenant-1',
    nome: 'Tenant Teste',
  },
});

const createRegraStub = (
  overrides: Partial<RegraAutomacao> & {
    ordem: number;
    ativo: boolean;
    aplicaSeAoContexto: jest.Mock;
    obterAcoesParaExecutar: jest.Mock;
  },
): RegraAutomacao => overrides as unknown as RegraAutomacao;

describe('ExecutorRegrasService', () => {
  const service = new ExecutorRegrasService();

  it('executa regras ativas e aplicáveis respeitando prioridade', async () => {
    const contexto = createContexto();
    const regraAltaPrioridade = createRegraStub({
      ordem: 1,
      ativo: true,
      aplicaSeAoContexto: jest.fn().mockReturnValue(true),
      obterAcoesParaExecutar: jest.fn().mockReturnValue([
        { codigo: 'ADICIONAR_TAG', valor: 'prioritaria' },
        { codigo: 'MUDAR_STATUS', valor: 'triagem' },
      ]),
    });

    const regraBaixaPrioridade = createRegraStub({
      ordem: 2,
      ativo: true,
      aplicaSeAoContexto: jest.fn().mockReturnValue(true),
      obterAcoesParaExecutar: jest.fn().mockReturnValue([
        { codigo: 'ENVIAR_EMAIL', configuracao: { assunto: 'Atualização' } },
      ]),
    });

    const regraInativa = createRegraStub({
      ordem: 0,
      ativo: false,
      aplicaSeAoContexto: jest.fn(),
      obterAcoesParaExecutar: jest.fn(),
    });

    const resultados = await service.executarRegrasParaContexto(
      [regraBaixaPrioridade, regraInativa, regraAltaPrioridade],
      contexto,
    );

    expect(resultados).toHaveLength(2);
    expect(regraAltaPrioridade.obterAcoesParaExecutar).toHaveBeenCalled();
    expect(regraBaixaPrioridade.obterAcoesParaExecutar).toHaveBeenCalled();
    expect(resultados[0].acoesExecutadas[0]).toMatchObject({
      tipo: 'ADICIONAR_TAG',
      resultado: { tag: 'prioritaria', adicionadaEm: 'demanda' },
    });
    expect(resultados[1].acoesExecutadas[0].resultado).toMatchObject({
      destinatario: contexto.usuario?.email,
      assunto: 'Atualização',
    });
  });

  it('registra erros ao executar ações não suportadas', async () => {
    const contexto = createContexto();
    const regra = createRegraStub({
      ordem: 1,
      ativo: true,
      aplicaSeAoContexto: jest.fn().mockReturnValue(true),
      obterAcoesParaExecutar: jest.fn().mockReturnValue([{ codigo: 'ACAO_DESCONHECIDA' }]),
    });

    const [resultado] = await service.executarRegrasParaContexto([regra], contexto);

    expect(resultado.sucesso).toBe(false);
    expect(resultado.erros?.[0]).toContain('Tipo de ação não suportado: ACAO_DESCONHECIDA');
    expect(resultado.acoesExecutadas[0]).toMatchObject({
      tipo: 'ACAO_DESCONHECIDA',
      resultado: null,
      erro: 'Tipo de ação não suportado: ACAO_DESCONHECIDA',
    });
  });

  it('ignora regras que não se aplicam ao contexto', async () => {
    const contexto = createContexto();
    const regraNaoAplicavel = createRegraStub({
      ordem: 1,
      ativo: true,
      aplicaSeAoContexto: jest.fn().mockReturnValue(false),
      obterAcoesParaExecutar: jest.fn(),
    });

    const resultados = await service.executarRegrasParaContexto([regraNaoAplicavel], contexto);

    expect(resultados).toHaveLength(0);
    expect(regraNaoAplicavel.obterAcoesParaExecutar).not.toHaveBeenCalled();
  });
});

