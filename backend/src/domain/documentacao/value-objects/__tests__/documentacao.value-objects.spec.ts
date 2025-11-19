import { DocumentoId } from '../documento-id.vo';
import { DocumentoStatusVO } from '../documento-status.vo';
import { DocumentoTipoVO } from '../documento-tipo.vo';
import { VersaoVO } from '../versao.vo';

describe('DocumentoTipoVO', () => {
  it('normaliza valores para maiúsculo e valida tipos suportados', () => {
    const tipo = new DocumentoTipoVO('prd');
    expect(tipo.getValue()).toBe('PRD');
    expect(tipo.equals(new DocumentoTipoVO('PRD'))).toBe(true);
    expect(() => new DocumentoTipoVO('whitepaper')).toThrow('Tipo de documento inválido: whitepaper');
  });
});

describe('DocumentoStatusVO', () => {
  it('normaliza para maiúsculo e compara corretamente', () => {
    const status = new DocumentoStatusVO('rascunho');
    expect(status.getValue()).toBe('RASCUNHO');
    expect(status.equals(new DocumentoStatusVO('RASCUNHO'))).toBe(true);
    expect(() => new DocumentoStatusVO('draft')).toThrow('Status de documento inválido: draft');
  });
});

describe('VersaoVO', () => {
  it('aceita padrões semânticos e rejeita formatos inválidos', () => {
    const versao = new VersaoVO('1.2.3');
    expect(versao.getValue()).toBe('1.2.3');
    expect(versao.equals(new VersaoVO('1.2.3'))).toBe(true);
    expect(() => new VersaoVO('')).toThrow('Versão não pode ser vazia');
    expect(() => new VersaoVO('1.2-beta')).toThrow(
      'Versão deve seguir o padrão semântico (ex: 1.0, 1.2.3)',
    );
  });
});

describe('DocumentoId', () => {
  it('gera identificador automaticamente quando não informado', () => {
    const spy = jest.spyOn(require('crypto'), 'randomUUID').mockReturnValue('uuid-simulada');
    const generated = new DocumentoId();
    expect(spy).toHaveBeenCalledTimes(1);
    expect(generated.toValue()).toBe('uuid-simulada');
    spy.mockRestore();
  });

  it('utiliza valor fornecido e compara igualdade', () => {
    const id = new DocumentoId('doc-123');
    const same = new DocumentoId('doc-123');

    expect(id.toValue()).toBe('doc-123');
    expect(id.equals(same)).toBe(true);
    expect(id.equals(new DocumentoId('doc-456'))).toBe(false);
  });
});

