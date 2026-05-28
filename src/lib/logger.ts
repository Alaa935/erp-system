import { sessionManager } from './session';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export type LogLevel = 'info' | 'warn' | 'error';
export type LogEntity = string;
export type LogAction = string;

interface LogEntry {
  level: LogLevel;
  action: LogAction;
  entity: LogEntity;
  details: string;
  userId?: number | string;
  username?: string;
  error?: string;
}

function getCurrentUser() {
  try {
    const u = sessionManager.getUser();
    if (!u) return { userId: 'system', username: 'النظام' };
    return { userId: u.id ?? u.username, username: u.username };
  } catch {
    return { userId: 'system', username: 'النظام' };
  }
}

function getAccessToken(): string | null {
  try { return localStorage.getItem('wms_access_token'); } catch { return null; }
}

async function writeToApi(entry: LogEntry) {
  try {
    const token = getAccessToken();
    if (!token) return;
    const { userId, username } = getCurrentUser();
    await fetch(`${API_BASE}/api/activity-logs`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        userId: entry.userId || userId,
        username: entry.username || username,
        action: entry.action,
        entity: entry.entity,
        details: entry.details,
      }),
    });
  } catch (e) {
    console.error('[Logger] API write failed:', e);
  }
}

export const logger = {
  async operation(action: string, entity: string, details: string, meta?: { userId?: number | string; username?: string }) {
    const entry: LogEntry = { level: 'info', action, entity, details, ...meta };
    console.log(`[${action}] ${entity}: ${details}`);
    await writeToApi(entry);
  },

  async error(context: string, error: unknown, details?: string) {
    const message = error instanceof Error ? error.message : String(error || '');
    const entry: LogEntry = {
      level: 'error',
      action: `خطأ: ${context}`,
      entity: 'System',
      details: details || message,
      error: message,
    };
    console.error(`[ERROR] ${context}:`, error);
    await writeToApi(entry);
  },

  async backup(action: 'export' | 'import' | 'reset' | 'delete_all', details: string) {
    const labels: Record<string, string> = {
      export: 'نسخ احتياطي: تصدير',
      import: 'نسخ احتياطي: استيراد',
      reset: 'نسخ احتياطي: تصفير عمليات',
      delete_all: 'نسخ احتياطي: تصفير كامل',
    };
    await this.operation(labels[action] || action, 'Backup', details);
  },

  async failedTransaction(context: string, error: unknown, txDetails: string) {
    const message = error instanceof Error ? error.message : String(error || '');
    await this.error(`فشلت المعاملة: ${context}`, error, txDetails);
    console.warn(`[FAILED_TX] ${context}: ${txDetails} — ${message}`);
  },
};
