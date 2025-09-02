import { authServiceUnified, authService } from './services/auth-service-unified';
import { emailAuthService } from './services/email-auth-service';
import { 
  GET_USER_BY_ID,
  UPDATE_USER_PROFILE,
} from './services/auth-graphql';

export { 
  authServiceUnified,
  authService,
  emailAuthService,
  // Export GraphQL queries and utilities
  GET_USER_BY_ID,
  UPDATE_USER_PROFILE,
};

// Re-export types from unified service
export type { AuthSignupData } from './services/auth-service-unified'; 