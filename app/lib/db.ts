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

// 存储类型
type StorageType = 'memory' | 'vercel' | 'cloudflare';

// 获取存储类型
const storageType: StorageType = (process.env.STORAGE_TYPE as StorageType) || 'memory';

// 生成唯一 ID
function generateId(): string {
  return Math.random().toString(36).substring(2) + Math.random().toString(36).substring(2);
}

// 内存存储实现
class MemoryStorage {
  private users: User[] = [];
  private sessions: Session[] = [];

  async findUserByEmail(email: string): Promise<User | null> {
    return this.users.find(user => user.email === email) || null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async createUser(name: string, email: string, password: string): Promise<User> {
    const hashedPassword = await bcrypt.hash(password, 10);
    const user: User = {
      id: generateId(),
      name,
      email,
      password: hashedPassword,
      balance: 0.00,
      currency: 'USD',
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(user);
    return user;
  }

  async createSession(userId: string): Promise<Session> {
    const session: Session = {
      id: generateId(),
      token: generateId(),
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时过期
      createdAt: new Date(),
    };
    this.sessions.push(session);
    return session;
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    const session = this.sessions.find(s => s.token === token);
    if (!session) return null;
    if (session.expiresAt < new Date()) return null;
    return session;
  }

  async cleanupExpiredSessions() {
    const now = new Date();
    const validSessions = this.sessions.filter(s => s.expiresAt > now);
    this.sessions.length = 0;
    this.sessions.push(...validSessions);
  }
}

// Vercel 存储实现（使用 Edge Config）
class VercelStorage {
  private edgeConfig: any;

  constructor() {
    try {
      // 尝试导入 Vercel Edge Config
      this.edgeConfig = require('@vercel/edge-config');
    } catch (error) {
      console.error('Vercel Edge Config not available:', error);
      throw new Error('Vercel Edge Config not configured');
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const users = await this.edgeConfig.get('users') || [];
      return users.find((user: User) => user.email === email) || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      const users = await this.edgeConfig.get('users') || [];
      return users.find((user: User) => user.id === id) || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  async createUser(name: string, email: string, password: string): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user: User = {
        id: generateId(),
        name,
        email,
        password: hashedPassword,
        balance: 0.00,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const users = await this.edgeConfig.get('users') || [];
      users.push(user);
      await this.edgeConfig.set('users', users);

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createSession(userId: string): Promise<Session> {
    try {
      const session: Session = {
        id: generateId(),
        token: generateId(),
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时过期
        createdAt: new Date(),
      };

      const sessions = await this.edgeConfig.get('sessions') || [];
      sessions.push(session);
      await this.edgeConfig.set('sessions', sessions);

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    try {
      const sessions = await this.edgeConfig.get('sessions') || [];
      const session = sessions.find((s: Session) => s.token === token);
      if (!session) return null;
      if (new Date(session.expiresAt) < new Date()) return null;
      return session;
    } catch (error) {
      console.error('Error finding session by token:', error);
      return null;
    }
  }

  async cleanupExpiredSessions() {
    try {
      const sessions = await this.edgeConfig.get('sessions') || [];
      const now = new Date();
      const validSessions = sessions.filter((s: Session) => new Date(s.expiresAt) > now);
      await this.edgeConfig.set('sessions', validSessions);
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}

// Cloudflare 存储实现
class CloudflareStorage {
  private kv: any;

  constructor() {
    try {
      // 尝试获取 Cloudflare KV
      // 注意：在 Cloudflare Workers 环境中，KV 命名空间会通过环境变量或绑定提供
      // 这里假设 KV 命名空间名为 'MY_KV_NAMESPACE'
      this.kv = (globalThis as any).MY_KV_NAMESPACE;
      if (!this.kv) {
        throw new Error('Cloudflare KV namespace not available');
      }
    } catch (error) {
      console.error('Cloudflare KV not available:', error);
      throw new Error('Cloudflare KV not configured');
    }
  }

  async findUserByEmail(email: string): Promise<User | null> {
    try {
      const usersJson = await this.kv.get('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      return users.find((user: User) => user.email === email) || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  async findUserById(id: string): Promise<User | null> {
    try {
      const usersJson = await this.kv.get('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      return users.find((user: User) => user.id === id) || null;
    } catch (error) {
      console.error('Error finding user by id:', error);
      return null;
    }
  }

  async createUser(name: string, email: string, password: string): Promise<User> {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const user: User = {
        id: generateId(),
        name,
        email,
        password: hashedPassword,
        balance: 0.00,
        currency: 'USD',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const usersJson = await this.kv.get('users');
      const users = usersJson ? JSON.parse(usersJson) : [];
      users.push(user);
      await this.kv.put('users', JSON.stringify(users));

      return user;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  }

  async createSession(userId: string): Promise<Session> {
    try {
      const session: Session = {
        id: generateId(),
        token: generateId(),
        userId,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24小时过期
        createdAt: new Date(),
      };

      const sessionsJson = await this.kv.get('sessions');
      const sessions = sessionsJson ? JSON.parse(sessionsJson) : [];
      sessions.push(session);
      await this.kv.put('sessions', JSON.stringify(sessions));

      return session;
    } catch (error) {
      console.error('Error creating session:', error);
      throw error;
    }
  }

  async findSessionByToken(token: string): Promise<Session | null> {
    try {
      const sessionsJson = await this.kv.get('sessions');
      const sessions = sessionsJson ? JSON.parse(sessionsJson) : [];
      const session = sessions.find((s: Session) => s.token === token);
      if (!session) return null;
      if (new Date(session.expiresAt) < new Date()) return null;
      return session;
    } catch (error) {
      console.error('Error finding session by token:', error);
      return null;
    }
  }

  async cleanupExpiredSessions() {
    try {
      const sessionsJson = await this.kv.get('sessions');
      const sessions = sessionsJson ? JSON.parse(sessionsJson) : [];
      const now = new Date();
      const validSessions = sessions.filter((s: Session) => new Date(s.expiresAt) > now);
      await this.kv.put('sessions', JSON.stringify(validSessions));
    } catch (error) {
      console.error('Error cleaning up expired sessions:', error);
    }
  }
}

// 初始化存储
let storage: MemoryStorage | VercelStorage | CloudflareStorage;

try {
  switch (storageType) {
    case 'vercel':
      storage = new VercelStorage();
      console.log('Using Vercel storage');
      break;
    case 'cloudflare':
      storage = new CloudflareStorage();
      console.log('Using Cloudflare storage');
      break;
    case 'memory':
    default:
      storage = new MemoryStorage();
      console.log('Using memory storage');
      break;
  }
} catch (error) {
  console.error('Failed to initialize storage, falling back to memory:', error);
  storage = new MemoryStorage();
}

// 导出函数
const db = {
  findUserByEmail: storage.findUserByEmail.bind(storage),
  findUserById: storage.findUserById.bind(storage),
  createUser: storage.createUser.bind(storage),
  verifyPassword: async (plainPassword: string, hashedPassword: string): Promise<boolean> => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
  createSession: storage.createSession.bind(storage),
  findSessionByToken: storage.findSessionByToken.bind(storage),
  cleanupExpiredSessions: storage.cleanupExpiredSessions.bind(storage),
};

export default db;
