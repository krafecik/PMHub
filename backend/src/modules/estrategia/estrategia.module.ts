import { Module } from '@nestjs/common';
import { EstrategiaController } from './estrategia.controller';
import { EstrategiaService } from './estrategia.service';

@Module({
  controllers: [EstrategiaController],
  providers: [EstrategiaService]
})
export class EstrategiaModule {}

