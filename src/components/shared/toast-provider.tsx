import { CheckCircle2, CircleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type PropsWithChildren } from 'react';

type ToastItem = {
  id: string;
  title: string;
  description?: string;
  variant?: 'success' | 'error';
};

type ToastContextValue = {
  push: (toast: Omit<ToastItem, 'id'>) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const push = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = crypto.randomUUID();
    setToasts((current) => [...current, { ...toast, id }]);
    window.setTimeout(() => remove(id), 3500);
  }, [remove]);

  const value = useMemo(() => ({ push }), [push]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className='pointer-events-none fixed right-4 top-4 z-[60] flex w-full max-w-sm flex-col gap-3'>
        {toasts.map((toast) => {
          const success = toast.variant !== 'error';
          return (
            <div
              key={toast.id}
              className='pointer-events-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-soft'
            >
              <div className='flex items-start gap-3'>
                <div className={success ? 'text-emerald-600' : 'text-rose-600'}>
                  {success ? <CheckCircle2 size={18} /> : <CircleAlert size={18} />}
                </div>
                <div className='min-w-0 flex-1'>
                  <p className='text-sm font-semibold text-slate-900'>{toast.title}</p>
                  {toast.description ? <p className='mt-1 text-sm text-slate-500'>{toast.description}</p> : null}
                </div>
                <button
                  onClick={() => remove(toast.id)}
                  className='rounded-lg p-1 text-slate-400 hover:bg-slate-50'
                >
                  <X size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);

  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }

  return context;
}
