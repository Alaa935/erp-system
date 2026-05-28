import bcrypt from 'bcryptjs';
import jwt, { type SignOptions } from 'jsonwebtoken';
import crypto from 'node:crypto';
import { prisma } from '../config/database.js';
import { env } from '../config/env.js';
import { AppError } from '../middleware/errorHandler.js';
import type { JwtPayload } from '../types/index.js';

function generateAccessToken(payload: JwtPayload): string {
  return jwt.sign(payload as object, env.JWT_SECRET, { expiresIn: env.JWT_EXPIRES_IN } as SignOptions);
}

function generateRefreshToken(): string {
  return crypto.randomBytes(40).toString('hex');
}

export const authService = {
  async login(username: string, password: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new AppError(401, 'Invalid username or password');

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new AppError(401, 'Invalid username or password');

    const payload: JwtPayload = { userId: user.id, username: user.username, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt },
    });

    return {
      user: { id: user.id, username: user.username, role: user.role, repId: user.repId },
      accessToken,
      refreshToken,
    };
  },

  async refresh(refreshToken: string) {
    const stored = await prisma.refreshToken.findUnique({ where: { token: refreshToken } });
    if (!stored) throw new AppError(401, 'Invalid refresh token');
    if (stored.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: stored.id } });
      throw new AppError(401, 'Refresh token expired');
    }

    const user = await prisma.user.findUnique({ where: { id: stored.userId } });
    if (!user) throw new AppError(401, 'User not found');

    await prisma.refreshToken.delete({ where: { id: stored.id } });

    const payload: JwtPayload = { userId: user.id, username: user.username, role: user.role };
    const newAccessToken = generateAccessToken(payload);
    const newRefreshToken = generateRefreshToken();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await prisma.refreshToken.create({
      data: { token: newRefreshToken, userId: user.id, expiresAt },
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  },

  async logout(refreshToken: string) {
    await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
  },

  async register(username: string, password: string, role: 'admin' | 'manager' | 'rep' = 'rep', repId?: number | null, nationalId?: string | null) {
    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) throw new AppError(409, 'Username already exists');

    const hashed = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
    const user = await prisma.user.create({
      data: { username, password: hashed, role, repId: repId ?? undefined, nationalId: nationalId ?? undefined },
    });

    return { id: user.id, username: user.username, role: user.role };
  },

  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new AppError(404, 'User not found');

    const valid = await bcrypt.compare(currentPassword, user.password);
    if (!valid) throw new AppError(400, 'Current password is incorrect');

    const hashed = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });
  },

  async forgotPassword(username: string, nationalId: string, newPassword: string) {
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) throw new AppError(404, 'User not found');
    if (user.nationalId !== nationalId) throw new AppError(400, 'National ID does not match');

    const hashed = await bcrypt.hash(newPassword, env.BCRYPT_SALT_ROUNDS);
    await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });
  },

  async me(userId: number) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, role: true, repId: true, createdAt: true },
    });
    if (!user) throw new AppError(404, 'User not found');
    return user;
  },

  async listUsers() {
    return prisma.user.findMany({
      select: { id: true, username: true, role: true, repId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    });
  },
};
