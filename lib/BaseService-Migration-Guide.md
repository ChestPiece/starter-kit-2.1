# BaseService Migration Guide

## Overview

The BaseService provides a unified, consistent way to interact with your database and external services. It replaces multiple duplicate service files with a single, well-tested service layer.

## Key Benefits

- ✅ **Consistent Error Handling**: Standardized error responses across all services
- ✅ **Unified Client Management**: Single point for managing Supabase clients (client/server/admin)
- ✅ **Built-in Retry Logic**: Automatic retry for transient failures
- ✅ **Type Safety**: Full TypeScript support with proper typing
- ✅ **Request Tracking**: Every request gets a unique ID for debugging
- ✅ **Environment Aware**: Automatically detects and uses appropriate client
- ✅ **No Duplicates**: Eliminated ~8 duplicate service files

## Quick Start

### Basic Usage

```typescript
import { baseService } from "@/lib/BaseService";

// Create a record
const result = await baseService.create("users", {
  email: "user@example.com",
  name: "John Doe",
});

if (result.success) {
  console.log("User created:", result.data);
} else {
  console.error("Error:", result.error.message);
}
```

### Paginated Queries

```typescript
const users = await baseService.paginate("user_profile", {
  page: 1,
  limit: 10,
  search: "john",
  searchFields: ["first_name", "last_name", "email"],
  orderBy: { field: "created_at", ascending: false },
});
```

### Pagination with Search and Sorting

```typescript
const result = await baseService.paginate("user_profile", {
  page: 1,
  limit: 10,
  search: "john",
  searchFields: ["first_name", "last_name", "email"],
  orderBy: { field: "created_at", ascending: false },
});
```

## Migration from Old Services

### Users Service

**Old:**

```typescript
import { usersService } from "@/modules/users/services/users-service";
import { usersService } from "@/modules/users/services/users-service-client";
```

**New:**

```typescript
import { usersServiceUnified } from "@/modules/users";
// or for legacy compatibility:
import { usersService, usersService } from "@/modules/users";
```

### Settings Service

**Old:**

```typescript
import settingsService from "@/modules/settings/services/setting-service";
import settingsServiceClient from "@/modules/settings/services/setting-service-client";
```

**New:**

```typescript
import { settingsServiceUnified } from "@/modules/settings";
// or for legacy compatibility:
import { settingsService, settingsServiceClient } from "@/modules/settings";
```

### Auth Service

**Old:**

```typescript
import { authService } from "@/modules/auth/services/auth-service";
```

**New:**

```typescript
import { authServiceUnified } from "@/modules/auth";
// or for legacy compatibility:
import { authService } from "@/modules/auth";
```

## Error Handling

All BaseService methods return a `ServiceResponse<T>` with consistent structure:

```typescript
interface ServiceResponse<T> {
  success: boolean;
  data?: T;
  error?: ServiceError;
  meta?: {
    count?: number;
    requestId?: string;
  };
}
```

Example error handling:

```typescript
const result = await baseService.readById("users", userId);

if (!result.success) {
  switch (result.error?.code) {
    case "RECORD_NOT_FOUND":
      // Handle not found
      break;
    case "UNAUTHORIZED":
      // Handle auth error
      break;
    default:
    // Handle generic error
  }
  return;
}

// Success - use result.data
```

## Environment Handling

BaseService automatically detects the environment, but you can override:

```typescript
// Use client-side
await baseService.create("users", data, { environment: "client" });

// Use server-side
await baseService.create("users", data, { environment: "server" });

// Use admin (bypasses RLS)
await baseService.create("users", data, { environment: "admin" });
```

## Configuration

You can customize BaseService behavior:

```typescript
import { BaseService } from "@/lib/BaseService";

const customService = BaseService.getInstance({
  enableLogging: true,
  retryAttempts: 5,
  timeout: 60000,
});
```

## Removed Files

The following files have been removed as they're now handled by BaseService:

- `lib/graphql-client.ts` → Removed in favor of direct Supabase calls
- `lib/graphql-server.ts` → Removed in favor of direct Supabase calls
- `hooks/useGraphQL.ts` → Use `baseService` directly for database operations
- `modules/users/services/users-service.ts` → Use `usersServiceUnified`
- `modules/users/services/users-service-client.ts` → Use `usersServiceUnified`
- `modules/settings/services/setting-service.ts` → Use `settingsServiceUnified`
- `modules/settings/services/setting-service-client.ts` → Use `settingsServiceUnified`
- `modules/auth/services/auth-service.ts` → Use `authServiceUnified`

## Backward Compatibility

All existing imports continue to work thanks to compatibility exports in the module index files. You can migrate gradually or all at once.

## Testing

BaseService includes built-in connection testing:

```typescript
const result = await baseService.testConnection();
if (result.success) {
  console.log("Database connection is healthy");
}
```

For any questions or issues, the BaseService is well-documented with TypeScript types and includes comprehensive error handling.
