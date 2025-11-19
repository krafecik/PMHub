import { ICommand, ICommandHandler, CommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RegraAutomacao } from '@domain/automacao/entities/regra-automacao.entity';
import { IRegraAutomacaoRepository } from '@domain/automacao/repositories/regra-automacao.repository';
import { CondicaoRegraProps } from '@domain/automacao/value-objects/condicao-regra.vo';
import { AcaoRegraProps } from '@domain/automacao/value-objects/acao-regra.vo';
import {
  CATALOGO_REPOSITORY_TOKEN,
  ICatalogoRepository,
} from '@domain/catalog/catalog.repository.interface';
import { CatalogCategorySlugs } from '@domain/catalog/catalog.constants';

export class CriarRegraCommand implements ICommand {
  constructor(
    public readonly tenantId: string,
    public readonly nome: string,
    public readonly descricao: string | undefined,
    public readonly condicoes: Array<{
      campoId: string;
      operadorId: string;
      valor?: any;
      logica?: 'E' | 'OU';
    }>,
    public readonly acoes: Array<{
      tipoId: string;
      campoId?: string;
      valor?: any;
      configuracao?: Record<string, any>;
    }>,
    public readonly ativo: boolean,
    public readonly ordem: number | undefined,
    public readonly criadoPor: string,
  ) {}
}

@CommandHandler(CriarRegraCommand)
export class CriarRegraHandler implements ICommandHandler<CriarRegraCommand> {
  constructor(
    @Inject('RegraAutomacaoRepository')
    private readonly regraRepository: IRegraAutomacaoRepository,
    @Inject(CATALOGO_REPOSITORY_TOKEN)
    private readonly catalogoRepository: ICatalogoRepository,
  ) {}

  async execute(command: CriarRegraCommand): Promise<{ id: string }> {
    const resolved = await this.resolveCatalogItems(
      command.tenantId,
      command.condicoes,
      command.acoes,
    );

    const regra = RegraAutomacao.criar({
      tenantId: command.tenantId,
      nome: command.nome,
      descricao: command.descricao,
      condicoes: resolved.condicoes,
      acoes: resolved.acoes,
      ativo: command.ativo,
      ordem: command.ordem,
      criadoPor: command.criadoPor,
    });

    await this.regraRepository.save(regra);

    return { id: regra.id.toValue() };
  }

  private async resolveCatalogItems(
    tenantId: string,
    condicoes: Array<{ campoId: string; operadorId: string; valor?: any; logica?: 'E' | 'OU' }>,
    acoes: Array<{
      tipoId: string;
      campoId?: string;
      valor?: any;
      configuracao?: Record<string, any>;
    }>,
  ): Promise<{ condicoes: CondicaoRegraProps[]; acoes: AcaoRegraProps[] }> {
    const condicoesProps: CondicaoRegraProps[] = [];
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

      condicoesProps.push({
        campo: campoItem.toJSON(),
        operador: operadorItem.toJSON(),
        valor: condicao.valor,
        logica: condicao.logica,
      });
    }

    const acoesProps: AcaoRegraProps[] = [];
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

      acoesProps.push({
        tipo: tipoItem.toJSON(),
        campo: campoItem?.toJSON(),
        valor: acao.valor,
        configuracao: acao.configuracao,
      });
    }

    return { condicoes: condicoesProps, acoes: acoesProps };
  }
}
