import { IsString, MinLength, MaxLength } from 'class-validator';

export class AdicionarComentarioDto {
  @IsString()
  @MinLength(1, { message: 'Comentário não pode estar vazio' })
  @MaxLength(5000, { message: 'Comentário deve ter no máximo 5000 caracteres' })
  texto!: string;
}
