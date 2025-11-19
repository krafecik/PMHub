import { Documento } from '../documento.aggregate';
import { DocumentoTipoVO } from '../../value-objects/documento-tipo.vo';
import { DocumentoStatusVO } from '../../value-objects/documento-status.vo';
import { VersaoVO } from '../../value-objects/versao.vo';
import { DocumentoVersao } from '../documento-versao.entity';
import { DocumentoVersaoCriadaEvent } from '../../events/documento-versao-criada.event';
import { DocumentoAtualizadoEvent } from '../../events/documento-atualizado.event';
import { DocumentoCriadoEvent } from '../../events/documento-criado.event';

const tipoPRD = new DocumentoTipoVO('PRD');
const statusRascunho = new DocumentoStatusVO('RASCUNHO');

const criarDocumento = (withVersion = true) =>
  Documento.criar({
    tenantId: 'tenant-01',
    tipo: tipoPRD,
    titulo: 'Documento Inicial',
    resumo: 'Resumo inicial',
    status: statusRascunho,
    criadoPorId: 'pm-01',
    versaoInicial: withVersion
      ? {
          documentoId: 'temp',
          tenantId: 'tenant-01',
          versao: new VersaoVO('1.0'),
          objetivo: 'Objetivo inicial',
          createdBy: 'pm-01',
        }
      : undefined,
  });

describe('Documento Aggregate', () => {
  it('cria documento com versão inicial e evento de domínio', () => {
    const documento = criarDocumento(true);

    expect(documento.domainEvents[0]).toBeInstanceOf(DocumentoCriadoEvent);
    expect(documento.versaoAtual).toBeDefined();
    expect(documento.versoes).toHaveLength(1);
  });

  it('adiciona novas versões emitindo evento', () => {
    const documento = criarDocumento(true);
    documento.clearDomainEvents();

    const novaVersao = new DocumentoVersao({
      documentoId: documento.idValue,
      tenantId: documento.tenantId,
      versao: new VersaoVO('1.1'),
      objetivo: 'Objetivo revisado',
      createdBy: 'pm-02',
    });

    documento.adicionarVersao(novaVersao);

    expect(documento.versaoAtual?.versao.getValue()).toBe('1.1');
    expect(documento.domainEvents[0]).toBeInstanceOf(DocumentoVersaoCriadaEvent);
  });

  it('atualiza cabeçalho e dispara evento de atualização', () => {
    const documento = criarDocumento(true);
    documento.clearDomainEvents();

    documento.atualizarCabecalho({
      titulo: 'Documento Revisado',
      resumo: 'Resumo atualizado',
      produtoId: 'produto-1',
      pmId: 'pm-99',
      atualizadoPorId: 'pm-99',
    });

    const objeto = documento.toJSON();
    expect(objeto.titulo).toBe('Documento Revisado');
    expect(objeto.resumo).toBe('Resumo atualizado');
    expect(objeto.produtoId).toBe('produto-1');
    expect(documento.domainEvents[0]).toBeInstanceOf(DocumentoAtualizadoEvent);
  });

  it('atualiza componentes da versão atual', () => {
    const documento = criarDocumento(true);
    const requisitos = [{ codigo: 'RF-1', descricao: 'Descrição' }];
    const riscos = [{ descricao: 'Risco', probabilidade: 'ALTA', impacto: 'ALTO' }];

    documento.atualizarObjetivo('Novo objetivo');
    documento.atualizarContexto({ problema: 'Problema', personas: 'Persona' });
    documento.atualizarFluxos({ descricao: 'Fluxo' });
    documento.atualizarRequisitosFuncionais(requisitos);
    documento.atualizarRegrasNegocio([]);
    documento.atualizarRequisitosNaoFuncionais([]);
    documento.atualizarCriteriosAceite([]);
    documento.atualizarRiscos(riscos);

    const versao = documento.versaoAtual!;
    expect(versao.objetivo).toBe('Novo objetivo');
    expect(versao.contexto?.problema).toBe('Problema');
    expect(versao.requisitosFuncionais).toEqual(requisitos);
    expect(versao.riscos).toEqual(riscos);
  });

  it('lança erro ao atualizar conteúdo sem versão atual', () => {
    const documento = criarDocumento(false);
    expect(() => documento.atualizarObjetivo('Sem versão')).toThrow(
      'Documento não possui versão atual definida',
    );
  });
});

