import { Injectable } from '@nestjs/common';

@Injectable()
export class GovernancaService {
  getStatus() {
    return {
      module: 'governanca',
      ready: false
    };
  }
}

