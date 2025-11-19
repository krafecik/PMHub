import { IsNumber, IsOptional, IsString, Max, Min } from 'class-validator';

export class UpdateCapacidadeDto {
  @IsString()
  quarter!: string;

  @IsNumber()
  capacidadeTotal!: number;

  @IsNumber()
  capacidadeUsada!: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  bufferPercentual!: number;

  @IsOptional()
  ajustes?: Record<string, unknown>;
}
