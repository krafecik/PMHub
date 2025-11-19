import { ICommand, ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { IRegraAutomacaoRepository } from '@domain/automacao/repositories/regra-automacao.repository';
import { CondicaoRegraProps } from '@domain/automacao/value-objects/condicao-regra.vo';
import { AcaoRegraProps } from '@domain/automacao/value-objects/acao-regra.vo';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

export class AtualizarRegraCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly id: string,
    public readonly nome?: string,
    public readonly descricao?: string,
    public readonly condicoes?: Array<{
      campoId: string;
      operadorId: string;
      valor?: any;
      logica?: 'E' | 'OU';
    }>,
    public readonly acoes?: Array<{
      tipoId: string;
      campoId?: string;
      valor?: any;
      configuracao?: Record<string, any>;
    }>,
    public readonly ordem?: number,
  ) {}
}

@CommandHandler(AtualizarRegraCommand)
export class AtualizarRegraHandler implements ICommandHandler<AtualizarRegraCommand> {
  constructor(
    @Inject('RegraAutomacaoRepository')
    private readonly regraRepository: IRegraAutomacaoRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: AtualizarRegraCommand): Promise<void> {
    const regra = await this.regraRepository.findById(command.tenantId, command.id);

    if (!regra) {
      throw new Error('Regra não encontrada');
    }

    // Atualizar apenas os campos fornecidos
    if (command.nome !== undefined) {
      regra.atualizarNome(command.nome);
    }

    if (command.descricao !== undefined) {
      regra.atualizarDescricao(command.descricao);
    }

    if (command.condicoes !== undefined) {
      const condicoesProps = await this.resolveCondicoes(command.tenantId, command.condicoes);
      regra.atualizarCondicoes(condicoesProps);
    }

    if (command.acoes !== undefined) {
      const acoesProps = await this.resolveAcoes(command.tenantId, command.acoes);
      regra.atualizarAcoes(acoesProps);
    }

    if (command.ordem !== undefined) {
      regra.atualizarOrdem(command.ordem);
    }

    await this.regraRepository.save(regra);
  }

  private async resolveCondicoes(
    tenantId: string,
    condicoes:
      | Array<{ campoId: string; operadorId: string; valor?: any; logica?: 'E' | 'OU' }>
      | undefined,
  ): Promise<CondicaoRegraProps[]> {
    if (!condicoes) return [];
    const resultados: CondicaoRegraProps[] = [];
    for (const condicao of condicoes) {
      const [campoItem, operadorItem] = await Promise.all([
        this.catalogoRepository.getRequiredItem({
          tenantId,
          category: CatalogCategorySlugs.AUTOMACAO_CAMPOS,
          id: condicao.campoId,
        }),
        this.catalogoRepository.getRequiredItem({
          tenantId,
          category: CatalogCategorySlugs.AUTOMACAO_OPERADORES,
          id: condicao.operadorId,
        }),
      ]);

      resultados.push({
        campo: campoItem.toJSON(),
        operador: operadorItem.toJSON(),
        valor: condicao.valor,
        logica: condicao.logica,
      });
    }
    return resultados;
  }

  private async resolveAcoes(
    tenantId: string,
    acoes:
      | Array<{ tipoId: string; campoId?: string; valor?: any; configuracao?: Record<string, any> }>
      | undefined,
  ): Promise<AcaoRegraProps[]> {
    if (!acoes) return [];
    const resultados: AcaoRegraProps[] = [];
    for (const acao of acoes) {
      const tipoItem = await this.catalogoRepository.getRequiredItem({
        tenantId,
        category: CatalogCategorySlugs.AUTOMACAO_ACOES,
        id: acao.tipoId,
      });

      let campoItem = null;
      if (acao.campoId) {
        campoItem = await this.catalogoRepository.getRequiredItem({
          tenantId,
          category: CatalogCategorySlugs.AUTOMACAO_CAMPOS,
          id: acao.campoId,
        });
      }

      resultados.push({
        tipo: tipoItem.toJSON(),
        campo: campoItem?.toJSON(),
        valor: acao.valor,
        configuracao: acao.configuracao,
      });
    }
    return resultados;
  }
}
