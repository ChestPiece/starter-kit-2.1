import { useAuth } from '@/context/AuthContext';
import { executeGraphQL } from '@/lib/graphql-client';
import { createClient } from '@/lib/supabase/client';

export function useGraphQL() {
  const { user } = useAuth();

  const query = async <T = any>(query: string, variables?: Record<string, any>) => {
    try {
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();
      const data = await executeGraphQL<T>(query, variables, session?.access_token);
      return data;
    } catch (error) {
      console.error('GraphQL Query Error:', error);
      throw error;
    }
  };

  return { query };
} 