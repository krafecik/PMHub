import { Demanda } from '@domain/demandas/entities/demanda.entity';
import { OrigemDemandaVO } from '@domain/demandas/value-objects/origem-demanda.vo';
import { PrioridadeVO } from '@domain/demandas/value-objects/prioridade.vo';
import { StatusDemandaVO } from '@domain/demandas/value-objects/status-demanda.vo';
import { TipoDemandaVO } from '@domain/demandas/value-objects/tipo-demanda.vo';
import { TituloVO } from '@domain/demandas/value-objects/titulo.vo';
import {
  createOrigemDemanda,
  createPrioridadeAlta,
  createStatusDemanda,
  createTipoDemanda,
} from './catalog-item.fixture';

type DemandaBuilderOptions = {
  id?: string;
  tenantId?: string;
  titulo?: string | TituloVO;
  descricao?: string;
  tipo?: TipoDemandaVO;
  produtoId?: string;
  origem?: OrigemDemandaVO;
  origemDetalhe?: string | null;
  responsavelId?: string | null;
  prioridade?: PrioridadeVO;
  status?: StatusDemandaVO;
  criadoPorId?: string;
  motivoCancelamento?: string | null;
};

export const buildDemanda = (overrides: DemandaBuilderOptions = {}): Demanda => {
  const titulo =
    overrides.titulo instanceof TituloVO
      ? overrides.titulo
      : TituloVO.create(overrides.titulo ?? 'Demanda de teste');

  return Demanda.create({
    id: overrides.id,
    tenantId: overrides.tenantId ?? 'tenant-01',
    titulo,
    descricao: overrides.descricao ?? 'Descrição padrão para demanda de teste',
    tipo: overrides.tipo ?? TipoDemandaVO.fromCatalogItem(createTipoDemanda()),
    produtoId: overrides.produtoId ?? 'produto-01',
    origem: overrides.origem ?? OrigemDemandaVO.fromCatalogItem(createOrigemDemanda()),
    origemDetalhe: overrides.origemDetalhe ?? null,
    responsavelId: overrides.responsavelId ?? 'pm-01',
    prioridade: overrides.prioridade ?? PrioridadeVO.fromCatalogItem(createPrioridadeAlta()),
    status: overrides.status ?? StatusDemandaVO.fromCatalogItem(createStatusDemanda('novo')),
    criadoPorId: overrides.criadoPorId ?? 'pm-01',
    motivoCancelamento: overrides.motivoCancelamento ?? null,
  });
};
