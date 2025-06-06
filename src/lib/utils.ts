import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast as sonnerToast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Keep track of recent toasts to prevent duplicates
const recentToasts = new Map<string, number>();
const TOAST_DEBOUNCE_MS = 300; // Prevent duplicate toasts within 300ms

export const toast = {
  success: (message: string, options?: any) => {
    const key = `success-${message}`;
    const now = Date.now();
    const lastTime = recentToasts.get(key) || 0;
    
    if (now - lastTime > TOAST_DEBOUNCE_MS) {
      recentToasts.set(key, now);
      sonnerToast.success(message, options);
    }
  },
  
  error: (message: string, options?: any) => {
    const key = `error-${message}`;
    const now = Date.now();
    const lastTime = recentToasts.get(key) || 0;
    
    if (now - lastTime > TOAST_DEBOUNCE_MS) {
      recentToasts.set(key, now);
      sonnerToast.error(message, options);
    }
  },
  
  info: (message: string, options?: any) => {
    const key = `info-${message}`;
    const now = Date.now();
    const lastTime = recentToasts.get(key) || 0;
    
    if (now - lastTime > TOAST_DEBOUNCE_MS) {
      recentToasts.set(key, now);
      sonnerToast.info(message, options);
    }
  },
  
  warning: (message: string, options?: any) => {
    const key = `warning-${message}`;
    const now = Date.now();
    const lastTime = recentToasts.get(key) || 0;
    
    if (now - lastTime > TOAST_DEBOUNCE_MS) {
      recentToasts.set(key, now);
      sonnerToast.warning(message, options);
    }
  },
  
  // Add other toast methods as needed
  promise: sonnerToast.promise,
  dismiss: sonnerToast.dismiss,
  custom: sonnerToast.custom
};
