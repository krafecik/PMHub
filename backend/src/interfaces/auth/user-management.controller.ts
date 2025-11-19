import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from '@application/auth/auth.service';
import { JwtAuthGuard } from '@core/auth/guards/jwt-auth.guard';
import { TenantGuard } from '@core/auth/guards/tenant.guard';
import { Roles } from '@core/auth/roles.decorator';
import { TenantRole } from '@prisma/client';
import { CurrentUser } from '@core/auth/current-user.decorator';
import { JwtAccessPayload } from '@core/auth/jwt-token.service';
import {
  InviteSummaryResponseDto,
  InviteUserDto,
  UpdateUserRoleDto,
  UserSummaryResponseDto,
} from './dto/user-management.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UserManagementController {
  constructor(private readonly authService: AuthService) {}

  @Get()
  async listUsers(@Req() request: Request): Promise<UserSummaryResponseDto[]> {
    const tenantId = this.extractTenantId(request);
    const users = await this.authService.listUsers(tenantId);
    return users.map(UserSummaryResponseDto.fromDomain);
  }

  @Get('invites')
  @Roles(TenantRole.CPO)
  async listInvites(@Req() request: Request): Promise<InviteSummaryResponseDto[]> {
    const tenantId = this.extractTenantId(request);
    const invites = await this.authService.listInvites(tenantId);
    return invites.map(InviteSummaryResponseDto.fromDomain);
  }

  @Post('invites')
  @Roles(TenantRole.CPO)
  async inviteUser(
    @Req() request: Request,
    @CurrentUser() currentUser: JwtAccessPayload,
    @Body() dto: InviteUserDto,
  ): Promise<InviteSummaryResponseDto> {
    const tenantId = this.extractTenantId(request);
    const invite = await this.authService.inviteUser({
      email: dto.email,
      nome: dto.nome,
      mensagem: dto.mensagem,
      tenantId,
      role: dto.role,
      invitedBy: currentUser,
    });
    return InviteSummaryResponseDto.fromDomain(invite);
  }

  @Post('invites/:inviteId/resend')
  @Roles(TenantRole.CPO)
  async resendInvite(
    @Req() request: Request,
    @CurrentUser() currentUser: JwtAccessPayload,
    @Param('inviteId') inviteId: string,
  ): Promise<InviteSummaryResponseDto> {
    const tenantId = this.extractTenantId(request);
    const invite = await this.authService.resendInvite(inviteId, tenantId, currentUser);
    return InviteSummaryResponseDto.fromDomain(invite);
  }

  @Delete('invites/:inviteId')
  @Roles(TenantRole.CPO)
  async revokeInvite(@Req() request: Request, @Param('inviteId') inviteId: string): Promise<void> {
    const tenantId = this.extractTenantId(request);
    await this.authService.revokeInvite(inviteId, tenantId);
  }

  @Patch(':userId/role')
  @Roles(TenantRole.CPO)
  async updateRole(
    @Body() dto: UpdateUserRoleDto,
    @Param('userId') userId: string,
    @Req() request: Request,
  ): Promise<void> {
    const tenantId = dto.tenantId ?? this.extractTenantId(request);
    await this.authService.updateUserRole({
      userId,
      tenantId,
      role: dto.role,
    });
  }

  @Post(':userId/unlock')
  @Roles(TenantRole.CPO)
  async unlockUser(@Param('userId') userId: string): Promise<void> {
    await this.authService.unlockUser(userId);
  }

  private extractTenantId(request: Request): string {
    return request.tenantId ?? request.headers['x-tenant-id']?.toString() ?? '';
  }
}
