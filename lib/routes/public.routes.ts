export const PUBLIC_ROUTES = [
  '/auth/login',
  '/auth/signup',
  '/auth/forgot-password',
  '/auth/verify',

  '/restricted',
  '/_next',
  '/static',
  '/favicon.ico',

] as const;


export const PUBLIC_ROUTES_AUTH = {
  LOGIN: '/auth/login',
  SIGNUP: '/auth/signup',
  FORGOT_PASSWORD: '/auth/forgot-password',
  VERIFY: '/auth/verify',

} as const;