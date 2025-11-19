import { Type } from 'class-transformer';
import { IsBoolean, IsOptional } from 'class-validator';

export class GetCategoriaDto {
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeItens?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeItensInativos?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeItensDeleted?: boolean;

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  includeDeleted?: boolean;
}
