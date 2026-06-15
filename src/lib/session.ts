import type { UserAccount } from '../types';

interface SessionData {
  userId: number;
  username: string;
  role: 'admin' | 'manager' | 'rep';
  loginTimestamp: number;
  expiresAt: number;
  sessionId: string;
  integrityHash: string;
}

const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;
const SESSION_KEY = 'wms_session';
const INTEGRITY_KEY = 'wms_session_integrity';

function generateSessionId(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

function generateIntegritySecret(): string {
  const arr = new Uint8Array(32);
  crypto.getRandomValues(arr);
  return Array.from(arr, b => b.toString(16).padStart(2, '0')).join('');
}

function computeIntegrityHash(userId: number, role: string, loginTimestamp: number, secret: string): string {
  const data = `${userId}|${role}|${loginTimestamp}|${secret}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0;
  }
  return hash.toString(36);
}

function saveToStorage(key: string, data: string): boolean {
  try {
    sessionStorage.setItem(key, data);
    return true;
  } catch {
    try {
      localStorage.setItem(key, data);
      return true;
    } catch {
      return false;
    }
  }
}

function readFromStorage(key: string): string | null {
  try {
    return sessionStorage.getItem(key) || localStorage.getItem(key);
  } catch {
    return null;
  }
}

function removeFromStorage(key: string): void {
  try { sessionStorage.removeItem(key); } catch { }
  try { localStorage.removeItem(key); } catch { }
}

export const sessionManager = {
  create(user: UserAccount): void {
    const now = Date.now();
    const sessionId = generateSessionId();
    const integritySecret = generateIntegritySecret();
    const integrityHash = computeIntegrityHash(user.id!, user.role, now, integritySecret);

    const session: SessionData = {
      userId: user.id!,
      username: user.username,
      role: user.role,
      loginTimestamp: now,
      expiresAt: now + SESSION_DURATION_MS,
      sessionId,
      integrityHash,
    };

    saveToStorage(SESSION_KEY, JSON.stringify(session));
    saveToStorage(INTEGRITY_KEY, integritySecret);
  },

  get(): SessionData | null {
    try {
      const raw = readFromStorage(SESSION_KEY);
      if (!raw) return null;

      const session: SessionData = JSON.parse(raw);

      if (Date.now() > session.expiresAt) {
        this.destroy();
        return null;
      }

      const secret = readFromStorage(INTEGRITY_KEY);
      if (!secret) {
        this.destroy();
        return null;
      }

      const expectedHash = computeIntegrityHash(session.userId, session.role, session.loginTimestamp, secret);
      if (session.integrityHash !== expectedHash) {
        this.destroy();
        return null;
      }

      return session;
    } catch {
      this.destroy();
      return null;
    }
  },

  getUser(): UserAccount | null {
    const session = this.get();
    if (!session) return null;
    return {
      id: session.userId,
      username: session.username,
      role: session.role,
    } as UserAccount;
  },

  async validateWithDb(): Promise<boolean> {
    const token = (() => { try { return localStorage.getItem('wms_access_token'); } catch { return null; } })();
    if (!token) return false;
    try {
      const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const res = await fetch(`${API_BASE}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: AbortSignal.timeout(10_000),
      });
      const json = await res.json();
      return !!(json.success && json.data);
    } catch {
      return false;
    }
  },

  validate(): boolean {
    return this.get() !== null;
  },

  destroy(): void {
    removeFromStorage(SESSION_KEY);
    removeFromStorage(INTEGRITY_KEY);
  },

  extend(): void {
    const raw = readFromStorage(SESSION_KEY);
    if (!raw) return;
    try {
      const session: SessionData = JSON.parse(raw);
      session.expiresAt = Date.now() + SESSION_DURATION_MS;
      const secret = readFromStorage(INTEGRITY_KEY);
      if (secret) {
        session.integrityHash = computeIntegrityHash(session.userId, session.role, session.loginTimestamp, secret);
      }
      saveToStorage(SESSION_KEY, JSON.stringify(session));
    } catch {
      this.destroy();
    }
  },
};
