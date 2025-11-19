import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class CommitmentItemDto {
  @IsString()
  epicoId!: string;

  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  squadId?: string;

  @IsOptional()
  @IsString()
  confianca?: string;
}

class CommitmentAssinaturaDto {
  @IsString()
  papel!: string;

  @IsString()
  usuarioId!: string;
}

export class SaveCommitmentDto {
  @IsString()
  produtoId!: string;

  @IsString()
  quarter!: string;

  @IsOptional()
  @IsString()
  planningCycleId?: string;

  @IsOptional()
  @IsString()
  documentoUrl?: string;

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CommitmentItemDto)
  committed?: CommitmentItemDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CommitmentItemDto)
  targeted?: CommitmentItemDto[];

  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => CommitmentItemDto)
  aspirational?: CommitmentItemDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommitmentAssinaturaDto)
  assinaturas?: CommitmentAssinaturaDto[];
}
