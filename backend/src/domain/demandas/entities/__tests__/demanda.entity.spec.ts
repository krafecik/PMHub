import { Demanda } from '../demanda.entity';
import { TituloVO } from '../../value-objects/titulo.vo';
import { TipoDemandaVO } from '../../value-objects/tipo-demanda.vo';
import { OrigemDemandaVO } from '../../value-objects/origem-demanda.vo';
import { PrioridadeVO } from '../../value-objects/prioridade.vo';
import { StatusDemandaVO } from '../../value-objects/status-demanda.vo';
import {
  buildDemanda,
  createStatusDemanda,
  createTipoDemanda,
  createOrigemDemanda,
  createPrioridadeAlta,
  createPrioridadeCritica,
} from '../../../../../test/fixtures';

const statusNovo = StatusDemandaVO.fromCatalogItem(createStatusDemanda('novo'));
const statusTriagem = StatusDemandaVO.fromCatalogItem(createStatusDemanda('triagem'));
const statusArquivado = StatusDemandaVO.fromCatalogItem(createStatusDemanda('arquivado'));

describe('Demanda', () => {
  const defaultProps = () => ({
    tenantId: 'tenant-01',
    titulo: TituloVO.create('Demanda Inicial'),
    descricao: 'Descrição base',
    tipo: TipoDemandaVO.fromCatalogItem(createTipoDemanda()),
    produtoId: 'produto-01',
    origem: OrigemDemandaVO.fromCatalogItem(createOrigemDemanda()),
    prioridade: PrioridadeVO.fromCatalogItem(createPrioridadeAlta()),
    status: statusNovo,
    criadoPorId: 'pm-01',
  });

  it('cria uma demanda com datas preenchidas automaticamente', () => {
    const demanda = Demanda.create(defaultProps());

    expect(demanda.createdAt).toBeInstanceOf(Date);
    expect(demanda.updatedAt).toBeInstanceOf(Date);
    expect(demanda.isActive()).toBe(true);
  });

  it('atualiza título e descrição quando status permite edição', () => {
    const demanda = buildDemanda({ status: statusNovo });
    const updatedAtBefore = demanda.updatedAt!;

    demanda.atualizarTitulo(TituloVO.create('Título Atualizado'));
    demanda.atualizarDescricao('Descrição revisada');

    expect(demanda.titulo.toString()).toBe('Título Atualizado');
    expect(demanda.descricao).toBe('Descrição revisada');
    expect(demanda.updatedAt).not.toBe(updatedAtBefore);
    expect(demanda.updatedAt!.getTime()).toBeGreaterThanOrEqual(updatedAtBefore.getTime());
  });

  it('impede edição de título e descrição em status não editável', () => {
    const demanda = buildDemanda({ status: statusTriagem });
    expect(() => demanda.atualizarTitulo(TituloVO.create('Título válido'))).toThrow(
      'Demanda não pode ser editada neste status',
    );
    expect(() => demanda.atualizarDescricao('Descrição bloqueada')).toThrow(
      'Demanda não pode ser editada neste status',
    );
  });

  it('altera prioridade, tipo e origem mantendo histórico', () => {
    const demanda = buildDemanda();
    const prioridadeCritica = PrioridadeVO.fromCatalogItem(createPrioridadeCritica());
    const tipoBug = TipoDemandaVO.fromCatalogItem(createTipoDemanda('bug'));
    const origemCliente = OrigemDemandaVO.fromCatalogItem(createOrigemDemanda('cliente'));

    demanda.alterarPrioridade(prioridadeCritica);
    demanda.alterarTipo(tipoBug);
    demanda.alterarOrigem(origemCliente, 'Solicitação via portal');

    expect(demanda.prioridade.equals(prioridadeCritica)).toBe(true);
    expect(demanda.tipo.equals(tipoBug)).toBe(true);
    expect(demanda.origem.equals(origemCliente)).toBe(true);
    expect(demanda.origemDetalhe).toBe('Solicitação via portal');
  });

  it('atribui e remove responsável', () => {
    const demanda = buildDemanda();
    demanda.atribuirResponsavel('pm-99');
    expect(demanda.responsavelId).toBe('pm-99');

    demanda.removerResponsavel();
    expect(demanda.responsavelId).toBeUndefined();
  });

  it('altera status apenas quando transição é permitida', () => {
    const demanda = buildDemanda({ status: statusNovo });

    // transição válida de novo -> triagem
    demanda.alterarStatus(statusTriagem);
    expect(demanda.status.equals(statusTriagem)).toBe(true);

    // transição inválida triagem -> novo
    expect(() => demanda.alterarStatus(statusNovo)).toThrow(
      'Não é possível transicionar de Triagem para Novo',
    );
  });

  it('cancela demanda registrando motivo obrigatório', () => {
    const demanda = buildDemanda({ status: statusNovo });

    expect(() => demanda.cancelar(statusArquivado, '')).toThrow(
      'Motivo do cancelamento é obrigatório',
    );

    demanda.cancelar(statusArquivado, 'Duplicada');
    expect(demanda.status.equals(statusArquivado)).toBe(true);
    expect(demanda.motivoCancelamento).toBe('Duplicada');
  });

  it('executa soft delete e restauração corretamente', () => {
    const demanda = buildDemanda();
    demanda.softDelete();
    expect(demanda.deletedAt).toBeInstanceOf(Date);
    expect(demanda.isActive()).toBe(false);

    demanda.restore();
    expect(demanda.deletedAt).toBeNull();
  });

  it('retorna objeto imutável com toObject', () => {
    const demanda = buildDemanda();
    const objeto = demanda.toObject();
    expect(objeto).toEqual(
      expect.objectContaining({
        tenantId: demanda.tenantId,
        produtoId: demanda.produtoId,
        criadoPorId: demanda.criadoPorId,
      }),
    );

    objeto.descricao = 'mutação externa';
    expect(demanda.descricao).not.toBe('mutação externa');
  });

  it('verifica se demanda está ativa considerando status e exclusão', () => {
    const demanda = buildDemanda({ status: statusNovo });
    expect(demanda.isActive()).toBe(true);

    const arquivada = buildDemanda({ status: statusArquivado });
    expect(arquivada.isActive()).toBe(false);
  });
});

