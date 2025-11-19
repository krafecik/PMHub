import { Feature } from '@domain/planejamento/entities/feature.entity';
import { FeatureStatusVO } from '@domain/planejamento/value-objects/feature-status.vo';

type FeatureBuilderOptions = {
  id?: string;
  tenantId?: string;
  epicoId?: string;
  titulo?: string;
  descricao?: string;
  squadId?: string;
  pontos?: number;
  status?: FeatureStatusVO;
  riscos?: string;
  dependenciasIds?: string[];
  criteriosAceite?: string;
  revisadoPorId?: string;
};

export const buildFeature = (overrides: FeatureBuilderOptions = {}): Feature =>
  Feature.create({
    tenantId: overrides.tenantId ?? 'tenant-01',
    epicoId: overrides.epicoId ?? 'epico-01',
    titulo: overrides.titulo ?? 'Feature de teste',
    descricao: overrides.descricao ?? 'Descrição padrão da feature',
    squadId: overrides.squadId,
    pontos: overrides.pontos,
    status: overrides.status ?? FeatureStatusVO.planned(),
    riscos: overrides.riscos,
    dependenciasIds: overrides.dependenciasIds ?? [],
    criteriosAceite: overrides.criteriosAceite,
    revisadoPorId: overrides.revisadoPorId,
  });
