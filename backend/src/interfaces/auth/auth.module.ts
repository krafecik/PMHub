import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from '@application/auth/auth.service';
import { AuthStateStore } from '@core/auth/auth-state.store';
import { JwtTokenService } from '@core/auth/jwt-token.service';
import { JwtStrategy } from '@core/auth/jwt.strategy';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@core/auth/guards/roles.guard';
import { TenantGuard } from '@core/auth/guards/tenant.guard';
import { AzureAdProvider } from '@infra/auth';
import { UserRepository } from '@infra/repositories';
import { TenantController } from './tenant.controller';
import { UserManagementController } from './user-management.controller';
import { MailService } from '@infra/email/mail.service';
import { MetricsModule } from '@core/metrics/metrics.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.register({}),
    MetricsModule,
  ],
  controllers: [AuthController, TenantController, UserManagementController],
  providers: [
    AuthService,
    AuthStateStore,
    JwtTokenService,
    JwtStrategy,
    JwtAuthGuard,
    RolesGuard,
    TenantGuard,
    AzureAdProvider,
    UserRepository,
    MailService,
  ],
  exports: [AuthService, JwtAuthGuard, RolesGuard, TenantGuard],
})
export class AuthModule {}
