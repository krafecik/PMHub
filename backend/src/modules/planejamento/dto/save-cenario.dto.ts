import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

class AjusteCapacidadeDto {
  @IsString()
  squadId!: string;

  @IsNumber()
  @Min(-100)
  @Max(100)
  deltaPercentual!: number;
}

export class SaveCenarioDto {
  @IsOptional()
  @IsString()
  cenarioId?: string;

  @IsOptional()
  @IsString()
  planningCycleId?: string;

  @IsString()
  quarter!: string;

  @IsString()
  nome!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsOptional()
  @IsString()
  statusSlug?: string;

  @IsOptional()
  @IsBoolean()
  incluirContractors?: boolean;

  @IsOptional()
  @IsBoolean()
  considerarFerias?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  bufferRiscoPercentual?: number;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AjusteCapacidadeDto)
  ajustesCapacidade?: AjusteCapacidadeDto[];
}
