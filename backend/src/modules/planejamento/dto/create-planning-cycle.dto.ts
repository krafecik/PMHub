import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

class ChecklistEntryDto {
  @IsString()
  chave!: string;

  @IsString()
  @MaxLength(180)
  label!: string;

  @IsBoolean()
  @Type(() => Boolean)
  concluido!: boolean;

  @IsOptional()
  @IsString()
  responsavel?: string;
}

export class CreatePlanningCycleDto {
  @IsOptional()
  @IsString()
  produtoId?: string;

  @IsString()
  quarter!: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistEntryDto)
  checklist?: ChecklistEntryDto[];

  @IsOptional()
  @IsString()
  agendaUrl?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  participantesConfirmados?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  participantesTotais?: number;

  @IsOptional()
  dadosPreparacao?: Record<string, unknown>;
}
