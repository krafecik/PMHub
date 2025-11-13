import { Injectable } from '@nestjs/common';

@Injectable()
export class MetricasService {
  getStatus() {
    return {
      module: 'metricas',
      ready: false
    };
  }
}

