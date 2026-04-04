import { NextRequest, NextResponse } from 'next/server';
import { unstable_rethrow } from 'next/navigation';
import db from '@/app/lib/db';

export async function GET(request: NextRequest) {
  try {
    // 从 cookie 中获取 session token
    const sessionCookie = request.cookies.get('session');
    if (!sessionCookie) {
      return NextResponse.json({ user: null });
    }
    const sessionToken = sessionCookie.value;

    // 查找 session
    const session = await db.findSessionByToken(sessionToken);
    if (!session) {
      return NextResponse.json({ user: null });
    }

    // 查找用户
    const user = await db.findUserById(session.userId);
    if (!user) {
      return NextResponse.json({ user: null });
    }

    // 返回用户信息
    return NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        currency: user.currency,
      },
    });
  } catch (error) {
    unstable_rethrow(error);
    console.error('Session validation error:', error);
    return NextResponse.json({ user: null });
  }
}
