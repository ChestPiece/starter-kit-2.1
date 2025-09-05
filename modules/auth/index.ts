import { authServiceUnified, authService } from './services/auth-service-unified';
import { emailAuthService } from './services/email-auth-service';

export { 
  authServiceUnified,
  authService,
  emailAuthService,
};

// Re-export types from unified service
export type { AuthSignupData, AuthResponse } from './services/auth-service-unified'; 