import { Injectable } from '@nestjs/common';

@Injectable()
export class EstrategiaService {
  getStatus() {
    return {
      module: 'estrategia',
      ready: false
    };
  }
}

