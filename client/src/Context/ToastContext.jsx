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
    xp: (msg, opts) => push('xp', msg, { timeout: 4000, ...opts }),
    achievement: (msg, opts) => push('achievement', msg, { timeout: 5000, ...opts }),
    streak: (msg, opts) => push('streak', msg, { timeout: 4000, ...opts }),
  }), [push]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`min-w-[220px] max-w-xs px-4 py-3 rounded-lg shadow-lg text-sm border transform transition-all duration-300 animate-bounce-in ${
              t.type === 'success' ? 'bg-green-600 text-white border-green-700' :
              t.type === 'info' ? 'bg-blue-600 text-white border-blue-700' :
              t.type === 'warn' ? 'bg-yellow-500 text-black border-yellow-600' :
              t.type === 'error' ? 'bg-red-600 text-white border-red-700' :
              t.type === 'xp' ? 'bg-gradient-to-r from-purple-600 to-blue-600 text-white border-purple-700' :
              t.type === 'achievement' ? 'bg-gradient-to-r from-yellow-500 to-orange-600 text-white border-yellow-600' :
              t.type === 'streak' ? 'bg-gradient-to-r from-orange-500 to-red-600 text-white border-orange-600' :
              'bg-red-600 text-white border-red-700'
            }`}
            onClick={() => remove(t.id)}
            role="status"
          >
            <div className="flex items-center gap-2">
              {t.type === 'xp' && <span className="text-lg">⭐</span>}
              {t.type === 'achievement' && <span className="text-lg">🏆</span>}
              {t.type === 'streak' && <span className="text-lg">🔥</span>}
              {t.type === 'success' && <span className="text-lg">✅</span>}
              {t.type === 'info' && <span className="text-lg">ℹ️</span>}
              {t.type === 'warn' && <span className="text-lg">⚠️</span>}
              {t.type === 'error' && <span className="text-lg">❌</span>}
              <span className="font-medium">{t.message}</span>
            </div>
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
