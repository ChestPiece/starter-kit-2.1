import { usersServiceUnified, usersService, usersServiceClient } from './services/users-service-unified';
import { User } from './models/user';

// Export unified service and legacy compatibility exports
export { usersServiceUnified, usersService, usersServiceClient };
export type { User }; 