import { AnaliseSinaisService } from '../analise-sinais.service';

describe('AnaliseSinaisService', () => {
  const service = new AnaliseSinaisService();

  it('gera sinais de falta de evidência e descrição imprecisa quando requisitos não atendidos', () => {
    const sinais = service.avaliar({
      descricao: 'Resumo curto',
      anexosCount: 0,
      requireEvidence: true,
      minPalavrasDescricao: 5,
      minCaracteresDescricao: 40,
    });

    expect(sinais).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ tipo: 'falta_evidencia', severidade: 'danger' }),
        expect.objectContaining({ tipo: 'descricao_imprecisa', severidade: 'warning' }),
      ]),
    );
  });

  it('indica contexto útil quando descrição atende critérios e não exige evidências', () => {
    const sinais = service.avaliar({
      descricao:
        'Descrição completa do problema com detalhes relevantes e cenários impactados pela demanda.',
      anexosCount: 0,
      requireEvidence: false,
      minPalavrasDescricao: 5,
      minCaracteresDescricao: 40,
    });

    expect(sinais).toHaveLength(1);
    expect(sinais[0]).toMatchObject({ tipo: 'contexto_util', severidade: 'success' });
  });

  it('considera anexos quando evidências são obrigatórias', () => {
    const sinais = service.avaliar({
      descricao:
        'Esta demanda possui contexto completo e anexos suficientes para seguir para discovery.',
      anexosCount: 2,
      requireEvidence: true,
      minPalavrasDescricao: 5,
      minCaracteresDescricao: 40,
    });

    expect(sinais).toHaveLength(1);
    expect(sinais[0].tipo).toBe('contexto_util');
  });
});

