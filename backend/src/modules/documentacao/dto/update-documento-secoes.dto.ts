import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import {
  ContextoDto,
  CriterioAceiteDto,
  FluxoDto,
  RegraNegocioDto,
  RequisitoFuncionalDto,
  RequisitoNaoFuncionalDto,
  RiscoDto,
} from './create-documento.dto';

export class UpdateDocumentoSecoesDto {
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
