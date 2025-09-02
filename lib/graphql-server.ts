export async function executeGraphQLBackend<T = any>(query: string, variables?: Record<string, any>) {
  try {
    // Get the base URL - handle both development and production
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                   (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
    
    const response = await fetch(`${baseUrl}/api/graphql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    if (result.error) {
      throw new Error(result.error);
    }

    return result.data as T;
  } catch (error) {
    // Only log in development mode to avoid console spam
    if (process.env.NODE_ENV === 'development') {
      console.error('GraphQL Error:', error);
    }
    throw error;
  }
} 