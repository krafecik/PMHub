import { Feature } from '../feature.entity';
import { FeatureStatus, FeatureStatusVO } from '../../value-objects/feature-status.vo';

const baseProps = () => ({
  tenantId: 'tenant-01',
  epicoId: 'epico-01',
  titulo: 'Feature Inicial',
  descricao: 'Descrição base',
});

describe('Feature', () => {
  it('cria feature com status e dependências padrão', () => {
    const feature = Feature.create(baseProps());
    expect(feature.status.getValue()).toBe(FeatureStatus.PLANNED);
    expect(feature.toObject().dependenciasIds).toEqual([]);
  });

  it('atualiza status e detalhes validando pontos', () => {
    const feature = Feature.create(baseProps());
    feature.atualizarStatus(FeatureStatusVO.fromEnum(FeatureStatus.IN_PROGRESS));
    expect(feature.status.getValue()).toBe(FeatureStatus.IN_PROGRESS);

    feature.atualizarDetalhes({
      descricao: 'Nova descrição',
      pontos: 13,
      riscos: 'Risco elevado',
      criteriosAceite: 'Critério A',
    });

    const objeto = feature.toObject();
    expect(objeto.descricao).toBe('Nova descrição');
    expect(objeto.pontos).toBe(13);
    expect(objeto.riscos).toBe('Risco elevado');
    expect(objeto.criteriosAceite).toBe('Critério A');

    expect(() =>
      feature.atualizarDetalhes({
        pontos: -5,
      }),
    ).toThrow('Pontos não podem ser negativos');
  });

  it('atribui squad, revisa estimativa e define dependências únicas', () => {
    const feature = Feature.create(baseProps());
    feature.atribuirSquad('squad-1');
    feature.revisarEstimativa('pm-99');
    feature.definirDependencias(['f1', 'f2', 'f1']);

    const objeto = feature.toObject();
    expect(objeto.squadId).toBe('squad-1');
    expect(objeto.revisadoPorId).toBe('pm-99');
    expect(objeto.dependenciasIds).toEqual(['f1', 'f2']);
  });
});

