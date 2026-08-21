import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import {QueryClient, QueryClientProvider} from '@tanstack/react-query';
import App from './App.tsx';
import {ErrorBoundary} from './components/ErrorBoundary';
import './index.css';

/* ---- FOCUS/KEYBOARD DEBUG INSTRUMENTATION ---- */
let _instStamp = 0;
function stamp() { return ++_instStamp; }

document.addEventListener('focusin', (e) => {
  const el = e.target as HTMLElement | null;
  console.log(`[${stamp()}][FOCUS-IN] tag=${el?.tagName} id=${el?.id || '-'} cls=${el?.className?.slice(0, 60) || '-'} name=${el?.getAttribute?.('name') || '-'} text=${el?.textContent?.trim()?.slice(0, 30) || '-'}`);
});
document.addEventListener('focusout', (e) => {
  const el = e.target as HTMLElement | null;
  const rel = e.relatedTarget as HTMLElement | null;
  console.log(`[${stamp()}][FOCUS-OUT] from=${el?.tagName} id=${el?.id || '-'} -> relatedTarget=${rel?.tagName || 'null'} id=${rel?.id || '-'}`);
});

document.addEventListener('keydown', (e) => {
  const t = e.target as HTMLElement | null;
  const a = document.activeElement as HTMLElement | null;
  console.log(`[${stamp()}][KEYDOWN] key=${e.key} code=${e.code} target=${t?.tagName} id=${t?.id || '-'} activeElement=${a?.tagName} id=${a?.id || '-'} cls=${a?.className?.slice(0, 40) || '-'}`, e);
}, { capture: true });

const _origFocus = HTMLElement.prototype.focus;
HTMLElement.prototype.focus = function (this: HTMLElement, options?: FocusOptions) {
  console.log(`[${stamp()}][FOCUS-CALLED] tag=${this.tagName} id=${this.id || '-'} cls=${this.className?.slice(0, 40) || '-'} text=${this.textContent?.trim()?.slice(0, 30) || '-'}`);
  console.trace('[FOCUS-CALLED-TRACE]');
  return _origFocus.call(this, options);
};
/* ---- END INSTRUMENTATION ---- */

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </ErrorBoundary>
  </StrictMode>,
);
