import { prisma } from '../config/database.js';
import type { Prisma } from '@prisma/client';

export const activityLogsService = {
  async list(params: {
    page?: number;
    pageSize?: number;
    search?: string;
    entity?: string;
    action?: string;
    startDate?: string;
    endDate?: string;
    userId?: number;
  }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;

    const where: Prisma.ActivityLogWhereInput = {};

    if (params.search) {
      where.OR = [
        { action: { contains: params.search, mode: 'insensitive' } },
        { details: { contains: params.search, mode: 'insensitive' } },
        { username: { contains: params.search, mode: 'insensitive' } },
        { entity: { contains: params.search, mode: 'insensitive' } },
      ];
    }
    if (params.entity) where.entity = params.entity;
    if (params.action) where.action = { contains: params.action, mode: 'insensitive' };
    if (params.userId) where.userId = Number(params.userId);
    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) where.timestamp.gte = new Date(params.startDate);
      if (params.endDate) where.timestamp.lte = new Date(params.endDate);
    }

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activityLog.count({ where }),
    ]);

    return {
      logs: logs.map(l => ({
        id: l.id,
        userId: l.userId,
        username: l.username,
        action: l.action,
        entity: l.entity,
        entityId: l.entityId,
        details: l.details,
        timestamp: l.timestamp,
      })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },

  async getById(id: number) {
    const log = await prisma.activityLog.findUnique({ where: { id } });
    if (!log) return null;
    return {
      id: log.id,
      userId: log.userId,
      username: log.username,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details,
      timestamp: log.timestamp,
    };
  },

  async create(data: {
    userId: number;
    username: string;
    action: string;
    entity: string;
    entityId?: string;
    details: string;
  }) {
    const log = await prisma.activityLog.create({
      data: {
        userId: data.userId,
        username: data.username,
        action: data.action,
        entity: data.entity,
        entityId: data.entityId ?? null,
        details: data.details,
        timestamp: new Date(),
      },
    });
    return {
      id: log.id,
      userId: log.userId,
      username: log.username,
      action: log.action,
      entity: log.entity,
      entityId: log.entityId,
      details: log.details,
      timestamp: log.timestamp,
    };
  },

  async getByUser(userId: number, params: { page?: number; pageSize?: number }) {
    return this.list({ ...params, userId });
  },

  async getByEntity(entity: string, entityId: number, params: { page?: number; pageSize?: number }) {
    const page = params.page || 1;
    const pageSize = params.pageSize || 50;

    const [logs, total] = await Promise.all([
      prisma.activityLog.findMany({
        where: { entity, entityId: String(entityId) },
        orderBy: { timestamp: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.activityLog.count({ where: { entity, entityId: String(entityId) } }),
    ]);

    return {
      logs: logs.map(l => ({ id: l.id, userId: l.userId, username: l.username, action: l.action, entity: l.entity, entityId: l.entityId, details: l.details, timestamp: l.timestamp })),
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    };
  },
};
