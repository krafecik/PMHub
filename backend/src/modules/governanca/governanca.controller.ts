import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { GovernancaService } from './governanca.service';

@Controller('governanca')
@UseGuards(JwtAuthGuard)
export class GovernancaController {
  constructor(private readonly service: GovernancaService) {}

  @Get('status')
  status() {
    return this.service.getStatus();
  }
}

