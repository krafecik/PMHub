import { Injectable } from '@nestjs/common';
import { Demanda } from '@domain/demandas/entities/demanda.entity';

@Injectable()
export class DeteccaoDuplicataService {
  /**
   * Calcula a similaridade entre duas demandas
   * Retorna um valor entre 0 e 100
   */
  calcularSimilaridade(demanda1: Demanda, demanda2: Demanda): number {
    const pesoTitulo = 0.4;
    const pesoDescricao = 0.3;
    const pesoTipo = 0.15;
    const pesoProduto = 0.15;

    let similaridadeTotal = 0;

    // Similaridade do título
    const simTitulo = this.calcularSimilaridadeTexto(
      demanda1.titulo.getValue(),
      demanda2.titulo.getValue(),
    );
    similaridadeTotal += simTitulo * pesoTitulo;

    // Similaridade da descrição
    if (demanda1.descricao && demanda2.descricao) {
      const simDescricao = this.calcularSimilaridadeTexto(demanda1.descricao, demanda2.descricao);
      similaridadeTotal += simDescricao * pesoDescricao;
    }

    // Similaridade do tipo
    if (demanda1.tipo.slug === demanda2.tipo.slug) {
      similaridadeTotal += 100 * pesoTipo;
    }

    // Similaridade do produto
    if (demanda1.produtoId === demanda2.produtoId) {
      similaridadeTotal += 100 * pesoProduto;
    }

    return Math.round(similaridadeTotal);
  }

  /**
   * Calcula similaridade entre dois textos usando distância de Levenshtein
   * e análise de n-gramas
   */
  private calcularSimilaridadeTexto(texto1: string, texto2: string): number {
    const t1 = this.normalizar(texto1);
    const t2 = this.normalizar(texto2);

    // Se os textos são iguais
    if (t1 === t2) return 100;

    // Combinar métodos de similaridade
    const simLevenshtein = this.similariadeLevenshtein(t1, t2);
    const simNGramas = this.similaridadeNGramas(t1, t2, 2);
    const simPalavras = this.similaridadePalavras(t1, t2);

    // Média ponderada dos métodos
    return simLevenshtein * 0.3 + simNGramas * 0.4 + simPalavras * 0.3;
  }

  /**
   * Normaliza texto para comparação
   */
  private normalizar(texto: string): string {
    return texto
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^\w\s]/g, ' ') // Remove pontuação
      .replace(/\s+/g, ' ') // Remove espaços múltiplos
      .trim();
  }

  /**
   * Calcula similaridade usando distância de Levenshtein
   */
  private similariadeLevenshtein(s1: string, s2: string): number {
    const distancia = this.distanciaLevenshtein(s1, s2);
    const maxLen = Math.max(s1.length, s2.length);
    if (maxLen === 0) return 100;
    return Math.round((1 - distancia / maxLen) * 100);
  }

  /**
   * Implementação do algoritmo de Levenshtein
   */
  private distanciaLevenshtein(s1: string, s2: string): number {
    const m = s1.length;
    const n = s2.length;
    const dp: number[][] = [];

    for (let i = 0; i <= m; i++) {
      dp[i] = [];
      dp[i][0] = i;
    }

    for (let j = 0; j <= n; j++) {
      dp[0][j] = j;
    }

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        if (s1[i - 1] === s2[j - 1]) {
          dp[i][j] = dp[i - 1][j - 1];
        } else {
          dp[i][j] = Math.min(
            dp[i - 1][j] + 1, // Deletar
            dp[i][j - 1] + 1, // Inserir
            dp[i - 1][j - 1] + 1, // Substituir
          );
        }
      }
    }

    return dp[m][n];
  }

  /**
   * Calcula similaridade usando n-gramas
   */
  private similaridadeNGramas(s1: string, s2: string, n: number): number {
    const ngramas1 = this.extrairNGramas(s1, n);
    const ngramas2 = this.extrairNGramas(s2, n);

    const intersecao = new Set([...ngramas1].filter((ng) => ngramas2.has(ng)));

    const uniao = new Set([...ngramas1, ...ngramas2]);

    if (uniao.size === 0) return 0;
    return Math.round((intersecao.size / uniao.size) * 100);
  }

  /**
   * Extrai n-gramas de um texto
   */
  private extrairNGramas(texto: string, n: number): Set<string> {
    const ngramas = new Set<string>();
    for (let i = 0; i <= texto.length - n; i++) {
      ngramas.add(texto.substring(i, i + n));
    }
    return ngramas;
  }

  /**
   * Calcula similaridade baseada em palavras em comum
   */
  private similaridadePalavras(s1: string, s2: string): number {
    const palavras1 = new Set(s1.split(' ').filter((p) => p.length > 2));
    const palavras2 = new Set(s2.split(' ').filter((p) => p.length > 2));

    const intersecao = new Set([...palavras1].filter((p) => palavras2.has(p)));

    const uniao = new Set([...palavras1, ...palavras2]);

    if (uniao.size === 0) return 0;
    return Math.round((intersecao.size / uniao.size) * 100);
  }

  /**
   * Detecta padrões comuns que indicam duplicação
   */
  detectarPadroesDuplicacao(demanda: Demanda): string[] {
    const padroes: string[] = [];
    const titulo = this.normalizar(demanda.titulo.getValue());
    const descricao = this.normalizar(demanda.descricao || '');

    // Padrões de referência a outras demandas
    const refPattern = /(demanda|ticket|chamado|issue)\s*#?\s*\d+/gi;
    if (refPattern.test(titulo) || refPattern.test(descricao)) {
      padroes.push('referencia_outra_demanda');
    }

    // Palavras que indicam duplicação
    const palavrasDuplicacao = ['duplicado', 'duplicada', 'igual', 'mesmo', 'similar', 'parecido'];
    const textoCombinado = `${titulo} ${descricao}`.toLowerCase();
    if (palavrasDuplicacao.some((p) => textoCombinado.includes(p))) {
      padroes.push('mencao_duplicacao');
    }

    // Padrões de cópia
    if (titulo.includes('copia de') || titulo.includes('copy of')) {
      padroes.push('titulo_copiado');
    }

    return padroes;
  }
}
