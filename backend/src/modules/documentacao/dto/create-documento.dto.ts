import { Type } from 'class-transformer';
import { IsArray, IsNumberString, IsOptional, IsString, ValidateNested } from 'class-validator';

export class ContextoDto {
  @IsOptional()
  @IsString()
  problema?: string;

  @IsOptional()
  @IsString()
  dados?: string;

  @IsOptional()
  @IsString()
  personas?: string;
}

export class RequisitoFuncionalDto {
  @IsString()
  codigo!: string;

  @IsString()
  descricao!: string;

  @IsOptional()
  @IsString()
  prioridade?: string;
}

export class RegraNegocioDto {
  @IsString()
  codigo!: string;

  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  descricao?: string;

  @IsString()
  tipo!: string;

  @IsString()
  origem!: string;

  @IsString()
  impacto!: string;

  @IsOptional()
  @IsString()
  modulo?: string;
}

export class RequisitoNaoFuncionalDto {
  @IsString()
  categoria!: string;

  @IsString()
  descricao!: string;

  @IsOptional()
  @IsString()
  metrica?: string;
}

export class FluxoDto {
  @IsOptional()
  @IsString()
  diagramaUrl?: string;

  @IsOptional()
  @IsString()
  descricao?: string;
}

export class CriterioAceiteDto {
  @IsOptional()
  @IsString()
  codigo?: string;

  @IsString()
  descricao!: string;

  @IsOptional()
  @IsString()
  cenario?: string;
}

export class RiscoDto {
  @IsString()
  descricao!: string;

  @IsString()
  probabilidade!: string;

  @IsString()
  impacto!: string;

  @IsOptional()
  @IsString()
  mitigacao?: string;
}

export class CreateDocumentoDto {
  @IsString()
  tipo!: string;

  @IsString()
  titulo!: string;

  @IsOptional()
  @IsString()
  resumo?: string;

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

  @IsOptional()
  @IsString()
  versao?: string;

  @IsOptional()
  @IsString()
  objetivo?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ContextoDto)
  contexto?: ContextoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequisitoFuncionalDto)
  requisitosFuncionais?: RequisitoFuncionalDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RegraNegocioDto)
  regrasNegocio?: RegraNegocioDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RequisitoNaoFuncionalDto)
  requisitosNaoFuncionais?: RequisitoNaoFuncionalDto[];

  @IsOptional()
  @ValidateNested()
  @Type(() => FluxoDto)
  fluxos?: FluxoDto;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CriterioAceiteDto)
  criteriosAceite?: CriterioAceiteDto[];

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RiscoDto)
  riscos?: RiscoDto[];
}
