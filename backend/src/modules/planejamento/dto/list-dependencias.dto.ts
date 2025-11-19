import { IsOptional, IsString } from 'class-validator';

export class ListDependenciasDto {
  @IsOptional()
  @IsString()
  featureId?: string;

  @IsOptional()
  @IsString()
  epicoId?: string;

  @IsOptional()
  @IsString()
  quarter?: string;
}
