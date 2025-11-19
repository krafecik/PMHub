import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PkcePair, createPkcePair } from './pkce.util';

type StoredState = {
  codeVerifier: string;
  createdAt: number;
  expiresAt: number;
};

@Injectable()
export class AuthStateStore {
  private readonly ttlMs = 5 * 60 * 1000; // 5 minutos
  private readonly store = new Map<string, StoredState>();

  createState(): { state: string; pkce: PkcePair } {
    const state = randomUUID();
    const pkce = createPkcePair();
    this.store.set(state, {
      codeVerifier: pkce.codeVerifier,
      createdAt: Date.now(),
      expiresAt: Date.now() + this.ttlMs,
    });

    return { state, pkce };
  }

  consumeState(state: string): StoredState {
    const stored = this.store.get(state);
    if (!stored) {
      throw new BadRequestException('Estado de autenticação inválido ou expirado.');
    }

    if (stored.expiresAt < Date.now()) {
      this.store.delete(state);
      throw new BadRequestException('Estado de autenticação expirado.');
    }

    this.store.delete(state);
    return stored;
  }
}
