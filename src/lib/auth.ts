import { SignJWT, jwtVerify, type JWTPayload } from 'jose';
import { cookies } from 'next/headers';
import { NextRequest } from 'next/server';

// Ensure you have a strong secret in production
const SECRET_KEY = process.env.JWT_SECRET || 'super_secret_fallback_key_for_development_only_123!';
const key = new TextEncoder().encode(SECRET_KEY);

export interface SessionPayload extends JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function encrypt(payload: SessionPayload) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('24h') // 24 hour session
    .sign(key);
}

export async function decrypt(token: string | undefined = '') {
  try {
    if (!token) return null;
    const { payload } = await jwtVerify(token, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    return null;
  }
}

export async function createSession(payload: SessionPayload) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);
  const session = await encrypt(payload);

  const cookieStore = await cookies();
  
  cookieStore.set('session', session, {
    expires,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
  });
}

export async function verifySession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  const session = await decrypt(sessionCookie);

  if (!session?.userId) {
    return null;
  }

  return { isAuth: true, userId: session.userId, email: session.email, role: session.role };
}

export async function deleteSession() {
  const cookieStore = await cookies();
  cookieStore.delete('session');
}

export async function updateSession(request: NextRequest) {
  const session = request.cookies.get('session')?.value;
  if (!session) return null;

  // Verify the session
  const parsed = await decrypt(session);
  if (!parsed) return null;

  // Refresh expiration
  parsed.exp = Math.floor(Date.now() / 1000) + 24 * 60 * 60;
  
  const res = new Response();
  res.headers.append(
    'Set-Cookie',
    `session=${await encrypt(parsed as SessionPayload)}; Path=/; HttpOnly; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}; Max-Age=${24 * 60 * 60}`
  );
  return res;
}
