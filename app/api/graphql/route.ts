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
    // Execute the GraphQL query using Supabase's GraphQL API
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!supabaseUrl) {
      return NextResponse.json(
        { error: 'Supabase URL not configured' },
        { status: 500 }
      );
    }

    const response = await fetch(`${supabaseUrl}/graphql/v1`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      const responseText = await response.text();
      let errorMessage = 'GraphQL query failed';
      
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorMessage;
      } catch {
        // If response is not JSON (e.g., HTML error page), provide a better error message
        if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
          errorMessage = 'GraphQL endpoint returned HTML instead of JSON. Check Supabase configuration.';
        } else {
          errorMessage = `GraphQL API error: ${responseText.substring(0, 200)}`;
        }
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const responseText = await response.text();
    try {
      const result = JSON.parse(responseText);
      return NextResponse.json({ data: result.data });
    } catch (parseError) {
      // If response is not valid JSON
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html')) {
        return NextResponse.json(
          { error: 'GraphQL endpoint returned HTML instead of JSON. Check if GraphQL is enabled in Supabase.' },
          { status: 500 }
        );
      }
      return NextResponse.json(
        { error: 'Invalid JSON response from GraphQL endpoint' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('GraphQL API Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 