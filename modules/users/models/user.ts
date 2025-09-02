export interface User {
  id: string;
  email: string;
  roleId?: string;
  role_id?: string; // Database format
  firstName?: string;
  first_name?: string; // Database format
  lastName?: string;
  last_name?: string; // Database format
  isActive?: boolean;
  is_active?: boolean; // Database format
  lastLogin?: string;
  last_login?: string; // Database format
  createdAt?: string;
  created_at?: string; // Database format
  updatedAt?: string;
  updated_at?: string; // Database format
  profile?: string;
  roles?: {
    name: string;
    description?: string;
  };
} 