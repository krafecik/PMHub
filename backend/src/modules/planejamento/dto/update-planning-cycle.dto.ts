import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdatePlanningCycleDto {
  @IsOptional()
  @IsString()
  statusSlug?: string;

  @IsOptional()
  @IsNumber()
  faseAtual?: number;

  @IsOptional()
  @IsArray()
  checklist?: any[];

  @IsOptional()
  @IsNumber()
  participantesConfirmados?: number;

  @IsOptional()
  @IsNumber()
  participantesTotais?: number;

  @IsOptional()
  @IsString()
  agendaUrl?: string;

  @IsOptional()
  dadosPreparacao?: Record<string, unknown>;
}
