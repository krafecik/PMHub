import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { ValidacaoService } from './validacao.service';

@Controller('validacao')
@UseGuards(JwtAuthGuard)
export class ValidacaoController {
  constructor(private readonly service: ValidacaoService) {}

  @Get('status')
  status() {
    return this.service.getStatus();
  }
}

