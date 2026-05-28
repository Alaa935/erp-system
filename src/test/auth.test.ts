import { describe, it, expect } from 'vitest';
import { hashPassword, verifyPassword, isHashed } from '../lib/auth';

describe('auth', () => {
  it('hashPassword produces a hashed string', async () => {
    const hash = await hashPassword('test123');
    expect(hash).toBeTruthy();
    expect(typeof hash).toBe('string');
    expect(hash).not.toBe('test123');
  });

  it('verifyPassword returns true for correct password', async () => {
    const hash = await hashPassword('test123');
    const valid = await verifyPassword('test123', hash);
    expect(valid).toBe(true);
  });

  it('verifyPassword returns false for wrong password', async () => {
    const hash = await hashPassword('test123');
    const valid = await verifyPassword('wrong', hash);
    expect(valid).toBe(false);
  });

  it('isHashed detects bcrypt hashes', () => {
    expect(isHashed('$2a$10$abc')).toBe(true);
    expect(isHashed('$2b$10$abc')).toBe(true);
    expect(isHashed('$2y$10$abc')).toBe(true);
    expect(isHashed('plaintext')).toBe(false);
    expect(isHashed('')).toBe(false);
  });
});
