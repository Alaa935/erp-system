const MAX_ATTEMPTS = 5;
const COOLDOWN_MS = 15 * 60 * 1000;
const LOCK_DURATION_MS = 30 * 60 * 1000;

const FP_MAX_ATTEMPTS = 3;
const FP_COOLDOWN_MS = 15 * 60 * 1000;
const FP_LOCK_DURATION_MS = 60 * 60 * 1000;

interface AttemptRecord {
  count: number;
  firstAttempt: number;
  lockedUntil: number | null;
}

function getKey(identifier: string, prefix: string): AttemptRecord {
  try {
    const raw = localStorage.getItem(`${prefix}_${identifier}`);
    if (raw) return JSON.parse(raw);
  } catch { }
  return { count: 0, firstAttempt: 0, lockedUntil: null };
}

function saveKey(identifier: string, prefix: string, data: AttemptRecord): void {
  try {
    localStorage.setItem(`${prefix}_${identifier}`, JSON.stringify(data));
  } catch { }
}

function recordAttempt(identifier: string, prefix: string, maxAttempts: number, lockDuration: number, cooldown: number): AttemptRecord {
  const now = Date.now();
  const record = getKey(identifier, prefix);

  if (record.lockedUntil && now < record.lockedUntil) {
    return record;
  }

  if (record.lockedUntil && now >= record.lockedUntil) {
    record.count = 0;
    record.firstAttempt = 0;
    record.lockedUntil = null;
  }

  if (record.count === 0) {
    record.firstAttempt = now;
  }

  record.count += 1;

  const windowElapsed = now - record.firstAttempt > cooldown;
  if (windowElapsed) {
    record.count = 1;
    record.firstAttempt = now;
  }

  if (record.count >= maxAttempts) {
    record.lockedUntil = now + lockDuration;
  }

  saveKey(identifier, prefix, record);
  return record;
}

function canAttempt(identifier: string, prefix: string, maxAttempts: number, lockDuration: number, cooldown: number): { allowed: boolean; remaining: number; retryAfterMs: number } {
  const record = getKey(identifier, prefix);
  const now = Date.now();

  if (record.lockedUntil && now < record.lockedUntil) {
    return { allowed: false, remaining: 0, retryAfterMs: record.lockedUntil - now };
  }

  if (record.lockedUntil && now >= record.lockedUntil) {
    record.count = 0;
    record.firstAttempt = 0;
    record.lockedUntil = null;
    saveKey(identifier, prefix, record);
  }

  const windowElapsed = now - record.firstAttempt > cooldown;
  const effectiveCount = windowElapsed ? 0 : record.count;

  return {
    allowed: effectiveCount < maxAttempts,
    remaining: Math.max(0, maxAttempts - effectiveCount),
    retryAfterMs: effectiveCount >= maxAttempts ? lockDuration - (now - record.firstAttempt) : 0,
  };
}

function reset(identifier: string, prefix: string): void {
  try {
    localStorage.removeItem(`${prefix}_${identifier}`);
  } catch { }
}

export const loginRateLimiter = {
  getKey(identifier: string): AttemptRecord {
    return getKey(identifier, 'login_attempts');
  },
  saveKey(identifier: string, data: AttemptRecord): void {
    saveKey(identifier, 'login_attempts', data);
  },
  recordAttempt(identifier: string): AttemptRecord {
    return recordAttempt(identifier, 'login_attempts', MAX_ATTEMPTS, LOCK_DURATION_MS, COOLDOWN_MS);
  },
  canAttempt(identifier: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    return canAttempt(identifier, 'login_attempts', MAX_ATTEMPTS, LOCK_DURATION_MS, COOLDOWN_MS);
  },
  reset(identifier: string): void {
    reset(identifier, 'login_attempts');
  },
};

export const forgotPasswordRateLimiter = {
  getKey(identifier: string): AttemptRecord {
    return getKey(identifier, 'fp_attempts');
  },
  recordAttempt(identifier: string): AttemptRecord {
    return recordAttempt(identifier, 'fp_attempts', FP_MAX_ATTEMPTS, FP_LOCK_DURATION_MS, FP_COOLDOWN_MS);
  },
  canAttempt(identifier: string): { allowed: boolean; remaining: number; retryAfterMs: number } {
    return canAttempt(identifier, 'fp_attempts', FP_MAX_ATTEMPTS, FP_LOCK_DURATION_MS, FP_COOLDOWN_MS);
  },
  reset(identifier: string): void {
    reset(identifier, 'fp_attempts');
  },
};
