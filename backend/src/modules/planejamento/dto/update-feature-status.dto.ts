import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateFeatureStatusDto {
  @IsString()
  @IsNotEmpty()
  status!: string;
}
