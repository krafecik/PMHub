import { Transform } from 'class-transformer';
import { IsArray, IsNumber, IsOptional, IsString } from 'class-validator';

export class ListarDocumentosDto {
  @IsOptional()
  @IsString()
  termo?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  tipos?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  status?: string[];

  @IsOptional()
  @IsString()
  produtoId?: string;

  @IsOptional()
  @IsString()
  pmId?: string;

  @IsOptional()
  @IsString()
  squadId?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => (Array.isArray(value) ? value : value ? [value] : []))
  tags?: string[];

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  page?: number;

  @IsOptional()
  @Transform(({ value }) => (value ? Number(value) : undefined))
  @IsNumber()
  pageSize?: number;
}
