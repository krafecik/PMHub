import { Injectable } from '@nestjs/common';

@Injectable()
export class DemandasService {
  getStatus() {
    return {
      module: 'Demandas',
      status: 'operational',
      version: '1.0.0',
    };
  }
}
