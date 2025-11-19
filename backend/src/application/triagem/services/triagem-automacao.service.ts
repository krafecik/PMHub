import { Inject, Injectable } from '@nestjs/common';
import {
  ExecutorRegrasService,
  ResultadoExecucao,
  ContextoExecucao,
} from '@domain/automacao/services/executor-regras.service';
import { IRegraAutomacaoRepository } from '@domain/automacao/repositories/regra-automacao.repository';
import { Demanda, PrioridadeVO, StatusDemandaVO } from '@domain/demandas';
import { TriagemDemanda, Impacto, Urgencia, Complexidade } from '@domain/triagem';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

@Injectable()
export class TriagemAutomacaoService {
  constructor(
    @Inject('RegraAutomacaoRepository')
    private readonly regraAutomacaoRepository: IRegraAutomacaoRepository,
    private readonly executorRegrasService: ExecutorRegrasService,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async executar(
    tenantId: string,
    demanda: Demanda,
    triagem: TriagemDemanda,
    usuarioId: string,
  ): Promise<{ triagemAlterada: boolean; demandaAlterada: boolean }> {
    const regras = await this.regraAutomacaoRepository.findAtivasByTenant(tenantId);

    if (!regras || regras.length === 0) {
      return { triagemAlterada: false, demandaAlterada: false };
    }

    const contexto = this.buildContextoExecucao(tenantId, demanda, triagem, usuarioId);

    const resultados = await this.executorRegrasService.executarRegrasParaContexto(
      regras,
      contexto,
    );

    return this.aplicarResultados(resultados, tenantId, demanda, triagem);
  }

  private buildContextoExecucao(
    tenantId: string,
    demanda: Demanda,
    triagem: TriagemDemanda,
    usuarioId: string,
  ): ContextoExecucao {
    return {
      tenant: {
        id: tenantId,
        nome: '',
      },
      usuario: {
        id: usuarioId,
        nome: '',
        email: '',
        papel: '',
      },
      demanda: {
        id: demanda.id ?? '',
        titulo: demanda.titulo.getValue(),
        descricao: demanda.descricao,
        tipo: demanda.tipo.slug,
        origem: demanda.origem.slug,
        status: demanda.status.slug,
        prioridade: demanda.prioridade.slug,
        produtoId: demanda.produtoId,
        produto: {
          id: demanda.produtoId,
          nome: '',
        },
        triagem: {
          status: triagem.statusTriagem.value,
          impacto: triagem.impacto?.value,
          urgencia: triagem.urgencia?.value,
          complexidade: triagem.complexidadeEstimada?.value,
        },
      },
    };
  }

  private async aplicarResultados(
    resultados: ResultadoExecucao[],
    tenantId: string,
    demanda: Demanda,
    triagem: TriagemDemanda,
  ): Promise<{ triagemAlterada: boolean; demandaAlterada: boolean }> {
    let triagemAlterada = false;
    let demandaAlterada = false;

    for (const resultado of resultados) {
      for (const acao of resultado.acoesExecutadas) {
        const tipo = acao.tipo.toUpperCase();
        const data = acao.resultado ?? {};

        switch (tipo) {
          case 'DEFINIR_IMPACTO': {
            const valor = this.extractEnumValue(data?.impacto ?? data?.valor);
            if (valor) {
              try {
                triagem.definirAvaliacao(Impacto.fromString(valor));
                triagemAlterada = true;
              } catch {
                // Ignorar valores inválidos
              }
            }
            break;
          }
          case 'DEFINIR_URGENCIA': {
            const valor = this.extractEnumValue(data?.urgencia ?? data?.valor);
            if (valor) {
              try {
                triagem.definirAvaliacao(undefined, Urgencia.fromString(valor));
                triagemAlterada = true;
              } catch {
                // Ignorar valores inválidos
              }
            }
            break;
          }
          case 'DEFINIR_COMPLEXIDADE': {
            const valor = this.extractEnumValue(data?.complexidade ?? data?.valor);
            if (valor) {
              try {
                triagem.definirAvaliacao(undefined, undefined, Complexidade.fromString(valor));
                triagemAlterada = true;
              } catch {
                // Ignorar valores inválidos
              }
            }
            break;
          }
          case 'ATRIBUIR_PM': {
            const pmId = this.extractString(data?.pmId ?? data?.valor);
            if (pmId) {
              try {
                demanda.atribuirResponsavel(pmId);
                demandaAlterada = true;
              } catch {
                // Ignorar erros ao atribuir responsável
              }
            }
            break;
          }
          case 'MUDAR_PRIORIDADE': {
            const prioridade = this.extractSlug(data?.novaPrioridade ?? data?.valor);
            if (prioridade) {
              try {
                const item = await this.catalogoRepository.getRequiredItem({
                  tenantId,
                  category: CatalogCategorySlugs.PRIORIDADE_NIVEL,
                  slug: prioridade,
                });
                const novaPrioridade = PrioridadeVO.fromCatalogItem(item);
                demanda.alterarPrioridade(novaPrioridade);
                demandaAlterada = true;
              } catch {
                // Ignorar erros de alteração de prioridade
              }
            }
            break;
          }
          case 'MUDAR_STATUS': {
            const status = this.extractSlug(data?.novoStatus ?? data?.valor);
            if (status) {
              try {
                const item = await this.catalogoRepository.getRequiredItem({
                  tenantId,
                  category: CatalogCategorySlugs.STATUS_DEMANDA,
                  slug: status,
                });
                const novoStatus = StatusDemandaVO.fromCatalogItem(item);
                if (!demanda.status.equals(novoStatus)) {
                  demanda.alterarStatus(novoStatus);
                  demandaAlterada = true;
                }
              } catch {
                // Ignorar transições inválidas
              }
            }
            break;
          }
          default:
            break;
        }
      }
    }

    return { triagemAlterada, demandaAlterada };
  }

  private extractEnumValue(value: unknown): string | null {
    if (typeof value === 'string') {
      return value.trim().toUpperCase();
    }
    if (typeof value === 'number') {
      return String(value).trim().toUpperCase();
    }
    return null;
  }

  private extractString(value: unknown): string | null {
    if (typeof value === 'string') {
      const trimmed = value.trim();
      return trimmed.length > 0 ? trimmed : null;
    }
    if (typeof value === 'number') {
      return String(value);
    }
    return null;
  }

  private extractSlug(value: unknown): string | null {
    const text = this.extractString(value);
    if (!text) {
      return null;
    }
    return this.toSlug(text);
  }

  private toSlug(value: string): string {
    return value
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
