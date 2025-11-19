import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

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
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  origem?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Origem detalhe deve ter no máximo 255 caracteres' })
  origemDetalhe?: string;

  @IsOptional()
  @IsString()
  prioridade?: string;

  @IsOptional()
  @IsString()
  responsavelId?: string | null;

  @IsOptional()
  @IsString()
  status?: string;
}
