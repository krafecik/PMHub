import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpsertFeatureDto {
  @IsOptional()
  @IsString()
  featureId?: string;

  @IsString()
  epicoId!: string;

  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  squadId?: string;

  @IsOptional()
  @IsNumber()
  pontos?: number;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsString()
  riscos?: string;

  @IsOptional()
  @IsString()
  criteriosAceite?: string;

  @IsOptional()
  @IsArray()
  dependenciasIds?: string[];

  @IsOptional()
  @IsString()
  revisadoPorId?: string;
}
