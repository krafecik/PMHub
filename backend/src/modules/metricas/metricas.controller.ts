import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { MetricasService } from './metricas.service';

@Controller('metricas')
@UseGuards(JwtAuthGuard)
export class MetricasController {
  constructor(private readonly service: MetricasService) {}

  @Get('status')
  status() {
    return this.service.getStatus();
  }
}
