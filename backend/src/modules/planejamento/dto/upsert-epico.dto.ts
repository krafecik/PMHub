import { IsString, IsOptional, IsNumber, Max, Min } from 'class-validator';

export class UpsertEpicoDto {
  @IsOptional()
  @IsString()
  epicoId?: string;

  @IsString()
  produtoId!: string;

  @IsOptional()
  @IsString()
  planningCycleId?: string;

  @IsOptional()
  @IsString()
  squadId?: string;

  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  objetivo?: string;

  @IsOptional()
  @IsString()
  valueProposition?: string;

  @IsOptional()
  @IsString()
  criteriosAceite?: string;

  @IsOptional()
  @IsString()
  riscos?: string;

  @IsString()
  quarter!: string;

  @IsString()
  ownerId!: string;

  @IsOptional()
  @IsString()
  sponsorId?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  health?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent?: number;

  @IsOptional()
  @IsString()
  startDate?: string;

  @IsOptional()
  @IsString()
  endDate?: string;
}
