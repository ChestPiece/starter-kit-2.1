import { Role } from "../models/role";

// GraphQL query for fetching all roles
export const GET_ALL_ROLES = `
 query GetAllRoles {
  rolesCollection {
    edges {
      node {
        id
        name
        description
        created_at
        updated_at
      }
    }
  }
}
`;

// GraphQL query for fetching a specific role by ID
export const GET_ROLE_BY_ID = `
  query GetRoleById($id: UUID!) {
    roles_by_pk(id: $id) {
      id
      name
      description
      created_at
      updated_at
    }
  }
`;

// GraphQL query for fetching roles with access permissions
export const GET_ROLES_WITH_ACCESS = `
  query GetRolesWithAccess {
    roles {
      id
      name
      description
      role_access {
        id
        resource
        action
      }
    }
  }
`;

// GraphQL query for fetching roles with pagination
export const GET_ROLES_PAGINATED = `
  query GetRolesPaginated($limit: Int!, $offset: Int!) {
    roles(limit: $limit, offset: $offset, order_by: {name: asc}) {
      id
      name
      description
      created_at
      updated_at
    }
    roles_aggregate {
      aggregate {
        count
      }
    }
  }
`;

// GraphQL query for searching roles by name
export const SEARCH_ROLES = `
  query SearchRoles($searchTerm: String!) {
    roles(where: {name: {_ilike: $searchTerm}}) {
      id
      name
      description
      created_at
      updated_at
    }
  }
`;

// GraphQL query to fetch user role by name
export const GET_ROLE_BY_NAME = `
 query GetRoleByName($name: String!) {
  rolesCollection(filter: { name: { eq: $name } }) {
    edges {
      node {
        id
        name
      }
    }
  }
}
`;
