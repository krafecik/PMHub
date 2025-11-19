import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { IdeiasService } from './ideias.service';

@Controller('ideias')
@UseGuards(JwtAuthGuard)
export class IdeiasController {
  constructor(private readonly service: IdeiasService) {}

  @Get('status')
  status() {
    return this.service.getStatus();
  }
}
