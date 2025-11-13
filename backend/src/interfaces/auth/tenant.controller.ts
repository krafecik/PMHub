import { Body, Controller, Get, Post, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { AuthService } from '@application/auth/auth.service';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';
import { AuthSessionResponseDto } from './dto/login-request.dto';
import { SelectTenantDto } from './dto/select-tenant.dto';
import { getRefreshCookieOptions, REFRESH_TOKEN_COOKIE } from './auth.constants';

@Controller('tenants')
@UseGuards(JwtAuthGuard)
export class TenantController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async list(@CurrentUser() user: JwtAccessPayload) {
    return user.tenants;
  }

  @Post('select')
  async select(
    @Body() body: SelectTenantDto,
    @CurrentUser() user: JwtAccessPayload,
    @Res({ passthrough: true }) response: Response
  ): Promise<AuthSessionResponseDto> {
    const session = await this.authService.switchTenant(user, body.tenantId);
    response.cookie(REFRESH_TOKEN_COOKIE, session.tokens.refreshToken, getRefreshCookieOptions());
    return AuthSessionResponseDto.fromDomain(session);
  }
}

