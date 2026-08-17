import { NextResponse } from 'next/server';
import { runQuery, controlConnectionString } from '@/lib/db';
import { createSession } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ error: 'Email and password are required' }, { status: 400 });
    }

    const connStr = controlConnectionString();
    
    // Find user
    const userRes = await runQuery(
      connStr,
      `SELECT id, email, password_hash, role FROM platform_users WHERE email = $1`,
      [email]
    );

    if (userRes.rows.length === 0) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    const user = userRes.rows[0];

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // Create secure session
    await createSession({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    return NextResponse.json({ success: true, message: 'Logged in successfully' });
  } catch (error: any) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
