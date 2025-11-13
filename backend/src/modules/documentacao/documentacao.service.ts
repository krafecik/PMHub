import { Injectable } from '@nestjs/common';

@Injectable()
export class DocumentacaoService {
  getStatus() {
    return {
      module: 'documentacao',
      ready: false
    };
  }
}

