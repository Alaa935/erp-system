import { prisma } from '../config/database.js';
import { AppError } from '../middleware/errorHandler.js';
import Decimal from 'decimal.js';

export const systemConfigService = {
  async getConfig() {
    let config = await prisma.systemConfig.findUnique({ where: { id: 'default' } });
    if (!config) {
      config = await prisma.systemConfig.create({ data: { id: 'default' } });
    }
    return {
      ...config,
      vatRate: Number(config.vatRate),
      defaultDiscount: Number(config.defaultDiscount),
    };
  },

  async updateConfig(data: Record<string, any>) {
    const updateData: Record<string, any> = {};
    const allowedFields = [
      'companyName', 'logo', 'stamp', 'phone', 'email', 'taxId', 'crNumber',
      'address', 'currency', 'language', 'invoicePrefix', 'invoiceNextNumber',
      'qrCodeEnabled', 'paperSize', 'theme', 'fontSize', 'layout',
      'whatsappNotifications', 'emailNotifications', 'lowStockAlerts',
      'minStockLevel', 'trackingSystem', 'primaryColor',
    ];

    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (field === 'vatRate' || field === 'defaultDiscount') {
          updateData[field] = new Decimal(data[field]);
        } else {
          updateData[field] = data[field];
        }
      }
    }

    const config = await prisma.systemConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...updateData },
      update: updateData,
    });

    return { ...config, vatRate: Number(config.vatRate), defaultDiscount: Number(config.defaultDiscount) };
  },
};
