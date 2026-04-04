import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // 查找用户
    const user = await db.findUserByEmail(email);
    if (!user) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 验证密码
    const passwordMatch = await db.verifyPassword(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
    }

    // 生成 session token
    const session = await db.createSession(user.id);

    // 创建响应并设置 cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        balance: user.balance,
        currency: user.currency,
      },
    });

    // 设置 cookie
    response.cookies.set('session', session.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
