import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[400px] flex items-center justify-center p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-gray-200 m-6">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-red-600">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h2 className="text-2xl font-black mb-2">عذراً، حدث خطأ غير متوقع</h2>
            <p className="text-gray-500 mb-8 font-bold">
              نواجه مشكلة في عرض هذا الجزء من النظام. جرب إعادة تحميل الصفحة أو العودة للرئيسية.
            </p>
            <div className="flex gap-4 justify-center">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 bg-black text-white px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all"
              >
                <RefreshCcw className="w-4 h-4" />
                إعادة التحميل
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex items-center gap-2 bg-white border-2 border-black text-black px-6 py-3 rounded-xl font-bold hover:scale-105 transition-all"
              >
                <Home className="w-4 h-4" />
                الرئيسية
              </button>
            </div>
            {process.env.NODE_ENV === 'development' && (
              <pre className="mt-8 p-4 bg-red-50 text-red-700 text-xs text-right overflow-auto rounded-lg max-h-40 border border-red-100">
                {this.state.error?.toString()}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
