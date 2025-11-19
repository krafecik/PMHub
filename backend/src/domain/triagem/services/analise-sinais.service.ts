import { Injectable } from '@nestjs/common';

export type TriagemSinalSeveridade = 'danger' | 'warning' | 'success';

export interface TriagemSinal {
  tipo: 'falta_evidencia' | 'descricao_imprecisa' | 'contexto_util';
  titulo: string;
  descricao: string;
  severidade: TriagemSinalSeveridade;
}

export interface TriagemAnaliseContexto {
  descricao?: string;
  anexosCount: number;
  requireEvidence: boolean;
  minPalavrasDescricao: number;
  minCaracteresDescricao: number;
}

@Injectable()
export class AnaliseSinaisService {
  avaliar(contexto: TriagemAnaliseContexto): TriagemSinal[] {
    const sinais: TriagemSinal[] = [];
    const descricao = (contexto.descricao ?? '').trim();
    const palavras = descricao.length > 0 ? descricao.split(/\s+/).filter(Boolean) : [];
    const atendeDescricao =
      descricao.length >= contexto.minCaracteresDescricao &&
      palavras.length >= contexto.minPalavrasDescricao;
    const possuiEvidencias = contexto.anexosCount > 0;

    if (contexto.requireEvidence && !possuiEvidencias) {
      sinais.push({
        tipo: 'falta_evidencia',
        titulo: 'Faltam evidências',
        descricao:
          'Nenhum anexo ou evidência foi encontrado. Inclua prints, documentos ou dados que comprovem o impacto.',
        severidade: 'danger',
      });
    }

    if (!atendeDescricao) {
      sinais.push({
        tipo: 'descricao_imprecisa',
        titulo: 'Descrição imprecisa',
        descricao: `A descrição atual está abaixo do mínimo recomendado (${contexto.minPalavrasDescricao} palavras e ${contexto.minCaracteresDescricao} caracteres). Detalhe melhor o problema ou oportunidade.`,
        severidade: 'warning',
      });
    }

    if (atendeDescricao && (possuiEvidencias || !contexto.requireEvidence)) {
      sinais.push({
        tipo: 'contexto_util',
        titulo: 'Contexto útil',
        descricao:
          'A demanda possui contexto detalhado e evidências suficientes para avançar com segurança.',
        severidade: 'success',
      });
    }

    return sinais;
  }
}
