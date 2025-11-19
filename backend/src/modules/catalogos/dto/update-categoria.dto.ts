import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';

export class UpdateCategoriaDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  nome?: string;

  @IsOptional()
  @IsString()
  @MaxLength(250)
  descricao?: string;

  @IsOptional()
  @IsBoolean()
  escopoProduto?: boolean;
}
