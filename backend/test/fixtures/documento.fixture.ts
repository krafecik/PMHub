import { Documento } from '@domain/documentacao/entities/documento.aggregate';
import { DocumentoVersaoProps } from '@domain/documentacao/entities/documento-versao.entity';
import { DocumentoStatusVO } from '@domain/documentacao/value-objects/documento-status.vo';
import { DocumentoTipoVO } from '@domain/documentacao/value-objects/documento-tipo.vo';
import { VersaoVO } from '@domain/documentacao/value-objects/versao.vo';

type DocumentoBuilderOptions = {
  tenantId?: string;
  titulo?: string;
  resumo?: string;
  tipo?: DocumentoTipoVO;
  status?: DocumentoStatusVO;
  produtoId?: string;
  pmId?: string;
  squadId?: string;
  criadoPorId?: string;
  versaoInicial?: Partial<DocumentoVersaoProps>;
};

export const buildDocumento = (overrides: DocumentoBuilderOptions = {}): Documento => {
  const tenantId = overrides.tenantId ?? 'tenant-01';
  const criadoPorId = overrides.criadoPorId ?? 'pm-01';
  const tipo = overrides.tipo ?? new DocumentoTipoVO('PRD');
  const status = overrides.status ?? new DocumentoStatusVO('RASCUNHO');

  const versaoInicial: DocumentoVersaoProps = {
    documentoId: overrides.versaoInicial?.documentoId ?? 'temp-documento-id',
    tenantId,
    versao: overrides.versaoInicial?.versao ?? new VersaoVO('1.0'),
    objetivo: overrides.versaoInicial?.objetivo ?? 'Objetivo inicial de teste',
    contexto: overrides.versaoInicial?.contexto ?? {
      problema: 'Problema descrito para teste',
      personas: 'Persona de teste',
    },
    requisitosFuncionais: overrides.versaoInicial?.requisitosFuncionais ?? [],
    regrasNegocio: overrides.versaoInicial?.regrasNegocio ?? [],
    requisitosNaoFuncionais: overrides.versaoInicial?.requisitosNaoFuncionais ?? [],
    fluxos: overrides.versaoInicial?.fluxos ?? { descricao: 'Fluxo resumido' },
    criteriosAceite: overrides.versaoInicial?.criteriosAceite ?? [],
    riscos: overrides.versaoInicial?.riscos ?? [],
    changelogResumo: overrides.versaoInicial?.changelogResumo,
    conteudoJson: overrides.versaoInicial?.conteudoJson ?? {},
    createdBy: overrides.versaoInicial?.createdBy ?? criadoPorId,
  };

  return Documento.criar({
    tenantId,
    tipo,
    titulo: overrides.titulo ?? 'Documento de teste',
    resumo: overrides.resumo ?? 'Resumo padrão do documento de teste',
    status,
    produtoId: overrides.produtoId ?? 'produto-01',
    pmId: overrides.pmId ?? 'pm-01',
    squadId: overrides.squadId,
    criadoPorId,
    versaoInicial,
  });
};
