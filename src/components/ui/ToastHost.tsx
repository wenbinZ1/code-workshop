import { Icon } from './Icon';
import { useUiStore } from '@/stores/uiStore';

export function ToastHost() {
  const toasts = useUiStore((state) => state.toasts);
  const dismiss = useUiStore((state) => state.dismissToast);
  return (
    <div className="toast-host" aria-live="polite">
      {toasts.map((toast) => (
        <button
          key={toast.id}
          type="button"
          className={`toast toast-${toast.tone}`}
          onClick={() => dismiss(toast.id)}
        >
          <Icon
            name={toast.tone === 'success' ? 'check' : toast.tone === 'error' ? 'alert' : 'info'}
            size={15}
          />
          <span>{toast.message}</span>
        </button>
      ))}
    </div>
  );
}
