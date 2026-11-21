import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './styles/tokens.css';
import './styles/global.css';
import './styles/app.css';
import './styles/pages.css';

const OVERLAY_ID = 'code-workshop-fatal';

function describe(error: unknown): string {
  if (error instanceof Error) return `${error.name}: ${error.message}`;
  if (typeof error === 'string') return error;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

/** 启动或渲染失败时显示可见的错误面板，避免出现「空白窗口直接退出」。 */
function showFatal(error: unknown) {
  console.error('[code-workshop] 未捕获异常', error);
  if (document.getElementById(OVERLAY_ID)) return;
  const box = document.createElement('div');
  box.id = OVERLAY_ID;
  box.style.cssText = [
    'position:fixed', 'inset:0', 'z-index:9999', 'display:flex',
    'flex-direction:column', 'align-items:center', 'justify-content:center',
    'gap:12px', 'padding:32px', 'background:#060a13', 'color:#e9f0ff',
    'font-family:ui-sans-serif,system-ui,"Segoe UI",sans-serif', 'text-align:center',
    'background-image:radial-gradient(700px 420px at 50% 30%, rgba(77,141,255,.12), transparent 65%)',
  ].join(';');
  const title = document.createElement('strong');
  title.textContent = '码上工坊启动失败';
  title.style.cssText = 'font-size:18px;letter-spacing:-0.02em';
  const message = document.createElement('code');
  message.textContent = describe(error);
  message.style.cssText =
    'max-width:min(760px,90vw);padding:12px 14px;border-radius:10px;background:#0c1322;color:#ff9b9b;font-size:12px;line-height:1.6;word-break:break-word;white-space:pre-wrap';
  const hint = document.createElement('span');
  hint.textContent =
    '如果窗口一直空白，请检查 WebView2 运行时；桌面端启动日志位于 %LOCALAPPDATA%\\com.mashang.workshop\\startup.log。';
  hint.style.cssText = 'max-width:640px;color:#8b95a3;font-size:12px;line-height:1.6';
  const reload = document.createElement('button');
  reload.type = 'button';
  reload.textContent = '重新加载';
  reload.style.cssText =
    'margin-top:6px;padding:8px 18px;border-radius:8px;border:0;background:#4d8dff;color:#04101f;font-weight:600;cursor:pointer';
  reload.addEventListener('click', () => window.location.reload());
  box.append(title, message, hint, reload);
  document.body.append(box);
}

window.addEventListener('error', (event) => {
  showFatal(event.error ?? event.message);
});
window.addEventListener('unhandledrejection', (event) => {
  showFatal(event.reason);
});

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: unknown }> {
  state: { error: unknown } = { error: null };

  static getDerivedStateFromError(error: unknown) {
    return { error };
  }

  componentDidCatch(error: unknown) {
    showFatal(error);
  }

  render() {
    return this.state.error ? null : this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>,
);
