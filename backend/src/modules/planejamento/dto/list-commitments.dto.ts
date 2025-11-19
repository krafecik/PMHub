import { IsOptional, IsString } from 'class-validator';

export class ListCommitmentsDto {
  @IsOptional()
  @IsString()
  produtoId?: string;

  @IsOptional()
  @IsString()
  quarter?: string;

  @IsOptional()
  @IsString()
  planningCycleId?: string;
}
