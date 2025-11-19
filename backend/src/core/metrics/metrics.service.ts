import { Injectable } from '@nestjs/common';
import { collectDefaultMetrics, Counter, Histogram, Registry, Summary } from 'prom-client';

@Injectable()
export class MetricsService {
  private readonly registry: Registry;

  private readonly loginAttempts: Counter<string>;
  private readonly loginSuccess: Counter<string>;
  private readonly loginFailure: Counter<string>;
  private readonly accountLocked: Counter<string>;
  private readonly inviteSent: Counter<string>;
  private readonly inviteAccepted: Counter<string>;
  private readonly inviteRevoked: Counter<string>;
  private readonly passwordResetRequested: Counter<string>;
  private readonly passwordResetCompleted: Counter<string>;
  private readonly requestDuration: Histogram<string>;
  private readonly queueSummary: Summary<string>;

  constructor() {
    this.registry = new Registry();
    collectDefaultMetrics({
      register: this.registry,
      prefix: 'cpopm_',
    });

    this.loginAttempts = new Counter({
      name: 'cpopm_auth_login_attempt_total',
      help: 'Número de tentativas de login recebidas',
      labelNames: ['provider', 'tenantId'],
      registers: [this.registry],
    });

    this.loginSuccess = new Counter({
      name: 'cpopm_auth_login_success_total',
      help: 'Número de logins bem sucedidos',
      labelNames: ['provider', 'tenantId'],
      registers: [this.registry],
    });

    this.loginFailure = new Counter({
      name: 'cpopm_auth_login_failure_total',
      help: 'Número de logins que falharam',
      labelNames: ['reason', 'tenantId'],
      registers: [this.registry],
    });

    this.accountLocked = new Counter({
      name: 'cpopm_auth_account_locked_total',
      help: 'Número de contas bloqueadas por tentativas inválidas',
      labelNames: ['tenantId'],
      registers: [this.registry],
    });

    this.inviteSent = new Counter({
      name: 'cpopm_auth_invite_sent_total',
      help: 'Convites enviados por tenant',
      labelNames: ['tenantId', 'role'],
      registers: [this.registry],
    });

    this.inviteAccepted = new Counter({
      name: 'cpopm_auth_invite_accepted_total',
      help: 'Convites aceitos por tenant',
      labelNames: ['tenantId', 'role'],
      registers: [this.registry],
    });

    this.inviteRevoked = new Counter({
      name: 'cpopm_auth_invite_revoked_total',
      help: 'Convites revogados manualmente',
      labelNames: ['tenantId'],
      registers: [this.registry],
    });

    this.passwordResetRequested = new Counter({
      name: 'cpopm_auth_reset_requested_total',
      help: 'Solicitações de redefinição de senha',
      labelNames: ['tenantId'],
      registers: [this.registry],
    });

    this.passwordResetCompleted = new Counter({
      name: 'cpopm_auth_reset_completed_total',
      help: 'Redefinições de senha concluídas',
      labelNames: ['tenantId'],
      registers: [this.registry],
    });

    this.requestDuration = new Histogram({
      name: 'cpopm_auth_request_duration_seconds',
      help: 'Tempo de processamento de requisições de autenticação',
      labelNames: ['operation'],
      buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5],
      registers: [this.registry],
    });

    this.queueSummary = new Summary({
      name: 'cpopm_auth_queue_summary_seconds',
      help: 'Latência das filas e e-mails de autenticação',
      labelNames: ['operation'],
      percentiles: [0.5, 0.9, 0.99],
      registers: [this.registry],
    });
  }

  async getMetrics(): Promise<string> {
    return this.registry.metrics();
  }

  get contentType(): string {
    return this.registry.contentType;
  }

  recordLoginAttempt(labels: { provider: string; tenantId: string }) {
    this.loginAttempts.inc(labels);
  }

  recordLoginSuccess(labels: { provider: string; tenantId: string }) {
    this.loginSuccess.inc(labels);
  }

  recordLoginFailure(labels: { reason: string; tenantId: string }) {
    this.loginFailure.inc(labels);
  }

  recordAccountLocked(labels: { tenantId: string }) {
    this.accountLocked.inc(labels);
  }

  recordInviteSent(labels: { tenantId: string; role: string }) {
    this.inviteSent.inc(labels);
  }

  recordInviteAccepted(labels: { tenantId: string; role: string }) {
    this.inviteAccepted.inc(labels);
  }

  recordInviteRevoked(labels: { tenantId: string }) {
    this.inviteRevoked.inc(labels);
  }

  recordResetRequested(labels: { tenantId: string }) {
    this.passwordResetRequested.inc(labels);
  }

  recordResetCompleted(labels: { tenantId: string }) {
    this.passwordResetCompleted.inc(labels);
  }

  startTimer(labels: { operation: string }) {
    return this.requestDuration.startTimer(labels);
  }

  observeQueueLatency(labels: { operation: string }, seconds: number) {
    this.queueSummary.observe(labels, seconds);
  }
}
