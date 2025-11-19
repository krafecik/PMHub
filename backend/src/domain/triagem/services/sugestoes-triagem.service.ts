import { Injectable } from '@nestjs/common';

export type TriagemSugestaoTipo = 'duplicatas' | 'discovery' | 'acao';
export type TriagemSugestaoPrioridade = 'alta' | 'media' | 'baixa';

export interface SugestaoRelacionado {
  id: string;
  titulo: string;
  referencia?: string;
  tipo: 'demanda' | 'discovery';
  metadados?: Record<string, unknown>;
}

export interface TriagemSugestao {
  tipo: TriagemSugestaoTipo;
  titulo: string;
  descricao: string;
  prioridade: TriagemSugestaoPrioridade;
  relacionados?: SugestaoRelacionado[];
}

export interface PossivelDuplicataResumo {
  id: string;
  titulo: string;
  similaridade: number;
}

export interface DiscoveryRelacionadoResumo {
  id: string;
  titulo: string;
  status: string;
  responsavel?: string;
}

export interface SugestoesTriagemContexto {
  impacto?: string;
  urgencia?: string;
  complexidade?: string;
  descricaoDetalhada: boolean;
  possuiDuplicatas: boolean;
  duplicatas: PossivelDuplicataResumo[];
  discoveriesRelacionados: DiscoveryRelacionadoResumo[];
  checklistPendentes: number;
  anexosObrigatoriosPendentes: boolean;
}

@Injectable()
export class SugestoesTriagemService {
  gerarSugestoes(contexto: SugestoesTriagemContexto): TriagemSugestao[] {
    const sugestoes: TriagemSugestao[] = [];

    if (contexto.possuiDuplicatas && contexto.duplicatas.length > 0) {
      sugestoes.push({
        tipo: 'duplicatas',
        prioridade: 'media',
        titulo: 'Verifique possíveis duplicatas',
        descricao:
          'Encontramos demandas semelhantes que podem representar o mesmo problema ou oportunidade. Avalie antes de avançar.',
        relacionados: contexto.duplicatas.map((duplicata) => ({
          id: duplicata.id,
          titulo: duplicata.titulo,
          referencia: `Similaridade ${Math.round(duplicata.similaridade)}%`,
          tipo: 'demanda',
        })),
      });
    }

    if (contexto.discoveriesRelacionados.length > 0) {
      sugestoes.push({
        tipo: 'discovery',
        prioridade: 'media',
        titulo: 'Conecte com discoveries relacionados',
        descricao:
          'Existem iniciativas de discovery recentes para o mesmo produto. Vincule ou reaproveite aprendizados.',
        relacionados: contexto.discoveriesRelacionados.map((discovery) => ({
          id: discovery.id,
          titulo: discovery.titulo,
          referencia: `Status: ${discovery.status}`,
          tipo: 'discovery',
          metadados: discovery.responsavel
            ? {
                responsavel: discovery.responsavel,
              }
            : undefined,
        })),
      });
    }

    // Bloco removido conforme solicitado, pois a regra de "pendentes" estava
    // conflitando com o estado real da demanda em alguns cenários.
    // if (contexto.checklistPendentes > 0 || contexto.anexosObrigatoriosPendentes) {
    //   sugestoes.push({
    //     tipo: 'acao',
    //     prioridade: 'alta',
    //     titulo: 'Solicite informações adicionais',
    //     descricao:
    //       'Há itens obrigatórios pendentes na checklist ou evidências faltando. Peça ao solicitante para complementar antes de seguir.',
    //   });
    // }

    const impactoAlto = ['ALTO', 'CRITICO'].includes((contexto.impacto ?? '').toUpperCase());
    const urgenciaAlta = ['ALTA', 'CRITICA'].includes((contexto.urgencia ?? '').toUpperCase());
    const complexidadeAlta = ['ALTA', 'CRITICO'].includes(
      (contexto.complexidade ?? '').toUpperCase(),
    );

    if (impactoAlto && urgenciaAlta && contexto.descricaoDetalhada && !contexto.possuiDuplicatas) {
      sugestoes.push({
        tipo: 'acao',
        prioridade: 'alta',
        titulo: 'Avançar para Discovery',
        descricao:
          'Impacto e urgência elevados com contexto suficiente. Considere criar o discovery imediatamente.',
      });
    }

    if (complexidadeAlta && impactoAlto) {
      sugestoes.push({
        tipo: 'acao',
        prioridade: 'media',
        titulo: 'Avalie evoluir para épico',
        descricao:
          'Demanda com alto impacto e complexidade pode indicar iniciativa maior. Considere transformar em épico.',
      });
    }

    if (!contexto.descricaoDetalhada && !contexto.anexosObrigatoriosPendentes) {
      sugestoes.push({
        tipo: 'acao',
        prioridade: 'baixa',
        titulo: 'Refine a descrição',
        descricao:
          'Melhore o contexto com métricas, stakeholders envolvidos e impacto quantificado para facilitar priorização.',
      });
    }

    return sugestoes;
  }
}
