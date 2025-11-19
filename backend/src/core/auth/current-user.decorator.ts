import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtAccessPayload } from './jwt-token.service';

export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest();
  return request.user as JwtAccessPayload | undefined;
});
