import { IsNotEmpty, IsString } from 'class-validator';

export class SelectTenantDto {
  @IsString()
  @IsNotEmpty()
  tenantId!: string;
}

