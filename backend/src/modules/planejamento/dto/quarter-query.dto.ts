import { IsString } from 'class-validator';

export class QuarterQueryDto {
  @IsString()
  quarter!: string;
}
