import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const remove = useCallback((id) => {
    setToasts((list) => list.filter((t) => t.id !== id));
  }, []);

  const push = useCallback((type, message, opts = {}) => {
    const id = Math.random().toString(36).slice(2);
    const t = { id, type, message, timeout: opts.timeout ?? 3000 };
    setToasts((list) => [...list, t]);
    if (t.timeout > 0) {
      setTimeout(() => remove(id), t.timeout);
    }
  }, [remove]);

  const api = useMemo(() => ({
    success: (msg, opts) => push('success', msg, opts),
    info: (msg, opts) => push('info', msg, opts),
    warn: (msg, opts) => push('warn', msg, opts),
    error: (msg, opts) => push('error', msg, opts),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[220px] max-w-xs px-3 py-2 rounded shadow text-sm border ${
              t.type === 'success' ? 'bg-green-600 text-white border-green-700' :
              t.type === 'info' ? 'bg-blue-600 text-white border-blue-700' :
              t.type === 'warn' ? 'bg-yellow-500 text-black border-yellow-600' :
              'bg-red-600 text-white border-red-700'
            }`}
            onClick={() => remove(t.id)}
            role="status"
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) return { success() {}, info() {}, warn() {}, error() {} };
  return ctx;
}
