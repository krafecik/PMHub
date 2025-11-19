import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { Response, Request } from 'express';
import { AuthService } from '@application/auth/auth.service';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';
import {
  AuthCallbackQueryDto,
  AuthProviderRequest,
  AuthSessionResponseDto,
  AzureLoginResponseDto,
  LoginRequestDto,
  RefreshTokenRequestDto,
} from './dto/login-request.dto';
import {
  AcceptInviteDto,
  ForgotPasswordDto,
  InviteValidationResponseDto,
  ResetPasswordDto,
} from './dto/user-management.dto';
import { getRefreshCookieOptions, REFRESH_TOKEN_COOKIE } from './auth.constants';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(
    @Body() body: LoginRequestDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto | AzureLoginResponseDto> {
    if (body.provider === AuthProviderRequest.AZURE_AD) {
      return this.authService.initiateAzureLogin();
    }

    if (!body.email || !body.password) {
      throw new BadRequestException('Credenciais locais são obrigatórias.');
    }

    const session = await this.authService.loginLocal(body.email, body.password);

    this.applyRefreshCookie(response, session.tokens.refreshToken);

    return AuthSessionResponseDto.fromDomain(session);
  }

  @Get('callback')
  async azureCallback(
    @Query() query: AuthCallbackQueryDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    const session = await this.authService.handleAzureCallback(query.code, query.state);

    this.applyRefreshCookie(response, session.tokens.refreshToken);

    return AuthSessionResponseDto.fromDomain(session);
  }

  @Post('refresh')
  async refresh(
    @Body() body: RefreshTokenRequestDto,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    const token = (body && body.refreshToken) ?? request.cookies?.[REFRESH_TOKEN_COOKIE];

    if (!token) {
      throw new BadRequestException('Refresh token não informado.');
    }

    const session = await this.authService.refreshSession(token);
    this.applyRefreshCookie(response, session.tokens.refreshToken);

    return AuthSessionResponseDto.fromDomain(session);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @CurrentUser() user: JwtAccessPayload,
    @Res({ passthrough: true }) response: Response,
  ): Promise<{ message: string }> {
    await this.authService.revokeSession(user.sub);
    response.clearCookie(REFRESH_TOKEN_COOKIE, getRefreshCookieOptions());
    return { message: 'Sessão encerrada com sucesso.' };
  }

  @Post('password/forgot')
  async forgotPassword(@Body() body: ForgotPasswordDto): Promise<{ message: string }> {
    await this.authService.requestPasswordReset(body.email);
    return {
      message:
        'Se o e-mail estiver cadastrado enviaremos as instruções de redefinição em instantes.',
    };
  }

  @Post('password/reset')
  async resetPassword(@Body() body: ResetPasswordDto): Promise<{ message: string }> {
    await this.authService.resetPassword(body.token, body.password);
    return { message: 'Senha redefinida com sucesso.' };
  }

  @Get('invite/validate')
  async validateInvite(@Query('token') token?: string): Promise<InviteValidationResponseDto> {
    if (!token) {
      throw new BadRequestException('Token é obrigatório.');
    }

    const validation = await this.authService.validateInviteToken(token);
    return InviteValidationResponseDto.fromDomain(validation);
  }

  @Post('invite/accept')
  async acceptInvite(
    @Body() body: AcceptInviteDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthSessionResponseDto> {
    const session = await this.authService.acceptInvite(body);
    this.applyRefreshCookie(response, session.tokens.refreshToken);
    return AuthSessionResponseDto.fromDomain(session);
  }

  private applyRefreshCookie(response: Response, refreshToken: string) {
    response.cookie(REFRESH_TOKEN_COOKIE, refreshToken, getRefreshCookieOptions());
  }
}
