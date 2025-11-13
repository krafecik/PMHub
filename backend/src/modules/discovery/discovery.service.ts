import { Injectable } from '@nestjs/common';

@Injectable()
export class DiscoveryService {
  getStatus() {
    return {
      module: 'discovery',
      ready: false
    };
  }
}

