import { NextRequest, NextResponse } from 'next/server';
import db from '@/app/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // 检查用户是否已存在
    const existingUser = await db.findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 400 });
    }

    // 创建新用户
    const user = await db.createUser(name, email, password);

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
    console.error('Register error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
