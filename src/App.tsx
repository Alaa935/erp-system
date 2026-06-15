import React, { useState, Suspense, lazy, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Toaster } from 'sonner';
import { ErrorBoundary } from './components/ErrorBoundary';
import { GlobalLoader, ContentLoader } from './components/ui/Loading';
import {
  LayoutDashboard, Package, Users, ShoppingCart, BarChart3, Warehouse, Calculator,
  ArrowRightLeft, ClipboardList, Lock, Activity, Receipt, Boxes, Store, Cloud, Palette, Building2, Bell
, User
} from 'lucide-react';
import { canAccessPage, getDefaultPage } from './lib/permissions';
import { sessionManager } from './lib/session';
import { Sidebar, type MenuItem } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NotificationPanel } from './components/layout/NotificationPanel';
import { QuickActions } from './components/layout/QuickActions';
import { getAccessToken, clearTokens, api, setTokens } from './lib/api-client';
import { useNotifications, useUnreadNotifications, useMarkAllNotificationsRead } from './hooks/useNotifications';
import type { UserAccount } from './types';
import type { AppNotification } from './types';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Inventory = lazy(() => import('./pages/Inventory'));
const Suppliers = lazy(() => import('./pages/Suppliers'));
const Customers = lazy(() => import('./pages/Customers'));
const SupplierInvoices = lazy(() => import('./pages/SupplierInvoices'));
const SalesOrders = lazy(() => import('./pages/SalesOrders'));
const Reports = lazy(() => import('./pages/Reports'));
const Warehouses = lazy(() => import('./pages/Warehouses'));
const SettingsPage = lazy(() => import('./pages/Settings'));
const SalesRepManagement = lazy(() => import('./pages/SalesRepManagement'));
const SalesRepPortal = lazy(() => import('./pages/SalesRepPortal'));
const Accounting = lazy(() => import('./pages/Accounting'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const TaxManagement = lazy(() => import('./pages/TaxManagement'));
const InvoiceVerificationPage = lazy(() => import('./pages/InvoiceVerificationPage'));
const Profile = lazy(() => import('./pages/Profile'));
const SupplierInvoiceCreate = lazy(() => import('./pages/SupplierInvoiceCreate'));

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const PAGE_STORAGE_KEY = 'wms_active_page';

function getSavedPage(): string | null {
  try { return localStorage.getItem(PAGE_STORAGE_KEY); } catch { return null; }
}

function savePage(page: string): void {
  try { localStorage.setItem(PAGE_STORAGE_KEY, page); } catch {}
}

export default function App() {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [activePage, setActivePage] = useState(() => getSavedPage() || 'dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isNotificationsOpen, setNotificationsOpen] = useState(false);
  const [isQuickActionsOpen, setQuickActionsOpen] = useState(false);

  const [invoiceVerificationNumber, setInvoiceVerificationNumber] = useState<string | null>(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/invoice/')) {
      return decodeURIComponent(hash.replace('#/invoice/', ''));
    }
    return null;
  });

  const { data: notificationsData } = useNotifications(50);
  const { data: unreadData } = useUnreadNotifications();
  const markAllReadMutation = useMarkAllNotificationsRead();

  const rawNotifications = notificationsData as any[] | undefined;
  const notifications: AppNotification[] | undefined = rawNotifications?.map((n: any) => ({
    id: n.id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.read,
    date: typeof n.date === 'number' ? n.date : new Date(n.date).getTime(),
  }));
  const unreadCount = (unreadData as any)?.unreadCount ?? notifications?.filter(n => !n.read).length ?? 0;

  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    if (currentUser) savePage(activePage);
  }, [activePage, currentUser]);

  const handleUserUpdate = useCallback((user: UserAccount) => {
    setCurrentUser(user);
  }, []);

  const handleLogout = useCallback(() => {
    console.log('[APP handleLogout] called', { ts: Date.now() });
    const refreshToken = localStorage.getItem('wms_refresh_token');
    if (refreshToken) {
      fetch(`${API_BASE}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
        signal: AbortSignal.timeout(5_000),
      }).catch(() => {});
    }
    clearTokens();
    sessionManager.destroy();
    setCurrentUser(null);
    setActivePage('dashboard');
  }, []);

  useEffect(() => {
    const onHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/invoice/')) {
        setInvoiceVerificationNumber(decodeURIComponent(hash.replace('#/invoice/', '')));
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const initEffectRan = React.useRef(false);
  useEffect(() => {
    if (initEffectRan.current) {
      console.log('[APP INIT] StrictMode double-invoke DETECTED — skipping second init');
      return;
    }
    initEffectRan.current = true;

    const SAFETY_TIMEOUT_MS = 30_000;
    let safetyHandle: ReturnType<typeof setTimeout> | undefined;

    const init = async () => {
      console.log('[APP INIT] === EFFECT STARTED ===', { ts: Date.now() });
      safetyHandle = setTimeout(() => {
        console.log('[APP INIT] ⚠ SAFETY TIMEOUT — forcing setIsInitializing(false) after 30s');
        setIsInitializing(false);
      }, SAFETY_TIMEOUT_MS);

      let sessionRestored = false;

      console.log('[APP INIT] Step 1: getAccessToken');
      const token = getAccessToken();
      console.log('[APP INIT]   hasToken:', !!token);

      if (token) {
        console.log('[APP INIT] Step 2: await api(/auth/me) — START');
        try {
          const userData = await api<{ id: number; username: string; role: 'admin' | 'manager' | 'rep'; repId?: number | null }>('/auth/me');
          console.log('[APP INIT] Step 2: await api(/auth/me) — DONE');
          const user: UserAccount = {
            id: userData.id,
            username: userData.username,
            role: userData.role,
            repId: userData.repId ?? undefined,
          };
          setCurrentUser(user);
          sessionManager.create(user);
          sessionRestored = true;
        } catch (e) {
          console.log('[APP INIT] Step 2: await api(/auth/me) — FAILED', e);
          clearTokens();
        }
      } else {
        console.log('[APP INIT] Step 2: skipped (no token)');
      }

      if (!sessionRestored) {
        console.log('[APP INIT] Step 3: checking refresh token');
        const refreshToken = localStorage.getItem('wms_refresh_token');
        console.log('[APP INIT]   hasRefreshToken:', !!refreshToken);
        if (refreshToken) {
          console.log('[APP INIT] Step 3a: await fetch(/auth/refresh) — START');
          try {
            const refreshRes = await fetch(`${API_BASE}/api/auth/refresh`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ refreshToken }),
              signal: AbortSignal.timeout(15_000),
            });
            console.log('[APP INIT] Step 3a: await fetch(/auth/refresh) — DONE, status:', refreshRes.status);
            const refreshJson = await refreshRes.json();
            console.log('[APP INIT]   refreshJson.success:', refreshJson?.success, 'hasData:', !!refreshJson?.data);
            if (refreshJson.success && refreshJson.data) {
              setTokens(refreshJson.data.accessToken, refreshJson.data.refreshToken);
              console.log('[APP INIT] Step 3b: await api(/auth/me) after refresh — START');
              const userData = await api<{ id: number; username: string; role: 'admin' | 'manager' | 'rep'; repId?: number | null }>('/auth/me');
              console.log('[APP INIT] Step 3b: await api(/auth/me) after refresh — DONE');
              const user: UserAccount = {
                id: userData.id,
                username: userData.username,
                role: userData.role,
                repId: userData.repId ?? undefined,
              };
              setCurrentUser(user);
              sessionManager.create(user);
              sessionRestored = true;
            }
          } catch (e) {
            console.log('[APP INIT] Step 3a/3b: refresh flow FAILED', e);
            clearTokens();
          }
        } else {
          console.log('[APP INIT] Step 3: skipped (no refresh token)');
        }
      }

      if (!sessionRestored) {
        console.log('[APP INIT] Step 4: session not restored — will show login page');
      }

      if (safetyHandle) clearTimeout(safetyHandle);
      console.log('[APP INIT] === EFFECT COMPLETE === sessionRestored:', sessionRestored, { ts: Date.now() });
      setTimeout(() => {
        console.log('[APP INIT] calling setIsInitializing(false)');
        setIsInitializing(false);
      }, 800);
    };
    console.log('[APP INIT] Calling init()');
    init();
  }, []);

  // Log when the component mounts
  console.log('[APP] Component rendered, currentUser:', !!currentUser, 'isInitializing:', isInitializing);

  const closeVerification = useCallback(() => {
    setInvoiceVerificationNumber(null);
    window.location.hash = '';
  }, []);

  const menuItems: MenuItem[] = [
    { id: 'tax-management', label: 'إدارة الضرائب', icon: Receipt, roles: ['admin'] },
    { id: 'dashboard', label: 'لوحة القيادة', icon: LayoutDashboard, roles: ['manager'] },
    { id: 'supplier-invoices', label: 'فواتير الموردين', icon: ShoppingCart, roles: ['manager'] },
    { id: 'inventory', label: 'الأصناف والمخزون', icon: Package, roles: ['manager'] },
    { id: 'sales-rep-management', label: 'إدارة المناديب', icon: Users, roles: ['manager'] },
    { id: 'suppliers', label: 'إدارة الموردين', icon: Users, roles: ['manager'] },
    { id: 'customers', label: 'إدارة العملاء', icon: User, roles: ['manager'] },
    { id: 'reports', label: 'التقارير والإحصائيات', icon: BarChart3, roles: ['manager'] },
    { id: 'accounting', label: 'الحسابات والمالية', icon: Calculator, roles: ['manager'] },
    { id: 'general', label: 'إعدادات الشركة', icon: Building2, roles: ['admin'] },
    { id: 'security', label: 'الأمان والخصوصية', icon: Lock, roles: ['admin'] },
    { id: 'activity', label: 'سجل النشاطات', icon: Activity, roles: ['admin'] },
    { id: 'employees', label: 'الموظفين والصلاحيات', icon: Users, roles: ['admin'] },
    { id: 'invoices', label: 'الفواتير والطباعة', icon: Receipt, roles: ['admin'] },
    { id: 'inventory-settings', label: 'إعدادات المخزون', icon: Boxes, roles: ['admin'] },
    { id: 'branches', label: 'إدارة الفروع', icon: Store, roles: ['admin'] },
    { id: 'backup', label: 'النسخ الاحتياطي', icon: Cloud, roles: ['admin'] },
    { id: 'notifications-settings', label: 'الإشعارات', icon: Bell, roles: ['admin'] },
    { id: 'appearance', label: 'المظهر والواجهة', icon: Palette, roles: ['admin'] },
    { id: 'rep-dashboard', label: 'لوحة التحكم', icon: LayoutDashboard, roles: ['rep'] },
    { id: 'rep-overview', label: 'نظرة عامة على العمليات', icon: ClipboardList, roles: ['rep'] },
    { id: 'rep-inventory', label: 'العهدة (المخزون)', icon: Package, roles: ['rep'] },
    { id: 'rep-customers', label: 'عملائي', icon: Users, roles: ['rep'] },
    { id: 'rep-sales', label: 'عمليات البيع', icon: ShoppingCart, roles: ['rep'] },
    { id: 'rep-requests', label: 'طلبات التوريد', icon: ArrowRightLeft, roles: ['rep'] },
  ].filter(item => item.roles.includes(currentUser?.role || ''));

  const handleLogin = (user: UserAccount) => {
    console.log('[APP handleLogin] called', { user, ts: Date.now(), accessToken: !!localStorage.getItem('wms_access_token'), refreshToken: !!localStorage.getItem('wms_refresh_token') });
    sessionManager.create(user);
    setCurrentUser(user);
    const saved = getSavedPage();
    if (saved && canAccessPage(saved, user)) {
      setActivePage(saved);
    } else {
      setActivePage(getDefaultPage(user));
    }
  };

  const handleNavigate = (page: string) => {
    if (canAccessPage(page, currentUser)) {
      setActivePage(page);
    }
  };

  const markAllAsRead = async () => {
    try {
      await markAllReadMutation.mutateAsync();
    } catch { console.error('markAllRead failed'); }
  };

  React.useEffect(() => {
    const handleResize = () => {
      setSidebarOpen(window.innerWidth >= 1024);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleMenuToggle = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen(true);
    } else {
      setSidebarOpen(!isSidebarOpen);
    }
  };

  const renderPage = () => {
    if (!currentUser) return null;
    if (!canAccessPage(activePage, currentUser)) {
      const target = getDefaultPage(currentUser);
      if (target !== activePage) setTimeout(() => setActivePage(target), 0);
      return <ContentLoader />;
    }
    return (
      <Suspense fallback={<ContentLoader />}>
        {(() => {
          if (activePage.startsWith('rep-')) return <SalesRepPortal currentUser={currentUser} activeTab={activePage.replace('rep-', '') as any} />;
          switch (activePage) {
            case 'dashboard': return <Dashboard setActivePage={setActivePage} />;
            case 'inventory': return <Inventory setActivePage={setActivePage} />;
            case 'suppliers': return <Suppliers />;
            case 'customers': return <Customers />;
            case 'supplier-invoices': return <SupplierInvoices onNavigate={handleNavigate} />;
            case 'supplier-invoice-create': return <SupplierInvoiceCreate onNavigate={handleNavigate} />;
            case 'sales-orders': return <SalesOrders />;
            case 'reports': return <Reports setActivePage={setActivePage} />;
            case 'warehouses': return <Warehouses setActivePage={setActivePage} />;
            case 'accounting': return <Accounting />;
            case 'tax-management': return <TaxManagement />;
            case 'general': case 'security': case 'activity': case 'employees':
            case 'invoices': case 'branches': case 'backup': case 'appearance':
              return <SettingsPage activeTab={activePage as any} />;
            case 'inventory-settings': return <SettingsPage activeTab='inventory' />;
            case 'notifications-settings': return <SettingsPage activeTab='notifications' />;
            case 'settings': return <SettingsPage />;
            case 'profile': return <Profile currentUser={currentUser} onNavigate={handleNavigate} onLogout={handleLogout} onUserUpdate={handleUserUpdate} />;
            case 'sales-rep-management': return <SalesRepManagement />;
            case 'sales-rep-portal': return <SalesRepPortal currentUser={currentUser} />;
            default:
              if (currentUser?.role === 'rep') return <SalesRepPortal currentUser={currentUser} activeTab='overview' />;
              if (currentUser?.role === 'admin') return <SettingsPage activeTab='general' />;
              return <Dashboard setActivePage={setActivePage} />;
          }
        })()}
      </Suspense>
    );
  };

  if (invoiceVerificationNumber) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<GlobalLoader />}>
          <InvoiceVerificationPage invoiceNumber={invoiceVerificationNumber} onClose={closeVerification} />
        </Suspense>
      </ErrorBoundary>
    );
  }

  if (isInitializing) return <GlobalLoader />;

  if (!currentUser) {
    return (
      <ErrorBoundary>
        <Suspense fallback={<GlobalLoader />}>
          <LoginPage onLogin={handleLogin} />
          <Toaster position='top-center' dir='rtl' expand={false} richColors />
        </Suspense>
      </ErrorBoundary>
    );
  }

  return (
    <ErrorBoundary>
      <div className='min-h-screen bg-gradient-to-br from-[#F7F9FB] via-white to-[#F0F4F8] flex overflow-hidden font-tajawal rtl'>
        <Toaster position='top-center' dir='rtl' expand={false} richColors />
        <Sidebar
          menuItems={menuItems}
          activePage={activePage}
          onNavigate={handleNavigate}
          isSidebarOpen={isSidebarOpen}
          isMobileMenuOpen={isMobileMenuOpen}
          onMobileClose={() => setMobileMenuOpen(false)}
        />
        <main className='flex-1 flex flex-col relative overflow-hidden min-w-0'>
          <Header
            currentUser={currentUser}
            unreadCount={unreadCount}
            onMenuToggle={handleMenuToggle}
            onNotificationsToggle={() => {
              setNotificationsOpen(!isNotificationsOpen);
              if (!isNotificationsOpen) markAllAsRead();
            }}
            onLogout={handleLogout}
            onNavigate={handleNavigate}
          />
          <NotificationPanel
            isOpen={isNotificationsOpen}
            notifications={notifications}
            unreadCount={unreadCount}
            onClose={() => setNotificationsOpen(false)}
          />
          <div className='flex-1 overflow-y-auto py-4 md:py-6 no-scrollbar'>
            <ErrorBoundary>
              <Suspense fallback={<ContentLoader />}>
                <AnimatePresence mode='wait'>
                  <motion.div
                    key={activePage}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.25, ease: 'easeOut' }}
                  >
                    {renderPage()}
                  </motion.div>
                </AnimatePresence>
              </Suspense>
            </ErrorBoundary>
          </div>
          <footer className='py-3 px-4 md:px-6 border-t border-gray-100 bg-white flex flex-col sm:flex-row justify-between items-center text-gray-400 text-[10px] md:text-[11px] gap-2'>
            <p>© 2024 المخازن المصرية المتحدة — نظام إدارة المستودعات الذكي</p>
            <div className='flex items-center gap-4'>
              <button className='hover:text-gray-600 transition-colors font-medium'>الشروط</button>
              <button className='hover:text-gray-600 transition-colors font-medium'>الخصوصية</button>
            </div>
          </footer>
        </main>
        {currentUser?.role === 'manager' && (
          <QuickActions isOpen={isQuickActionsOpen} onToggle={() => setQuickActionsOpen(!isQuickActionsOpen)} onNavigate={handleNavigate} currentPage={activePage} />
        )}
      </div>
    </ErrorBoundary>
  );
}
