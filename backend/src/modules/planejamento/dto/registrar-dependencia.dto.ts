import { IsOptional, IsString } from 'class-validator';

export class RegistrarDependenciaDto {
  @IsOptional()
  @IsString()
  dependenciaId?: string;

  @IsString()
  featureBloqueadaId!: string;

  @IsString()
  featureBloqueadoraId!: string;

  @IsString()
  tipo!: string;

  @IsString()
  risco!: string;

  @IsOptional()
  @IsString()
  nota?: string;
}
