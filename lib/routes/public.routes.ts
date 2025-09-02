export const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify',
  '/auth/accept-invite/:token',
  '/restricted',
  '/_next',
  '/static',
  '/favicon.ico',
  '/auth/accept-invite'
] as const;


export const PUBLIC_ROUTES_AUTH = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY: '/auth/verify',
  ACCEPT_INVITE: '/auth/accept-invite/:token',
} as const;