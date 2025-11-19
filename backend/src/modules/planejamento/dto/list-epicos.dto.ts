import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class ListEpicosDto {
  @IsOptional()
  @IsString()
  produtoId?: string;

  @IsOptional()
  @IsString()
  quarter?: string;

  @IsOptional()
  @IsString()
  squadId?: string;

  @IsOptional()
  @IsArray()
  status?: string[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsNumber()
  page?: number;

  @IsOptional()
  @IsNumber()
  pageSize?: number;
}
