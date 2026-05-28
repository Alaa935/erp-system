import { describe, it, expect, beforeEach, vi } from 'vitest';
import { sessionManager } from '../lib/session';

const mockUser = { id: 1, username: 'admin', role: 'admin' as const, name: 'Admin', password: 'hash' };

beforeEach(() => {
  sessionStorage.clear();
  localStorage.clear();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('sessionManager', () => {
  it('creates and retrieves a session', () => {
    sessionManager.create(mockUser as any);
    const session = sessionManager.get();
    expect(session).not.toBeNull();
    expect(session!.username).toBe('admin');
  });

  it('returns null after expiry', () => {
    sessionManager.create(mockUser as any);
    vi.advanceTimersByTime(12 * 60 * 60 * 1000 + 1);
    expect(sessionManager.get()).toBeNull();
  });

  it('validate returns true for valid session', () => {
    sessionManager.create(mockUser as any);
    expect(sessionManager.validate()).toBe(true);
  });

  it('validate returns false after destroy', () => {
    sessionManager.create(mockUser as any);
    sessionManager.destroy();
    expect(sessionManager.validate()).toBe(false);
  });

  it('getUser returns user from session', () => {
    sessionManager.create(mockUser as any);
    expect(sessionManager.getUser()?.username).toBe('admin');
  });

  it('getUser returns null without session', () => {
    expect(sessionManager.getUser()).toBeNull();
  });

  it('extend refreshes expiry', () => {
    sessionManager.create(mockUser as any);
    vi.advanceTimersByTime(6 * 60 * 60 * 1000);
    sessionManager.extend();
    vi.advanceTimersByTime(7 * 60 * 60 * 1000);
    expect(sessionManager.validate()).toBe(true);
    vi.advanceTimersByTime(6 * 60 * 60 * 1000 + 1);
    expect(sessionManager.validate()).toBe(false);
  });

  it('destroy clears from both storages', () => {
    sessionManager.create(mockUser as any);
    sessionManager.destroy();
    expect(sessionStorage.getItem('wms_session')).toBeNull();
    expect(localStorage.getItem('wms_session')).toBeNull();
  });
});
