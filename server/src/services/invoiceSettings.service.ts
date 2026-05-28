import { prisma } from '../config/database.js';

export const invoiceSettingsService = {
  async getInvoiceSettings() {
    let settings = await prisma.invoiceSettings.findUnique({ where: { id: 'default' } });
    if (!settings) {
      settings = await prisma.invoiceSettings.create({
        data: { id: 'default', companyName: '', managedBy: '' },
      });
    }
    return settings;
  },

  async upsertInvoiceSettings(data: {
    companyName: string;
    managedBy: string;
    phone?: string | null;
    address?: string | null;
  }) {
    const settings = await prisma.invoiceSettings.upsert({
      where: { id: 'default' },
      create: { id: 'default', ...data },
      update: data,
    });
    return settings;
  },
};
