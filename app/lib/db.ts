import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  balance: number;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Session {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  createdAt: Date;
}

type StorageType = 'memory' | 'neon';

interface UserRow {
  id: string;
  name: string;
  email: string;
  password: string;
  balance: string | number;
  currency: string;
  created_at: string | Date;
  updated_at: string | Date;
}

interface SessionRow {
  id: string;
  token: string;
  user_id: string;
  expires_at: string | Date;
  created_at: string | Date;
}

declare global {
  var __memoryAuthStore:
    | {
        users: User[];
        sessions: Session[];
      }
    | undefined;
  var __neonAuthSchemaReady: Promise<void> | undefined;
}

const storageType: StorageType = (process.env.STORAGE_TYPE as StorageType) || 'neon';

function generateId(): string {
  return crypto.randomUUID();
}

function mapUser(row: UserRow): User {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    password: row.password,
    balance: Number(row.balance),
    currency: row.currency,
    createdAt: new Date(row.created_at),
    updatedAt: new Date(row.updated_at),
  };
}

function mapSession(row: SessionRow): Session {
  return {
    id: row.id,
    token: row.token,
    userId: row.user_id,
    expiresAt: new Date(row.expires_at),
    createdAt: new Date(row.created_at),
  };
}

class MemoryStorage {
  private store =
    globalThis.__memoryAuthStore ??
    (globalThis.__memoryAuthStore = {
      users: [],
      sessions: [],
    });

  async findUserByEmail(email: string): Promise<User | null> {
    return this.store.users.find(user => user.email === email) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.store.users.find(user => user.id === id) || null;
  }

  async createUser(name: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: generateId(),
      name,
      email,
      password: hashedPassword,
      balance: 0,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.store.users.push(user);
    return user;
  }

  async incrementUserBalance(id: string, amount: number): Promise<User | null> {
    const user = this.store.users.find(existingUser => existingUser.id === id);
    if (!user) return null;

    user.balance += amount;
    user.updatedAt = new Date();
    return user;
  }

  async createSession(userId: string): Promise<Session> {
    const session: Session = {
      id: generateId(),
      token: generateId(),
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };
    this.store.sessions.push(session);
    return session;
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const session = this.store.sessions.find(existingSession => existingSession.token === token);
    if (!session) return null;
    if (session.expiresAt < new Date()) return null;
    return session;
  }

  async cleanupExpiredSessions() {
    const now = new Date();
    this.store.sessions = this.store.sessions.filter(session => session.expiresAt > now);
  }
}

class NeonStorage {
  private sql;
  private schemaReady: Promise<void>;

  constructor() {
    const databaseUrl = process.env.DATABASE_URL;

    if (!databaseUrl) {
      throw new Error('Neon DATABASE_URL not configured');
    }

    this.sql = neon(databaseUrl, {
      fetchOptions: {
        cache: 'no-store',
      },
    });
    this.schemaReady =
      globalThis.__neonAuthSchemaReady ?? (globalThis.__neonAuthSchemaReady = this.initialize());
  }

  private async initialize() {
    await this.sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        balance NUMERIC(18, 2) NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await this.sql`
      CREATE TABLE IF NOT EXISTS sessions (
        id TEXT PRIMARY KEY,
        token TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        expires_at TIMESTAMPTZ NOT NULL,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `;

    await this.sql`
      CREATE INDEX IF NOT EXISTS sessions_token_idx ON sessions (token)
    `;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    await this.schemaReady;
    const rows = (await this.sql`
      SELECT id, name, email, password, balance, currency, created_at, updated_at
      FROM users
      WHERE email = ${email}
      LIMIT 1
    `) as UserRow[];

    return rows[0] ? mapUser(rows[0]) : null;
  }

  async findUserById(id: string): Promise<User | null> {
    await this.schemaReady;
    const rows = (await this.sql`
      SELECT id, name, email, password, balance, currency, created_at, updated_at
      FROM users
      WHERE id = ${id}
      LIMIT 1
    `) as UserRow[];

    return rows[0] ? mapUser(rows[0]) : null;
  }

  async createUser(name: string, email: string, password: string): Promise<User> {
    await this.schemaReady;
    const hashedPassword = await bcrypt.hash(password, 10);
    const id = generateId();

    const rows = (await this.sql`
      INSERT INTO users (id, name, email, password, balance, currency, created_at, updated_at)
      VALUES (${id}, ${name}, ${email}, ${hashedPassword}, ${0}, ${'USD'}, NOW(), NOW())
      RETURNING id, name, email, password, balance, currency, created_at, updated_at
    `) as UserRow[];

    return mapUser(rows[0]);
  }

  async incrementUserBalance(id: string, amount: number): Promise<User | null> {
    await this.schemaReady;
    const rows = (await this.sql`
      UPDATE users
      SET balance = balance + ${amount}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING id, name, email, password, balance, currency, created_at, updated_at
    `) as UserRow[];

    return rows[0] ? mapUser(rows[0]) : null;
  }

  async createSession(userId: string): Promise<Session> {
    await this.schemaReady;
    const id = generateId();
    const token = generateId();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const rows = (await this.sql`
      INSERT INTO sessions (id, token, user_id, expires_at, created_at)
      VALUES (${id}, ${token}, ${userId}, ${expiresAt.toISOString()}, NOW())
      RETURNING id, token, user_id, expires_at, created_at
    `) as SessionRow[];

    return mapSession(rows[0]);
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    await this.schemaReady;
    const rows = (await this.sql`
      SELECT id, token, user_id, expires_at, created_at
      FROM sessions
      WHERE token = ${token}
        AND expires_at > NOW()
      LIMIT 1
    `) as SessionRow[];

    return rows[0] ? mapSession(rows[0]) : null;
  }

  async cleanupExpiredSessions() {
    await this.schemaReady;
    await this.sql`
      DELETE FROM sessions
      WHERE expires_at <= NOW()
    `;
  }
}

let storage: MemoryStorage | NeonStorage;

try {
  switch (storageType) {
    case 'memory':
      storage = new MemoryStorage();
      console.log('Using memory storage');
      break;
    case 'neon':
    default:
      storage = new NeonStorage();
      console.log('Using Neon storage');
      break;
  }
} catch (error) {
  console.error('Failed to initialize storage, falling back to memory:', error);
  storage = new MemoryStorage();
}

const db = {
  findUserByEmail: storage.findUserByEmail.bind(storage),
  findUserById: storage.findUserById.bind(storage),
  createUser: storage.createUser.bind(storage),
  incrementUserBalance: storage.incrementUserBalance.bind(storage),
  verifyPassword: async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return bcrypt.compare(plainPassword, hashedPassword);
  },
  createSession: storage.createSession.bind(storage),
  findSessionByToken: storage.findSessionByToken.bind(storage),
  cleanupExpiredSessions: storage.cleanupExpiredSessions.bind(storage),
};

export default db;
