import db from "@/app/lib/db";

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  currency: string;
}

export async function getCurrentUserFromToken(
  sessionToken?: string | null
): Promise<AuthUser | null> {
  if (!sessionToken) {
    return null;
  }

  const session = await db.findSessionByToken(sessionToken);
  if (!session) {
    return null;
  }

  const user = await db.findUserById(session.userId);
  if (!user) {
    return null;
  }

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    balance: user.balance,
    currency: user.currency,
  };
}
