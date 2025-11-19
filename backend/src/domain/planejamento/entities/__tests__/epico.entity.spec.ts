import { Epico } from '../epico.entity';
import { EpicoStatus, EpicoStatusVO } from '../../value-objects/epico-status.vo';
import { EpicoHealth, EpicoHealthVO } from '../../value-objects/epico-health.vo';
import { QuarterVO } from '../../value-objects/quarter.vo';

const baseProps = () => ({
  tenantId: 'tenant-01',
  produtoId: 'produto-01',
  titulo: 'Epico Inicial',
  status: EpicoStatusVO.planned(),
  health: EpicoHealthVO.green(),
  quarter: QuarterVO.create('Q1 2026'),
  ownerId: 'pm-01',
});

describe('Epico', () => {
  it('cria épico com valores padrão', () => {
    const epico = Epico.create(baseProps());

    expect(epico.status.getValue()).toBe(EpicoStatus.PLANNED);
    expect(epico.health.getValue()).toBe(EpicoHealth.GREEN);
    expect(epico.toObject().progressPercent).toBe(0);
  });

  it('altera status respeitando transições válidas', () => {
    const epico = Epico.create(baseProps());
    const inProgress = EpicoStatusVO.fromEnum(EpicoStatus.IN_PROGRESS);

    epico.atualizarStatus(inProgress);
    expect(epico.status.getValue()).toBe(EpicoStatus.IN_PROGRESS);

    const planned = EpicoStatusVO.planned();
    expect(() => epico.atualizarStatus(planned)).toThrow(
      'Transição de status inválida de Em Progresso para Planejado',
    );
  });

  it('atualiza health, descrição e objetivo', () => {
    const epico = Epico.create(baseProps());

    epico.atualizarHealth(EpicoHealthVO.fromEnum(EpicoHealth.RED));
    epico.atualizarDescricao('Descrição expandida');
    epico.atualizarObjetivo('Alcançar crescimento', 'Melhorar conversão');

    const objeto = epico.toObject();
    expect(objeto.health.getValue()).toBe(EpicoHealth.RED);
    expect(objeto.descricao).toBe('Descrição expandida');
    expect(objeto.objetivo).toBe('Alcançar crescimento');
    expect(objeto.valueProposition).toBe('Melhorar conversão');
  });

  it('define critérios, squad, datas e progresso validando limites', () => {
    const epico = Epico.create(baseProps());
    const inicio = new Date('2025-01-01');
    const fim = new Date('2025-03-31');

    epico.definirCriteriosERiscos('Critérios', 'Riscos');
    epico.atribuirSquad('squad-1');
    epico.definirDatas(inicio, fim);
    epico.atualizarProgresso(45);

    const objeto = epico.toObject();
    expect(objeto.criteriosAceite).toBe('Critérios');
    expect(objeto.riscos).toBe('Riscos');
    expect(objeto.squadId).toBe('squad-1');
    expect(objeto.startDate).toEqual(inicio);
    expect(objeto.endDate).toEqual(fim);
    expect(objeto.progressPercent).toBe(45);

    expect(() => epico.atualizarProgresso(120)).toThrow('Percentual de progresso inválido');
  });

  it('limpa datas e squad quando valores não informados', () => {
    const epico = Epico.create(baseProps());
    epico.atribuirSquad('squad-1');
    epico.definirDatas(new Date(), new Date());
    epico.definirDatas();
    epico.atribuirSquad();

    const objeto = epico.toObject();
    expect(objeto.startDate).toBeNull();
    expect(objeto.endDate).toBeNull();
    expect(objeto.squadId).toBeUndefined();
  });
});

