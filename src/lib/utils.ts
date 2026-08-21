import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat('ar-EG', {
    style: 'currency',
    currency: 'EGP',
  }).format(amount);
}

export function formatDate(timestamp: number | string | Date | null | undefined): string {
  if (!timestamp) return '-';
  let date: Date;
  if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (typeof timestamp === 'string') {
    const num = Number(timestamp);
    if (!isNaN(num) && String(num) === timestamp) {
      date = new Date(num);
    } else {
      date = new Date(timestamp);
    }
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '-';
  }

  if (isNaN(date.getTime())) {
    return '-';
  }

  try {
    return new Intl.DateTimeFormat('ar-EG', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(date);
  } catch {
    return '-';
  }
}

