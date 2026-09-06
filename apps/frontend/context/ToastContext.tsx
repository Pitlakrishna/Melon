'use client';

import React, { createContext, useContext, useState } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';
import styles from './Toast.module.css';

// 1. Types for our toasts
export type ToastType = 'success' | 'error' | 'info';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  title?: string;
}

interface ToastContextType {
  success: (message: string, title?: string) => void;
  error: (message: string, title?: string) => void;
  info: (message: string, title?: string) => void;
  removeToast: (id: string) => void;
}

// 2. Create the Context
const ToastContext = createContext<ToastContextType | undefined>(undefined);

// 3. Provider Component
export function ToastProvider({ children }: { children: React.ReactNode }) {
  // Simple state: an array of visible toasts
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  // Function to remove a toast by its ID
  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  // Function to add a toast and automatically remove it after 4 seconds
  const showToast = (message: string, type: ToastType = 'info', title?: string) => {
    const id = Date.now().toString(); // unique ID using current timestamp
    const newToast: ToastItem = { id, type, message, title };

    // Add new toast to list
    setToasts((prev) => [...prev, newToast]);

    // Automatically remove after 4 seconds
    setTimeout(() => {
      removeToast(id);
    }, 4000);
  };

  // Helper functions exposed to other components
  const value: ToastContextType = {
    success: (msg, title) => showToast(msg, 'success', title),
    error: (msg, title) => showToast(msg, 'error', title),
    info: (msg, title) => showToast(msg, 'info', title),
    removeToast,
  };

  // Choose icon based on toast type
  const getIcon = (type: ToastType) => {
    if (type === 'success') return <FiCheckCircle className={`text-lg flex-shrink-0 ${styles.iconSuccess}`} />;
    if (type === 'error') return <FiAlertCircle className={`text-lg flex-shrink-0 ${styles.iconError}`} />;
    return <FiInfo className={`text-lg flex-shrink-0 ${styles.iconInfo}`} />;
  };

  // Choose border style based on toast type
  const getStyleClass = (type: ToastType) => {
    if (type === 'success') return styles.toastSuccess;
    if (type === 'error') return styles.toastError;
    return styles.toastInfo;
  };

  return (
    <ToastContext.Provider value={value}>
      {children}

      {/* Floating Toast Container */}
      <div className={styles.toastContainer} aria-live="polite">
        {toasts.map((toast) => (
          <div key={toast.id} className={`${styles.toast} ${getStyleClass(toast.type)}`}>
            {getIcon(toast.type)}
            <div className="flex-1 min-w-0 pr-1">
              {toast.title && (
                <div className="font-semibold text-xs tracking-tight mb-0.5">{toast.title}</div>
              )}
              <div className="text-xs leading-relaxed opacity-90 break-words">{toast.message}</div>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className={styles.closeBtn}
              aria-label="Dismiss notification"
            >
              <FiX className="text-sm" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// 4. Custom Hook for easy usage in components: const toast = useToast()
export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}


