// Re-export auth module
export { 
  authService,
  // Auth GraphQL queries
  GET_USER_BY_ID,
  UPDATE_USER_PROFILE
} from './auth';
export type { AuthSignupData } from './auth';

// Re-export users module
export { usersService } from './users';
export type { User } from './users';

// Re-export roles module
export { rolesService } from './roles';
export type { Role } from './roles';

// Export GraphQL queries for roles
export {
  GET_ALL_ROLES,
  GET_ROLE_BY_ID,
  GET_ROLES_WITH_ACCESS,
  GET_ROLES_PAGINATED,
  SEARCH_ROLES
} from './roles'; 

export * from './settings';



