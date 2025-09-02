import { NextRequest, NextResponse } from 'next/server';
import { authService, AuthSignupData } from '@/modules/auth/services/auth-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, password } = body;
    if (!token || !password) {
      return NextResponse.json(
        { error: 'Password is required' },
        { status: 400 }
      );
    }
    
    // Call the signup service
    const data = await authService.acceptInvite(token, password );
    return NextResponse.json(
      { message: 'User accepted invite successfully' },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Signup error:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to accept invite' },
      { status: 500 }
    );
  }
} 