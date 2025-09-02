import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: NextRequest) {
  try {
    const { query, variables } = await req.json();
    
    // Validate the request
    if (!query) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    // Get auth token from Authorization header (for client-side calls)
    const authHeader = req.headers.get('authorization');
    const bearerToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;

    // For server-side calls, get the session from cookies
    let token = bearerToken;
    if (!bearerToken) {
      try {
        const supabase = await createClient();
        const { data: { session } } = await supabase.auth.getSession();
        token = session?.access_token;
      } catch (error) {
        console.error('Error getting session from cookies:', error);
      }
    }
    // Execute the GraphQL query using Supabase's REST API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const error = await response.json();
      return NextResponse.json(
        { error: error.message || 'GraphQL query failed' },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({ data: result.data });
  } catch (error: any) {
    console.error('GraphQL API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 