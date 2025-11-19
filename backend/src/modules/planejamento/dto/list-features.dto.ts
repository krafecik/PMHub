import { IsOptional, IsString, IsArray, IsInt, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListFeaturesDto {
  @IsOptional()
  @IsString()
  epicoId?: string;

  @IsOptional()
  @IsString()
  squadId?: string;

  @IsOptional()
  @IsString()
  quarter?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  status?: string[];

  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  pageSize?: number;
}
