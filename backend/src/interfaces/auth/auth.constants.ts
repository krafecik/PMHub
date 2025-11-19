export const REFRESH_TOKEN_COOKIE = 'cpopm_refresh_token';

export const getRefreshCookieOptions = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  path: '/v1/auth',
  maxAge: 7 * 24 * 60 * 60 * 1000,
});
