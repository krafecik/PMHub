import { IsEnum, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { ProdutoStatus } from '@prisma/client';

export class CreateProdutoDto {
  @IsString()
  @MinLength(3)
  @MaxLength(120)
  nome!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  descricao?: string | null;

  @IsOptional()
  @IsEnum(ProdutoStatus)
  status?: ProdutoStatus;
}

