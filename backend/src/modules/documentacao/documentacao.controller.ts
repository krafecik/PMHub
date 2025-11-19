import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { TenantGuard } from '@core/auth/guards/tenant.guard';
import { TenantId } from '@core/auth/tenant-id.decorator';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';
import {
  AtualizarDocumentoCabecalhoCommand,
  AtualizarDocumentoSecoesCommand,
  CriarDocumentoCommand,
  CriarNovaVersaoCommand,
} from '@application/documentacao/commands';
import {
  CompararVersoesDocumentoQuery,
  ListarDocumentosQuery,
  ListarVersoesDocumentoQuery,
  ObterDocumentoQuery,
} from '@application/documentacao/queries';
import { DocumentacaoAiService } from '@application/documentacao/services';
import { DocumentoVersao, ListarDocumentosResultado } from '@domain/documentacao';
import {
  CreateDocumentoDto,
  CreateDocumentoVersaoDto,
  ListarDocumentosDto,
  UpdateDocumentoCabecalhoDto,
  UpdateDocumentoSecoesDto,
} from './dto';

@Controller('documentacao')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DocumentacaoController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly documentacaoAiService: DocumentacaoAiService,
  ) {}

  @Get('status')
  status() {
    return {
      module: 'documentacao',
      ready: true,
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async criarDocumento(
    @TenantId() tenantId: string,
    @Body() dto: CreateDocumentoDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    const comando = new CriarDocumentoCommand({
      tenantId,
      tipo: dto.tipo,
      titulo: dto.titulo,
      resumo: dto.resumo,
      status: dto.status,
      produtoId: dto.produtoId,
      pmId: dto.pmId,
      squadId: dto.squadId,
      versao: dto.versao,
      objetivo: dto.objetivo,
      contexto: dto.contexto,
      requisitosFuncionais: dto.requisitosFuncionais,
      regrasNegocio: dto.regrasNegocio,
      requisitosNaoFuncionais: dto.requisitosNaoFuncionais,
      fluxos: dto.fluxos,
      criteriosAceite: dto.criteriosAceite,
      riscos: dto.riscos,
      criadoPorId: user.sub,
    });

    const documentoId = await this.commandBus.execute(comando);

    return {
      id: documentoId,
      message: 'Documento criado com sucesso',
    };
  }

  @Get()
  async listarDocumentos(@TenantId() tenantId: string, @Query() dto: ListarDocumentosDto) {
    const resultado = await this.queryBus.execute<ListarDocumentosQuery, ListarDocumentosResultado>(
      new ListarDocumentosQuery({
        tenantId,
        termo: dto.termo,
        tipos: dto.tipos,
        status: dto.status,
        produtoId: dto.produtoId,
        pmId: dto.pmId,
        squadId: dto.squadId,
        tags: dto.tags,
        page: dto.page,
        pageSize: dto.pageSize,
      }),
    );

    return {
      total: resultado.total,
      page: resultado.page,
      pageSize: resultado.pageSize,
      itens: resultado.itens.map((doc) => doc.toJSON()),
    };
  }

  @Get(':id')
  async obterDocumento(@TenantId() tenantId: string, @Param('id') id: string) {
    const documento = await this.queryBus.execute(new ObterDocumentoQuery(tenantId, id));

    return documento.toJSON();
  }

  @Patch(':id')
  async atualizarCabecalho(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentoCabecalhoDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    await this.commandBus.execute(
      new AtualizarDocumentoCabecalhoCommand({
        tenantId,
        documentoId: id,
        titulo: dto.titulo,
        resumo: dto.resumo,
        tipo: dto.tipo,
        status: dto.status,
        produtoId: dto.produtoId,
        pmId: dto.pmId,
        squadId: dto.squadId,
        atualizadoPorId: user.sub,
      }),
    );

    return {
      message: 'Documento atualizado com sucesso',
    };
  }

  @Patch(':id/secoes')
  async atualizarSecoes(
    @TenantId() tenantId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentoSecoesDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    await this.commandBus.execute(
      new AtualizarDocumentoSecoesCommand({
        tenantId,
        documentoId: id,
        atualizadoPorId: user.sub,
        objetivo: dto.objetivo,
        contexto: dto.contexto,
        requisitosFuncionais: dto.requisitosFuncionais,
        regrasNegocio: dto.regrasNegocio,
        requisitosNaoFuncionais: dto.requisitosNaoFuncionais,
        fluxos: dto.fluxos,
        criteriosAceite: dto.criteriosAceite,
        riscos: dto.riscos,
      }),
    );

    return {
      message: 'Seções do documento atualizadas com sucesso',
    };
  }

  @Post(':id/versoes')
  @HttpCode(HttpStatus.CREATED)
  async criarNovaVersao(
    @TenantId() tenantId: string,
    @Param('id') documentoId: string,
    @Body() dto: CreateDocumentoVersaoDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    const versaoId = await this.commandBus.execute(
      new CriarNovaVersaoCommand({
        tenantId,
        documentoId,
        versao: dto.versao,
        criadoPorId: user.sub,
        objetivo: dto.objetivo,
        contexto: dto.contexto,
        requisitosFuncionais: dto.requisitosFuncionais,
        regrasNegocio: dto.regrasNegocio,
        requisitosNaoFuncionais: dto.requisitosNaoFuncionais,
        fluxos: dto.fluxos,
        criteriosAceite: dto.criteriosAceite,
        riscos: dto.riscos,
        changelogResumo: dto.changelogResumo,
      }),
    );

    return {
      id: versaoId,
      message: 'Nova versão criada com sucesso',
    };
  }

  @Get(':id/versoes')
  async listarVersoes(@TenantId() tenantId: string, @Param('id') documentoId: string) {
    const versoes = await this.queryBus.execute<ListarVersoesDocumentoQuery, DocumentoVersao[]>(
      new ListarVersoesDocumentoQuery(tenantId, documentoId),
    );

    return versoes.map((versao) => versao.toJSON());
  }

  @Get(':id/versoes/compare')
  async compararVersoes(
    @TenantId() tenantId: string,
    @Param('id') _documentoId: string,
    @Query('versaoAId') versaoAId: string,
    @Query('versaoBId') versaoBId: string,
  ) {
    const resultado = await this.queryBus.execute(
      new CompararVersoesDocumentoQuery(tenantId, versaoAId, versaoBId),
    );

    return resultado;
  }

  @Post(':id/gerar-prd-draft')
  async gerarPrdDraft(@TenantId() tenantId: string, @Param('id') documentoId: string) {
    try {
      return await this.documentacaoAiService.gerarPrdDraft(tenantId, documentoId);
    } catch (error: any) {
      throw error; // Deixa o NestJS tratar o erro (já está mapeado)
    }
  }

  @Post(':id/sugerir-regras-negocio')
  async sugerirRegrasNegocio(@TenantId() tenantId: string, @Param('id') documentoId: string) {
    return this.documentacaoAiService.sugerirRegrasNegocio(tenantId, documentoId);
  }

  @Post(':id/verificar-consistencia')
  async verificarConsistencia(@TenantId() tenantId: string, @Param('id') documentoId: string) {
    return this.documentacaoAiService.verificarConsistencia(tenantId, documentoId);
  }

  @Post(':id/gerar-cenarios')
  async gerarCenarios(@TenantId() tenantId: string, @Param('id') documentoId: string) {
    return this.documentacaoAiService.gerarCenarios(tenantId, documentoId);
  }

  @Post(':id/gerar-cenarios-gherkin')
  async gerarCenariosGherkin(@TenantId() tenantId: string, @Param('id') documentoId: string) {
    return this.documentacaoAiService.gerarCenariosGherkin(tenantId, documentoId);
  }

  @Post(':id/gerar-release-notes')
  async gerarReleaseNotes(
    @TenantId() tenantId: string,
    @Param('id') documentoId: string,
    @Body('releaseNome') releaseNome: string,
  ) {
    return this.documentacaoAiService.gerarReleaseNotes(tenantId, documentoId, releaseNome);
  }
}
