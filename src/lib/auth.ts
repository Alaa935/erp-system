import bcrypt from 'bcryptjs';

const SALT_ROUNDS = 10;

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function isHashed(password: string): boolean {
  return password.startsWith('$2a$') || password.startsWith('$2b$') || password.startsWith('$2y$');
}

export function isPasswordStrong(password: string): { valid: boolean; message: string } {
  if (!password || password.length < 8) {
    return { valid: false, message: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل' };
  }
  if (password.length > 128) {
    return { valid: false, message: 'كلمة المرور طويلة جداً' };
  }
  if (/^\d+$/.test(password)) {
    return { valid: false, message: 'كلمة المرور لا يمكن أن تكون أرقاماً فقط' };
  }
  if (/^[a-zA-Z]+$/.test(password)) {
    return { valid: false, message: 'كلمة المرور لا يمكن أن تكون حروفاً فقط' };
  }
  if (password.toLowerCase().includes('password') || password.toLowerCase().includes('123456') || password.toLowerCase().includes('qwerty')) {
    return { valid: false, message: 'كلمة المرور ضعيفة جداً، اختر كلمة مرور أقوى' };
  }
  return { valid: true, message: '' };
}

export function validateLoginInput(username: string, password: string): { valid: boolean; error: string } {
  if (!username || !username.trim()) {
    return { valid: false, error: 'اسم المستخدم مطلوب' };
  }
  if (username.trim().length < 3) {
    return { valid: false, error: 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل' };
  }
  if (username.trim().length > 50) {
    return { valid: false, error: 'اسم المستخدم طويل جداً' };
  }
  if (!/^[a-zA-Z0-9_\u0600-\u06FF\s]+$/.test(username.trim())) {
    return { valid: false, error: 'اسم المستخدم يحتوي على أحرف غير مسموح بها' };
  }
  if (!password || !password.trim()) {
    return { valid: false, error: 'كلمة المرور مطلوبة' };
  }
  return { valid: true, error: '' };
}

export function validateCredentials(username: string, password: string): { valid: boolean; error: string } {
  const loginCheck = validateLoginInput(username, password);
  if (!loginCheck.valid) return loginCheck;
  const pwCheck = isPasswordStrong(password);
  if (!pwCheck.valid) {
    return { valid: false, error: pwCheck.message };
  }
  return { valid: true, error: '' };
}

export async function authenticateUser(user: { id?: number; password?: string }, password: string): Promise<{ success: boolean; error?: string }> {
  if (!user.password) {
    return { success: false, error: 'الحساب لا يحتوي على كلمة مرور' };
  }
  let valid = false;
  if (isHashed(user.password)) {
    valid = await verifyPassword(password.trim(), user.password);
  } else {
    valid = user.password === password.trim();
  }
  return { success: valid, error: valid ? undefined : 'اسم المستخدم أو كلمة المرور غير صحيحة' };
}
