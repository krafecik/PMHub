import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { DocumentacaoService } from './documentacao.service';

@Controller('documentacao')
@UseGuards(JwtAuthGuard)
export class DocumentacaoController {
  constructor(private readonly service: DocumentacaoService) {}

  @Get('status')
  status() {
    return this.service.getStatus();
  }
}

