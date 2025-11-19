import { Injectable } from '@nestjs/common';
import { RegraAutomacao } from '../entities/regra-automacao.entity';
import { AcaoExecucao } from '../value-objects/acao-regra.vo';

export interface ContextoExecucao {
  demanda?: {
    id: string;
    titulo: string;
    descricao?: string;
    tipo: string;
    origem: string;
    status: string;
    prioridade?: string;
    produtoId: string;
    produto?: {
      id: string;
      nome: string;
    };
    tags?: string[];
    triagem?: {
      status: string;
      impacto?: string;
      urgencia?: string;
      complexidade?: string;
    };
  };
  usuario?: {
    id: string;
    nome: string;
    email: string;
    papel: string;
  };
  tenant: {
    id: string;
    nome: string;
  };
}

export interface ResultadoExecucao {
  sucesso: boolean;
  acoesExecutadas: Array<{
    tipo: string;
    resultado: any;
    erro?: string;
  }>;
  erros?: string[];
}

@Injectable()
export class ExecutorRegrasService {
  async executarRegrasParaContexto(
    regras: RegraAutomacao[],
    contexto: ContextoExecucao,
  ): Promise<ResultadoExecucao[]> {
    const resultados: ResultadoExecucao[] = [];

    // Ordenar regras por ordem de prioridade
    const regrasOrdenadas = [...regras].sort((a, b) => a.ordem - b.ordem);

    for (const regra of regrasOrdenadas) {
      // Verificar se a regra está ativa
      if (!regra.ativo) {
        continue;
      }

      // Verificar se a regra se aplica ao contexto
      if (!regra.aplicaSeAoContexto(contexto)) {
        continue;
      }

      // Executar as ações da regra
      const resultado = await this.executarAcoes(regra.obterAcoesParaExecutar(), contexto);
      resultados.push(resultado);
    }

    return resultados;
  }

  private async executarAcoes(
    acoes: AcaoExecucao[],
    contexto: ContextoExecucao,
  ): Promise<ResultadoExecucao> {
    const acoesExecutadas: Array<{ tipo: string; resultado: any; erro?: string }> = [];
    const erros: string[] = [];

    for (const acao of acoes) {
      try {
        const resultado = await this.executarAcao(acao, contexto);
        acoesExecutadas.push({
          tipo: acao.codigo,
          resultado,
        });
      } catch (error) {
        const mensagemErro = error instanceof Error ? error.message : 'Erro desconhecido';
        erros.push(`Erro ao executar ação ${acao.codigo}: ${mensagemErro}`);
        acoesExecutadas.push({
          tipo: acao.codigo,
          resultado: null,
          erro: mensagemErro,
        });
      }
    }

    return {
      sucesso: erros.length === 0,
      acoesExecutadas,
      erros: erros.length > 0 ? erros : undefined,
    };
  }

  private async executarAcao(acao: AcaoExecucao, contexto: ContextoExecucao): Promise<any> {
    switch (acao.codigo) {
      case 'DEFINIR_CAMPO':
        return this.definirCampo(acao, contexto);

      case 'ADICIONAR_TAG':
        return this.adicionarTag(acao, contexto);

      case 'REMOVER_TAG':
        return this.removerTag(acao, contexto);

      case 'MUDAR_STATUS':
        return this.mudarStatus(acao, contexto);

      case 'MUDAR_PRIORIDADE':
        return this.mudarPrioridade(acao, contexto);

      case 'DEFINIR_IMPACTO':
        return this.definirImpacto(acao, contexto);

      case 'DEFINIR_URGENCIA':
        return this.definirUrgencia(acao, contexto);

      case 'DEFINIR_COMPLEXIDADE':
        return this.definirComplexidade(acao, contexto);

      case 'ATRIBUIR_PM':
        return this.atribuirPM(acao, contexto);

      case 'ATRIBUIR_RESPONSAVEL':
        return this.atribuirResponsavel(acao, contexto);

      case 'ENVIAR_EMAIL':
        return this.enviarEmail(acao, contexto);

      case 'ENVIAR_NOTIFICACAO':
        return this.enviarNotificacao(acao, contexto);

      case 'TORNAR_CAMPO_OBRIGATORIO':
        return this.tornarCampoObrigatorio(acao, contexto);

      case 'VALIDAR_CAMPO':
        return this.validarCampo(acao, contexto);

      case 'CHAMAR_WEBHOOK':
        return this.chamarWebhook(acao, contexto);

      case 'CRIAR_TAREFA':
        return this.criarTarefa(acao, contexto);

      default:
        throw new Error(`Tipo de ação não suportado: ${acao.codigo}`);
    }
  }

  // Implementações das ações
  private definirCampo(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    return {
      campo: acao.campoPath ?? acao.campoSlug,
      valor: acao.valor,
      aplicadoEm: 'demanda',
    };
  }

  private adicionarTag(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    return {
      tag: acao.valor,
      adicionadaEm: 'demanda',
    };
  }

  private removerTag(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    return {
      tag: acao.valor,
      removidaDe: 'demanda',
    };
  }

  private mudarStatus(acao: AcaoExecucao, contexto: ContextoExecucao): any {
    return {
      statusAnterior: contexto.demanda?.status,
      novoStatus: acao.valor,
    };
  }

  private mudarPrioridade(acao: AcaoExecucao, contexto: ContextoExecucao): any {
    return {
      prioridadeAnterior: contexto.demanda?.prioridade,
      novaPrioridade: acao.valor,
    };
  }

  private definirImpacto(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    return {
      impacto: acao.valor,
      definidoAutomaticamente: true,
    };
  }

  private definirUrgencia(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    return {
      urgencia: acao.valor,
      definidoAutomaticamente: true,
    };
  }

  private definirComplexidade(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    return {
      complexidade: acao.valor,
      definidoAutomaticamente: true,
    };
  }

  private atribuirPM(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    return {
      pmId: acao.valor,
      atribuidoAutomaticamente: true,
    };
  }

  private atribuirResponsavel(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    return {
      responsavelId: acao.valor,
      atribuidoAutomaticamente: true,
    };
  }

  private async enviarEmail(acao: AcaoExecucao, contexto: ContextoExecucao): Promise<any> {
    const config = acao.configuracao;
    return {
      destinatario: config?.destinatario || contexto.usuario?.email,
      assunto: config?.assunto,
      template: config?.template,
      enviado: false, // Será implementado quando integrar com serviço de email
    };
  }

  private async enviarNotificacao(acao: AcaoExecucao, contexto: ContextoExecucao): Promise<any> {
    const config = acao.configuracao;
    return {
      usuarioId: config?.usuarioId || contexto.usuario?.id,
      titulo: config?.titulo,
      mensagem: config?.mensagem,
      tipo: config?.tipo || 'info',
      enviada: false, // Será implementado quando integrar com serviço de notificação
    };
  }

  private tornarCampoObrigatorio(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    return {
      campo: acao.campoPath ?? acao.campoSlug,
      obrigatorio: true,
      condicao: 'aplicada_por_regra',
    };
  }

  private validarCampo(acao: AcaoExecucao, _contexto: ContextoExecucao): any {
    const config = acao.configuracao;
    return {
      campo: acao.campoPath ?? acao.campoSlug,
      tipoValidacao: config?.tipo,
      parametros: config?.parametros,
    };
  }

  private async chamarWebhook(acao: AcaoExecucao, contexto: ContextoExecucao): Promise<any> {
    const config = acao.configuracao;
    return {
      url: config?.url,
      metodo: config?.metodo || 'POST',
      payload: {
        ...config?.payload,
        contexto: {
          demandaId: contexto.demanda?.id,
          tenantId: contexto.tenant.id,
        },
      },
      executado: false, // Será implementado quando integrar com serviço HTTP
    };
  }

  private async criarTarefa(acao: AcaoExecucao, contexto: ContextoExecucao): Promise<any> {
    const config = acao.configuracao;
    return {
      titulo: config?.titulo,
      descricao: config?.descricao,
      responsavelId: config?.responsavelId || contexto.usuario?.id,
      prazo: config?.prazo,
      criada: false, // Será implementado quando integrar com sistema de tarefas
    };
  }
}
