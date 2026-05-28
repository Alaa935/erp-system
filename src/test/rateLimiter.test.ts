import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loginRateLimiter } from '../lib/rateLimiter';

beforeEach(() => {
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('loginRateLimiter', () => {
  it('allows first attempt', () => {
    const { allowed, remaining } = loginRateLimiter.canAttempt('testuser');
    expect(allowed).toBe(true);
    expect(remaining).toBe(5);
  });

  it('allows up to 5 attempts', () => {
    for (let i = 0; i < 5; i++) {
      loginRateLimiter.recordAttempt('testuser');
    }
    const { allowed, remaining } = loginRateLimiter.canAttempt('testuser');
    expect(allowed).toBe(false);
    expect(remaining).toBe(0);
  });

  it('resets after lock duration expires', () => {
    for (let i = 0; i < 5; i++) {
      loginRateLimiter.recordAttempt('testuser');
    }
    vi.advanceTimersByTime(30 * 60 * 1000 + 1);
    const { allowed, remaining } = loginRateLimiter.canAttempt('testuser');
    expect(allowed).toBe(true);
    expect(remaining).toBe(5);
  });

  it('returns retryAfterMs when locked', () => {
    for (let i = 0; i < 5; i++) {
      loginRateLimiter.recordAttempt('testuser');
    }
    const { allowed, retryAfterMs } = loginRateLimiter.canAttempt('testuser');
    expect(allowed).toBe(false);
    expect(retryAfterMs).toBeGreaterThan(0);
  });

  it('reset clears attempts', () => {
    for (let i = 0; i < 5; i++) {
      loginRateLimiter.recordAttempt('testuser');
    }
    loginRateLimiter.reset('testuser');
    const { allowed, remaining } = loginRateLimiter.canAttempt('testuser');
    expect(allowed).toBe(true);
    expect(remaining).toBe(5);
  });
});
