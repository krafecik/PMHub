import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateEpicoStatusDto {
  @IsString()
  status!: string;

  @IsOptional()
  @IsString()
  health?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(100)
  progressPercent?: number;
}
