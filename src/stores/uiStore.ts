import { create } from 'zustand';
import type { ToastItem } from '@/types';
import { uid } from '@/lib/id';

interface UiState {
  toasts: ToastItem[];
  sidebarOpen: boolean;
  pushToast: (message: string, tone?: ToastItem['tone']) => void;
  dismissToast: (id: string) => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  // 移动端首屏默认收起抽屉，桌面端由 CSS 常驻显示。
  sidebarOpen: false,
  pushToast: (message, tone = 'info') => {
    const item: ToastItem = { id: uid('toast'), message, tone };
    set((state) => ({ toasts: [...state.toasts, item].slice(-4) }));
    window.setTimeout(() => {
      set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== item.id) }));
    }, 2600);
  },
  dismissToast: (id) =>
    set((state) => ({ toasts: state.toasts.filter((toast) => toast.id !== id) })),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
