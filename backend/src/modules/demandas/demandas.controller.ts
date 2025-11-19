import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { FileInterceptor } from '@nestjs/platform-express';
import { Express } from 'express';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@core/auth/guards/tenant.guard';
import { TenantId } from '@core/auth/tenant-id.decorator';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';
import { CriarDemandaRapidaCommand } from '@application/demandas/commands/criar-demanda-rapida.command';
import { ListarDemandasQuery } from '@application/demandas/queries/listar-demandas.query';
import { ListarDemandasResult } from '@application/demandas/queries/listar-demandas.handler';
import { BuscarDemandaPorIdQuery } from '@application/demandas/queries/buscar-demanda-por-id.query';
import { DemandaDetalhada } from '@application/demandas/queries/buscar-demanda-por-id.handler';
import { AdicionarComentarioCommand } from '@application/demandas/commands/adicionar-comentario.command';
import { AdicionarAnexoCommand } from '@application/demandas/commands/adicionar-anexo.command';
import { AdicionarTagCommand } from '@application/demandas/commands/adicionar-tag.command';
import { RemoverTagCommand } from '@application/demandas/commands/remover-tag.command';
import { CancelarDemandaCommand } from '@application/demandas/commands/cancelar-demanda.command';
import { ListarComentariosQuery } from '@application/demandas/queries/listar-comentarios.query';
import { ComentarioListItem } from '@application/demandas/queries/listar-comentarios.handler';
import { ListarAnexosQuery } from '@application/demandas/queries/listar-anexos.query';
import { Anexo } from '@infra/repositories/demandas/anexo.repository.interface';
import { CriarDemandaRapidaDto } from './dto/criar-demanda-rapida.dto';
import { ListarDemandasDto } from './dto/listar-demandas.dto';
import { AdicionarComentarioDto } from './dto/adicionar-comentario.dto';
import { AtualizarDemandaDto } from './dto/atualizar-demanda.dto';
import { AtualizarDemandaCommand } from '@application/demandas/commands/atualizar-demanda.command';

@Controller('demandas')
@UseGuards(JwtAuthGuard, TenantGuard)
export class DemandasController {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
  ) {}

  @Post('rapida')
  @HttpCode(HttpStatus.CREATED)
  async criarDemandaRapida(
    @TenantId() tenantId: string,
    @Body() dto: CriarDemandaRapidaDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    const command = new CriarDemandaRapidaCommand(
      tenantId,
      dto.titulo,
      dto.tipo,
      dto.produtoId,
      user.sub,
      dto.descricao,
      dto.origem,
      dto.origemDetalhe,
      dto.prioridade,
      dto.status,
      dto.responsavelId,
    );

    const demandaId = await this.commandBus.execute(command);

    return {
      id: demandaId,
      message: 'Demanda criada com sucesso',
    };
  }

  @Get()
  async listarDemandas(
    @TenantId() tenantId: string,
    @Query() dto: ListarDemandasDto,
  ): Promise<ListarDemandasResult> {
    const query = new ListarDemandasQuery(tenantId, {
      status: dto.status,
      tipo: dto.tipo,
      produtoId: dto.produtoId,
      responsavelId: dto.responsavelId,
      origem: dto.origem,
      prioridade: dto.prioridade,
      search: dto.search,
      page: dto.page || 1,
      pageSize: dto.pageSize || 50,
      orderBy: dto.orderBy || 'created_at',
      orderDirection: dto.orderDirection || 'desc',
    });

    return this.queryBus.execute(query);
  }

  @Get(':id')
  async buscarDemandaPorId(
    @TenantId() tenantId: string,
    @Param('id') id: string,
  ): Promise<DemandaDetalhada> {
    const query = new BuscarDemandaPorIdQuery(tenantId, id);
    return this.queryBus.execute(query);
  }

  @Patch(':id')
  async atualizarDemanda(
    @TenantId() tenantId: string,
    @Param('id') demandaId: string,
    @Body() dto: AtualizarDemandaDto,
  ) {
    const command = new AtualizarDemandaCommand(
      tenantId,
      demandaId,
      dto.titulo,
      dto.descricao,
      dto.tipo,
      dto.origem,
      dto.origemDetalhe,
      dto.prioridade,
      dto.responsavelId,
      dto.status,
    );

    await this.commandBus.execute(command);

    return {
      message: 'Demanda atualizada com sucesso',
    };
  }

  @Post(':id/comentarios')
  @HttpCode(HttpStatus.CREATED)
  async adicionarComentario(
    @TenantId() tenantId: string,
    @Param('id') demandaId: string,
    @Body() dto: AdicionarComentarioDto,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    const command = new AdicionarComentarioCommand(tenantId, demandaId, user.sub, dto.texto);

    const comentarioId = await this.commandBus.execute(command);

    return {
      id: comentarioId,
      message: 'Comentário adicionado com sucesso',
    };
  }

  @Get(':id/comentarios')
  async listarComentarios(@Param('id') demandaId: string): Promise<ComentarioListItem[]> {
    const query = new ListarComentariosQuery(demandaId);
    return this.queryBus.execute(query);
  }

  @Post(':id/anexos')
  @UseInterceptors(FileInterceptor('arquivo'))
  @HttpCode(HttpStatus.CREATED)
  async adicionarAnexo(
    @TenantId() tenantId: string,
    @Param('id') demandaId: string,
    @UploadedFile() arquivo: Express.Multer.File,
    @CurrentUser() user: JwtAccessPayload,
  ) {
    if (!arquivo) {
      throw new BadRequestException('Arquivo é obrigatório');
    }

    const command = new AdicionarAnexoCommand(tenantId, demandaId, arquivo, user.sub);

    return this.commandBus.execute(command);
  }

  @Get(':id/anexos')
  async listarAnexos(@Param('id') demandaId: string): Promise<Anexo[]> {
    const query = new ListarAnexosQuery(demandaId);
    return this.queryBus.execute(query);
  }

  @Post(':id/tags')
  @HttpCode(HttpStatus.CREATED)
  async adicionarTag(
    @TenantId() tenantId: string,
    @Param('id') demandaId: string,
    @Body() dto: { tagNome: string },
  ) {
    const command = new AdicionarTagCommand(tenantId, demandaId, dto.tagNome);
    await this.commandBus.execute(command);
    return { message: 'Tag adicionada com sucesso' };
  }

  @Delete(':id/tags/:tagId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removerTag(
    @TenantId() tenantId: string,
    @Param('id') demandaId: string,
    @Param('tagId') tagId: string,
  ) {
    const command = new RemoverTagCommand(tenantId, demandaId, tagId);
    await this.commandBus.execute(command);
  }

  @Post(':id/cancelar')
  @HttpCode(HttpStatus.OK)
  async cancelarDemanda(
    @TenantId() tenantId: string,
    @Param('id') demandaId: string,
    @Body() dto: { motivoCancelamento: string },
  ) {
    const command = new CancelarDemandaCommand(tenantId, demandaId, dto.motivoCancelamento);
    await this.commandBus.execute(command);
    return { message: 'Demanda cancelada com sucesso' };
  }
}
