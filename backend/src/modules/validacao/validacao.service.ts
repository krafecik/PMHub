import { Injectable } from '@nestjs/common';

@Injectable()
export class ValidacaoService {
  getStatus() {
    return {
      module: 'validacao',
      ready: false,
    };
  }
}
