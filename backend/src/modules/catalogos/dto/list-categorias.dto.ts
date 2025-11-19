import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';

const ORDER_BY_FIELDS = ['nome', 'slug', 'created_at'] as const;
const ORDER_DIRECTIONS = ['asc', 'desc'] as const;

export class ListCategoriasDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  search?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  slug?: string;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  context?: string;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeItens?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeItensDeleted?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeItensInativos?: boolean;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  page?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(200)
  pageSize?: number;

  @IsOptional()
  @IsIn(ORDER_BY_FIELDS)
  orderBy?: (typeof ORDER_BY_FIELDS)[number];

  @IsOptional()
  @IsIn(ORDER_DIRECTIONS)
  orderDirection?: (typeof ORDER_DIRECTIONS)[number];
}
