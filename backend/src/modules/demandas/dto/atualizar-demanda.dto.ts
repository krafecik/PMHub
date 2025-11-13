import { IsString, IsEnum, IsOptional, MinLength, MaxLength } from 'class-validator';
import { TipoDemanda, OrigemDemanda, Prioridade, StatusDemanda } from '@prisma/client';

export class AtualizarDemandaDto {
  @IsOptional()
  @IsString()
  @MinLength(5, { message: 'Título deve ter no mínimo 5 caracteres' })
  @MaxLength(255, { message: 'Título deve ter no máximo 255 caracteres' })
  titulo?: string;

  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Descrição deve ter no máximo 5000 caracteres' })
  descricao?: string;

  @IsOptional()
  @IsEnum(TipoDemanda, { message: 'Tipo de demanda inválido' })
  tipo?: TipoDemanda;

  @IsOptional()
  @IsEnum(OrigemDemanda, { message: 'Origem de demanda inválida' })
  origem?: OrigemDemanda;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Origem detalhe deve ter no máximo 255 caracteres' })
  origemDetalhe?: string;

  @IsOptional()
  @IsEnum(Prioridade, { message: 'Prioridade inválida' })
  prioridade?: Prioridade;

  @IsOptional()
  @IsString()
  responsavelId?: string | null;

  @IsOptional()
  @IsEnum(StatusDemanda, { message: 'Status de demanda inválido' })
  status?: StatusDemanda;
}
