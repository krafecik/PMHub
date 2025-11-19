import { Injectable } from '@nestjs/common';

@Injectable()
export class IdeiasService {
  getStatus() {
    return {
      module: 'ideias',
      ready: false,
    };
  }
}
