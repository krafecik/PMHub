import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EnvConfig } from '@config/env.config';
import { Issuer, Client, TokenSet } from 'openid-client';

type AuthorizationParams = {
  state: string;
  codeChallenge: string;
};

type TokenExchangeParams = {
  code: string;
  codeVerifier: string;
};

@Injectable()
export class AzureAdProvider {
  private clientPromise?: Promise<Client>;

  constructor(private readonly configService: ConfigService<EnvConfig, true>) {}

  private async getClient(): Promise<Client> {
    if (!this.clientPromise) {
      const tenantId = this.configService.get('AZURE_AD_TENANT_ID', { infer: true });
      const clientId = this.configService.get('AZURE_AD_CLIENT_ID', { infer: true });
      const clientSecret = this.configService.get('AZURE_AD_CLIENT_SECRET', { infer: true });
      const redirectUri = this.configService.get('AZURE_AD_REDIRECT_URI', { infer: true });

      if (!tenantId || !clientId || !clientSecret || !redirectUri) {
        throw new Error('Variáveis de ambiente do Azure AD não configuradas.');
      }

      const issuer = await Issuer.discover(
        `https://login.microsoftonline.com/${tenantId}/v2.0`
      );

      this.clientPromise = Promise.resolve(
        new issuer.Client({
          client_id: clientId,
          client_secret: clientSecret,
          redirect_uris: [redirectUri],
          response_types: ['code']
        })
      );
    }

    return this.clientPromise;
  }

  async generateAuthorizationUrl(params: AuthorizationParams): Promise<string> {
    const client = await this.getClient();
    const redirectUri = this.configService.get('AZURE_AD_REDIRECT_URI', { infer: true });

    if (!redirectUri) {
      throw new Error('Variáveis de ambiente do Azure AD não configuradas.');
    }

    return client.authorizationUrl({
      scope: 'openid profile email offline_access',
      state: params.state,
      code_challenge: params.codeChallenge,
      code_challenge_method: 'S256',
      redirect_uri: redirectUri,
      response_type: 'code',
      prompt: 'select_account'
    });
  }

  async exchangeCodeForTokens(params: TokenExchangeParams): Promise<TokenSet> {
    const client = await this.getClient();
    const redirectUri = this.configService.get('AZURE_AD_REDIRECT_URI', { infer: true });

    if (!redirectUri) {
      throw new Error('Variáveis de ambiente do Azure AD não configuradas.');
    }

    return client.callback(
      redirectUri,
      {
        code: params.code
      },
      {
        code_verifier: params.codeVerifier
      }
    );
  }
}

