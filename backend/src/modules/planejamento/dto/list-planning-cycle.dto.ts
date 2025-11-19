import { IsOptional, IsString } from 'class-validator';

export class ListPlanningCycleDto {
  @IsOptional()
  @IsString()
  quarter?: string;

  @IsOptional()
  @IsString()
  produtoId?: string;
}
