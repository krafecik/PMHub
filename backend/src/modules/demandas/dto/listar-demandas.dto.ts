import { Transform, Type } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsEnum,
  IsArray,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { TipoDemanda, OrigemDemanda, Prioridade, StatusDemanda } from '@prisma/client';

export class ListarDemandasDto {
  @IsOptional()
  @IsArray()
  @IsEnum(StatusDemanda, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  status?: StatusDemanda[];

  @IsOptional()
  @IsArray()
  @IsEnum(TipoDemanda, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  tipo?: TipoDemanda[];

  @IsOptional()
  @IsString()
  produtoId?: string;

  @IsOptional()
  @IsString()
  responsavelId?: string;

  @IsOptional()
  @IsArray()
  @IsEnum(OrigemDemanda, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  origem?: OrigemDemanda[];

  @IsOptional()
  @IsArray()
  @IsEnum(Prioridade, { each: true })
  @Transform(({ value }) => (Array.isArray(value) ? value : [value]))
  prioridade?: Prioridade[];

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
  @Max(100)
  pageSize?: number;

  @IsOptional()
  @IsString()
  orderBy?: string;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  orderDirection?: 'asc' | 'desc';
}
