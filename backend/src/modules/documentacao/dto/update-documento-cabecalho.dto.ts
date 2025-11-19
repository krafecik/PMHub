import { IsNumberString, IsOptional, IsString } from 'class-validator';

export class UpdateDocumentoCabecalhoDto {
  @IsOptional()
  @IsString()
  titulo?: string;

  @IsOptional()
  @IsString()
  resumo?: string;

  @IsOptional()
  @IsString()
  tipo?: string;

  @IsOptional()
  @IsString()
  status?: string;

  @IsOptional()
  @IsNumberString()
  produtoId?: string;

  @IsOptional()
  @IsNumberString()
  pmId?: string;

  @IsOptional()
  @IsNumberString()
  squadId?: string;
}
