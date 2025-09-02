// GraphQL mutation to insert user into users table
export const INSERT_USER = `
  mutation InsertUser($objects: [user_profileInsertInput!]!) {
    insertIntouser_profileCollection(objects: $objects) {
      affectedCount
      records {
        id
        email
        role_id
        first_name
        last_name
        is_active
        created_at
        profile
      }
    }
  }
`;
export const GET_USERS_PAGINATION = `
query GetUsers($search: String, $limit: Int = 10, $offset: Int = 0) {
  user_profileCollection(
    filter: {
      email: { ilike: $search }
    }
    first: $limit
    offset: $offset
    orderBy: [{ created_at: DescNullsLast }]
  ) {
    edges {
      node {
        id
        email
        role_id
        first_name
        last_name
        is_active
        last_login
        profile
        created_at
        updated_at
        roles {
          name
          description
          role_accessCollection {
            edges {
              node {
                resource
                action
              }
            }
          }
        }
      }
    }
  }
}
`;
export const GET_USERS_COUNT = `
query CountUsers($search: String) {
  user_profileCollection(
    filter: { email: { ilike: $search } }
  ) {
    edges{
      node{
        id
      }
    }
  }
}
`;

export const GET_USERS = `
    query GetUsers {
     user_profileCollection {
       edges {
         node {
           id
           email
           role_id
           first_name
           last_name
           is_active
           last_login
           profile
           created_at
           updated_at
           roles {
             name
             description
             role_accessCollection {
               edges {
                 node {
                   resource
                   action
                 }
               }
             }
           }
         }
       }
     }
   }
   
   `;


export const GET_USERS_BY_ID = `
query GetUsersById($id: UUID!) {
 user_profileCollection(filter: {id: {eq: $id}}) {
   edges {
     node {
       id
       email
       role_id
       first_name
       last_name
       is_active
       last_login
       profile
       created_at
       updated_at
       roles {
         name
         description
         role_accessCollection {
           edges {
             node {
               resource
               action
             }
           }
         }
       }
     }
   }
 }
}
`;

export const UPDATE_USER = `
  mutation UpdateUser(
    $id: UUID!
    $first_name: String
    $last_name: String
    $role_id: UUID!
    $profile: String
    $is_active: Boolean
  ) {
    updateuser_profileCollection(
      filter: { id: { eq: $id } }
      set: {
        first_name: $first_name
        last_name: $last_name
        role_id: $role_id
        profile: $profile
        is_active: $is_active
      }
    ) {
      affectedCount
      records {
        id
        email
        first_name
        last_name
        role_id
        profile
        is_active
      }
    }
  }
`;

export const DELETE_USER = `
mutation deleteUser($id: UUID!) {
  deleteFromuser_profileCollection(filter: {id: {eq: $id}}) {
    affectedCount
  }
}
`;