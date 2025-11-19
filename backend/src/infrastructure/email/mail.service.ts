import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@config/env.config';
import nodemailer, { Transporter } from 'nodemailer';

type InviteMailParams = {
  to: string;
  nome?: string | null;
  tenantNome?: string | null;
  role: string;
  token: string;
  expiresAt: Date;
  mensagem?: string | null;
  isResend?: boolean;
};

type PasswordResetParams = {
  to: string;
  nome?: string | null;
  token: string;
  expiresAt: Date;
};

type SolicitacaoInfoParams = {
  to: string;
  nome?: string | null;
  demandaTitulo: string;
  texto: string;
  prazo?: Date;
};

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: Transporter | null;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {
    const host = this.configService.get('SMTP_HOST', { infer: true });
    const port = this.configService.get('SMTP_PORT', { infer: true }) ?? 0;
    const secure = this.configService.get('SMTP_SECURE', { infer: true }) ?? false;
    const user = this.configService.get('SMTP_USER', { infer: true });
    const pass = this.configService.get('SMTP_PASSWORD', { infer: true });

    this.appUrl = this.configService.get('APP_WEB_URL', { infer: true });
    this.fromAddress =
      this.configService.get('SMTP_FROM', { infer: true }) ?? 'no-reply@cpopm.local';

    if (host && port && user && pass) {
      this.transporter = nodemailer.createTransport({
        host,
        port,
        secure,
        auth: {
          user,
          pass,
        },
      });
    } else {
      this.transporter = null;
      this.logger.warn('SMTP não configurado. E-mails serão registrados em log.');
    }
  }

  async sendInviteEmail(params: InviteMailParams): Promise<void> {
    const subject = params.isResend
      ? 'Convite atualizado para acessar o PM Hub'
      : 'Você foi convidado para o PM Hub';

    const inviteUrl = `${this.appUrl.replace(/\/$/, '')}/register/${encodeURIComponent(
      params.token,
    )}`;
    const expires = params.expiresAt.toLocaleString('pt-BR');
    const tenantNome = params.tenantNome ?? 'seu tenant';

    const textBody = [
      `Olá ${params.nome ?? 'colega'},`,
      '',
      params.isResend
        ? 'Estamos reenviando o convite para você acessar o PM Hub.'
        : 'Você recebeu um convite para acessar o PM Hub.',
      `Tenant: ${tenantNome}`,
      `Perfil: ${params.role}`,
      params.mensagem ? `Mensagem do convidante: ${params.mensagem}` : undefined,
      '',
      `Use o link abaixo para finalizar seu cadastro até ${expires}:`,
      inviteUrl,
      '',
      'Se você não reconhece esta solicitação, ignore este e-mail.',
    ]
      .filter(Boolean)
      .join('\n');

    await this.send({
      to: params.to,
      subject,
      text: textBody,
    });
  }

  async sendInviteRevokedEmail(to: string, tenantNome?: string | null): Promise<void> {
    const textBody = [
      `Olá,`,
      '',
      `O convite para acesso ao tenant ${tenantNome ?? 'informado'} foi revogado.`,
      'Caso tenha dúvidas, entre em contato com o responsável pelo ProductOps.',
    ].join('\n');

    await this.send({
      to,
      subject: 'Convite revogado - PM Hub',
      text: textBody,
    });
  }

  async sendPasswordResetEmail(params: PasswordResetParams): Promise<void> {
    const resetUrl = `${this.appUrl.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(
      params.token,
    )}`;
    const expires = params.expiresAt.toLocaleString('pt-BR');

    const textBody = [
      `Olá ${params.nome ?? ''}`.trim(),
      '',
      'Recebemos uma solicitação para redefinir a sua senha no PM Hub.',
      `Use o link abaixo antes de ${expires}:`,
      resetUrl,
      '',
      'Se você não solicitou a redefinição, pode ignorar este e-mail com segurança.',
    ].join('\n');

    await this.send({
      to: params.to,
      subject: 'Redefinição de senha - PM Hub',
      text: textBody,
    });
  }

  async sendSolicitacaoInfoEmail(params: SolicitacaoInfoParams): Promise<void> {
    const prazoFormatado = params.prazo
      ? params.prazo.toLocaleDateString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
        })
      : null;

    const textBody = [
      `Olá ${params.nome ?? ''}`.trim(),
      '',
      `Precisamos do seu apoio para complementar as informações da demanda "${params.demandaTitulo}".`,
      '',
      'Detalhes solicitados:',
      params.texto,
      '',
      prazoFormatado ? `Prazo sugerido para resposta: ${prazoFormatado}` : undefined,
      '',
      'Assim que possível, responda diretamente pelo PM Hub para darmos sequência na triagem.',
      '',
      'Obrigado!',
    ]
      .filter(Boolean)
      .join('\n');

    await this.send({
      to: params.to,
      subject: `Solicitação de informações adicionais - ${params.demandaTitulo}`,
      text: textBody,
    });
  }

  private async send(options: { to: string; subject: string; text: string }) {
    if (this.transporter) {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to: options.to,
        subject: options.subject,
        text: options.text,
      });
      this.logger.debug(`E-mail enviado para ${options.to} com assunto "${options.subject}"`);
      return;
    }

    this.logger.log(
      [
        '--- E-MAIL (modo log) ---',
        `Para: ${options.to}`,
        `Assunto: ${options.subject}`,
        '',
        options.text,
        '--- FIM E-MAIL ---',
      ].join('\n'),
    );
  }
}
