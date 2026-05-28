export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequired(value: unknown, fieldName: string): void {
  if (value === undefined || value === null || value === '') {
    throw new ValidationError(`حقل ${fieldName} مطلوب`);
  }
}

export function validatePositiveNumber(value: unknown, fieldName: string): void {
  if (typeof value !== 'number' || value < 0 || isNaN(value)) {
    throw new ValidationError(`حقل ${fieldName} يجب أن يكون رقماً موجباً`);
  }
}

export function validateNonEmptyArray<T>(arr: T[], fieldName: string): void {
  if (!Array.isArray(arr) || arr.length === 0) {
    throw new ValidationError(`يجب إضافة ${fieldName} على الأقل`);
  }
}

export function validateEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function validatePhone(value: string): boolean {
  return /^[\d\+\-\(\)\s]{7,20}$/.test(value);
}
