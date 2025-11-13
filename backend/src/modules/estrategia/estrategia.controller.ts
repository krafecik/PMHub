import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { EstrategiaService } from './estrategia.service';

@Controller('estrategia')
@UseGuards(JwtAuthGuard)
export class EstrategiaController {
  constructor(private readonly service: EstrategiaService) {}

  @Get('status')
  status() {
    return this.service.getStatus();
  }
}

