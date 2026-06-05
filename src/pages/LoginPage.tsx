import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Warehouse, Lock, User, AlertCircle, Loader2, KeyRound, Fingerprint, ShieldAlert, CheckCircle2, Clock } from 'lucide-react';
import { isPasswordStrong, validateLoginInput } from '../lib/auth';
import { forgotPasswordRateLimiter } from '../lib/rateLimiter';
import { Modal, Form, FormInput, FormActions } from '../components/design-system';
import { api, setTokens } from '../lib/api-client';

interface UserAccount {
  id: number;
  username: string;
  role: 'admin' | 'manager' | 'rep';
  repId?: number;
}

interface LoginPageProps {
  onLogin: (user: UserAccount) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [fpUsername, setFpUsername] = useState('');
  const [fpNationalId, setFpNationalId] = useState('');
  const [fpNewPassword, setFpNewPassword] = useState('');
  const [fpConfirmPassword, setFpConfirmPassword] = useState('');
  const [fpError, setFpError] = useState('');
  const [fpSuccess, setFpSuccess] = useState(false);
  const [fpLoading, setFpLoading] = useState(false);
  const [fpCooldown, setFpCooldown] = useState(0);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const cleanUsername = username.trim().toLowerCase();

      const inputCheck = validateLoginInput(username, password);
      if (!inputCheck.valid) {
        setError(inputCheck.error);
        setIsLoading(false);
        return;
      }

      const result = await api<{
        user: { id: number; username: string; role: 'admin' | 'manager' | 'rep'; repId?: number | null };
        accessToken: string;
        refreshToken: string;
      }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username: cleanUsername, password }),
      });

      console.log('[LOGINPAGE] Before setTokens', { at: result.accessToken?.slice(0, 20) + '...', rt: result.refreshToken?.slice(0, 20) + '...' });
      setTokens(result.accessToken, result.refreshToken);
      console.log('[LOGINPAGE] After setTokens, localStorage has access_token:', !!localStorage.getItem('wms_access_token'), 'refresh_token:', !!localStorage.getItem('wms_refresh_token'));

      const userAccount: UserAccount = {
        id: result.user.id,
        username: result.user.username,
        role: result.user.role,
        repId: result.user.repId ?? undefined,
      };

      setTimeout(() => {
        onLogin(userAccount);
        setIsLoading(false);
      }, 800);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'فشل تسجيل الدخول';
      setError(message);
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setFpError('');
    setFpLoading(true);
    setFpSuccess(false);

    const cleanUsername = fpUsername.trim().toLowerCase();
    if (!cleanUsername) {
      setFpError('اسم المستخدم مطلوب');
      setFpLoading(false);
      return;
    }

    const fpCheck = forgotPasswordRateLimiter.canAttempt(cleanUsername);
    if (!fpCheck.allowed) {
      const minutes = Math.ceil(fpCheck.retryAfterMs / 60000);
      setFpCooldown(fpCheck.retryAfterMs);
      setFpError(`تم تجاوز عدد المحاولات المسموح به. حاول مرة أخرى بعد ${minutes} دقيقة`);
      setFpLoading(false);
      return;
    }

    const cleanedNationalId = fpNationalId.trim();
    if (!/^\d{14}$/.test(cleanedNationalId)) {
      setFpError('الرقم القومي غير صحيح (يجب أن يكون 14 رقماً)');
      setFpLoading(false);
      return;
    }

    if (!fpNewPassword) {
      setFpError('كلمة المرور الجديدة مطلوبة');
      setFpLoading(false);
      return;
    }

    const pwCheck = isPasswordStrong(fpNewPassword);
    if (!pwCheck.valid) {
      setFpError(pwCheck.message);
      setFpLoading(false);
      return;
    }

    if (fpNewPassword !== fpConfirmPassword) {
      setFpError('كلمة المرور غير متطابقة');
      setFpLoading(false);
      return;
    }

    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({
          username: cleanUsername,
          nationalId: cleanedNationalId,
          newPassword: fpNewPassword,
        }),
      });

      forgotPasswordRateLimiter.reset(cleanUsername);
      setFpSuccess(true);
      setTimeout(() => {
        setShowForgotPassword(false);
        setFpUsername('');
        setFpNationalId('');
        setFpNewPassword('');
        setFpConfirmPassword('');
        setFpError('');
        setFpSuccess(false);
        setFpCooldown(0);
      }, 2000);
    } catch {
      forgotPasswordRateLimiter.recordAttempt(cleanUsername);
      setFpError('حدث خطأ، حاول مرة أخرى');
    } finally {
      setFpLoading(false);
    }
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setFpUsername('');
    setFpNationalId('');
    setFpNewPassword('');
    setFpConfirmPassword('');
    setFpError('');
    setFpSuccess(false);
    setFpLoading(false);
    setFpCooldown(0);
  };

  return (
    <div className="min-h-screen bg-[#F7F9FB] flex items-center justify-center p-6 font-tajawal rtl">
      <div className="w-full max-w-md">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-3xl p-8 shadow-xl border border-gray-100 space-y-8"
        >
          <div className="text-center space-y-4">
            <div className="w-20 h-20 bg-black text-white rounded-2xl flex items-center justify-center mx-auto shadow-lg rotate-3 transition-transform hover:rotate-0">
              <Warehouse className="w-10 h-10" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-black">تسجيل الدخول</h1>
              <p className="text-[#44474D] text-sm mt-1">المخازن المصرية المتحدة - نظام الإدارة</p>
            </div>
          </div>

          <Form onSubmit={handleLogin} autoFocusFirst={false}>
            <FormInput
              label="اسم المستخدم"
              icon={<User className="w-5 h-5" />}
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              autoFocus
            />

            <div>
              <FormInput
                label="كلمة المرور"
                type="password"
                icon={<Lock className="w-5 h-5" />}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                onClick={() => setShowForgotPassword(true)}
                className="text-xs font-bold text-gray-500 hover:text-black transition-colors mt-1 mr-1"
              >
                هل نسيت كلمة المرور؟
              </button>
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm border border-red-100"
              >
                <AlertCircle className="w-5 h-5 shrink-0" />
                <p className="font-bold">{error}</p>
              </motion.div>
            )}

            <button 
              disabled={isLoading}
              className="w-full bg-black text-white py-4 rounded-2xl font-black text-lg shadow-lg hover:shadow-black/20 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-3"
            >
              {isLoading ? (
                <Loader2 className="w-6 h-6 animate-spin" />
              ) : (
                'دخول للنظام'
              )}
            </button>
          </Form>
        </motion.div>
      </div>

      {/* Forgot Password Modal */}
      <Modal
        open={showForgotPassword}
        onClose={closeForgotPassword}
        size="md"
      >
        {!fpSuccess ? (
          <>
            <div className="text-center space-y-3 mb-8">
              <div className="w-16 h-16 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
                <KeyRound className="w-8 h-8" />
              </div>
              <h2 className="text-2xl font-black text-black">استعادة كلمة المرور</h2>
              <p className="text-sm text-[#44474D] font-bold">أدخل بياناتك لتغيير كلمة المرور</p>
            </div>

            {fpCooldown > 0 && (
              <div className="bg-yellow-50 text-yellow-700 p-3 rounded-xl flex items-center gap-2 text-xs font-bold mb-4 border border-yellow-200">
                <Clock className="w-4 h-4 shrink-0" />
                <span>يرجى الانتظار قبل المحاولة مرة أخرى</span>
              </div>
            )}

            <Form onSubmit={handleResetPassword}>
              <FormInput
                label="اسم المستخدم"
                icon={<User className="w-5 h-5" />}
                value={fpUsername}
                onChange={e => setFpUsername(e.target.value)}
                required
              />

              <FormInput
                label="الرقم القومي"
                icon={<Fingerprint className="w-5 h-5" />}
                value={fpNationalId}
                onChange={e => setFpNationalId(e.target.value.replace(/\D/g, '').slice(0, 14))}
                required
                inputMode="numeric"
                maxLength={14}
                placeholder="14 رقم"
              />

              <div className="border-t border-gray-100 pt-5 space-y-5">
                <h3 className="text-sm font-black text-black">كلمة المرور الجديدة</h3>

                <FormInput
                  label="كلمة المرور الجديدة"
                  type="password"
                  icon={<Lock className="w-5 h-5" />}
                  value={fpNewPassword}
                  onChange={e => setFpNewPassword(e.target.value)}
                  required
                  placeholder="أقل 8 أحرف"
                />

                <FormInput
                  label="تأكيد كلمة المرور"
                  type="password"
                  icon={<ShieldAlert className="w-5 h-5" />}
                  value={fpConfirmPassword}
                  onChange={e => setFpConfirmPassword(e.target.value)}
                  required
                  placeholder="أعد كتابة كلمة المرور"
                />
              </div>

              {fpError && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-red-50 text-red-600 p-4 rounded-xl flex items-center gap-3 text-sm border border-red-100"
                >
                  <AlertCircle className="w-5 h-5 shrink-0" />
                  <p className="font-bold">{fpError}</p>
                </motion.div>
              )}

              <FormActions
                primaryLabel="تغيير كلمة المرور"
                secondaryLabel="تراجع"
                onSecondary={closeForgotPassword}
                loading={fpLoading}
              />
            </Form>
          </>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-8 space-y-4"
          >
            <div className="w-20 h-20 bg-green-50 text-green-600 rounded-full flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-black text-black">تم تغيير كلمة المرور بنجاح</h2>
            <p className="text-sm text-[#44474D] font-bold">يمكنك الآن تسجيل الدخول باستخدام كلمة المرور الجديدة</p>
          </motion.div>
        )}
      </Modal>
    </div>
  );
}
