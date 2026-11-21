import { Fragment, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import clsx from 'clsx';
import { Icon, type IconName } from './Icon';

export interface CrumbItem {
  label: string;
  to?: string;
  icon?: IconName;
}

/**
 * 可点击面包屑：除最后一级（当前页）外，每一级都渲染为路由链接。
 * 跳转后页面组件会重新挂载，页面级筛选、选择、排序动画等瞬态状态随之初始化。
 */
export function Breadcrumbs({ items, className }: { items: CrumbItem[]; className?: string }) {
  return (
    <nav className={clsx('breadcrumbs', className)} aria-label="面包屑导航">
      {items.map((item, index) => {
        const last = index === items.length - 1;
        const content = (
          <>
            {item.icon ? <Icon name={item.icon} size={12} /> : null}
            <span>{item.label}</span>
          </>
        );
        return (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 ? <Icon name="chevronRight" size={11} className="breadcrumbs-sep" /> : null}
            {item.to && !last ? (
              <Link to={item.to} viewTransition className="breadcrumbs-link">
                {content}
              </Link>
            ) : (
              <span className={clsx('breadcrumbs-current', last && 'is-current')} aria-current={last ? 'page' : undefined}>
                {content}
              </span>
            )}
          </Fragment>
        );
      })}
    </nav>
  );
}

export function Button({
  children,
  variant = 'default',
  size = 'md',
  icon,
  className,
  ...rest
}: {
  children?: ReactNode;
  variant?: 'default' | 'primary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: IconName;
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={clsx('btn', `btn-${variant}`, `btn-${size}`, className)}
      type="button"
      {...rest}
    >
      {icon ? <Icon name={icon} size={size === 'sm' ? 14 : 16} /> : null}
      {children}
    </button>
  );
}

export function IconButton({
  name,
  label,
  className,
  ...rest
}: { name: IconName; label: string } & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={clsx('icon-btn', className)}
      aria-label={label}
      title={label}
      {...rest}
    >
      <Icon name={name} size={17} />
    </button>
  );
}

export function Card({
  children,
  className,
  padded = true,
  ...rest
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={clsx('card', padded && 'card-padded', className)} {...rest}>
      {children}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  dot,
  className,
}: {
  children: ReactNode;
  tone?: 'neutral' | 'accent' | 'success' | 'warn' | 'danger' | 'blue' | 'violet';
  dot?: boolean;
  className?: string;
}) {
  return (
    <span className={clsx('badge', `badge-${tone}`, className)}>
      {dot ? <i className="badge-dot" /> : null}
      {children}
    </span>
  );
}

export function Progress({
  value,
  max = 100,
  tone = 'accent',
  className,
}: {
  value: number;
  max?: number;
  tone?: 'accent' | 'blue' | 'amber' | 'green';
  className?: string;
}) {
  const pct = Math.max(0, Math.min(100, (value / Math.max(1, max)) * 100));
  return (
    <div className={clsx('progress', `progress-${tone}`, className)}>
      <span style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Ring({
  value,
  size = 78,
  stroke = 7,
  color,
  label,
  sub,
}: {
  value: number;
  size?: number;
  stroke?: number;
  color?: string;
  label?: ReactNode;
  sub?: ReactNode;
}) {
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const dash = (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return (
    <div className="ring" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} aria-hidden="true">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--line)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color ?? 'var(--accent)'}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${shown ? dash : 0} ${circumference}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="ring-value"
        />
      </svg>
      <div className="ring-label">
        <strong>{label ?? `${Math.round(value)}%`}</strong>
        {sub ? <span>{sub}</span> : null}
      </div>
    </div>
  );
}

export function Sparkline({
  values,
  width = 110,
  height = 28,
  color = 'var(--accent)',
}: {
  values: number[];
  width?: number;
  height?: number;
  color?: string;
}) {
  const points = useMemo(() => {
    const max = Math.max(...values, 1);
    const min = Math.min(...values, 0);
    const span = max - min || 1;
    return values
      .map((value, index) => {
        const x = (index / Math.max(1, values.length - 1)) * width;
        const y = height - 2 - ((value - min) / span) * (height - 4);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [values, width, height]);
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} width={width} height={height} aria-hidden="true">
      <polyline points={points} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1>{title}</h1>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="page-header-actions">{actions}</div> : null}
    </header>
  );
}

export function SectionTitle({
  title,
  hint,
  actions,
}: {
  title: string;
  hint?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="section-title">
      <div>
        <h2>{title}</h2>
        {hint ? <span>{hint}</span> : null}
      </div>
      {actions}
    </div>
  );
}

export function EmptyState({
  icon = 'layers',
  title,
  description,
  action,
}: {
  icon?: IconName;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span className="empty-icon">
        <Icon name={icon} size={24} />
      </span>
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  width = 560,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: number;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    const timer = window.setTimeout(() => {
      const focusable = panel.current?.querySelector<HTMLElement>('button, input, textarea, select');
      focusable?.focus();
    }, 30);
    return () => {
      document.removeEventListener('keydown', onKey);
      window.clearTimeout(timer);
    };
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="modal-mask" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className="modal" style={{ width }} role="dialog" aria-modal="true" aria-label={title} ref={panel}>
        <div className="modal-head">
          <h3>{title}</h3>
          <IconButton name="close" label="关闭" onClick={onClose} />
        </div>
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  );
}

export function CodeBlock({
  code,
  language = 'python',
  highlight,
  showLineNumbers = true,
  className,
}: {
  code: string;
  language?: string;
  highlight?: number;
  showLineNumbers?: boolean;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, '').split('\n');
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      /* clipboard may be blocked */
    }
  }
  return (
    <div className={clsx('code-block', className)}>
      <div className="code-block-head">
        <span>{language}</span>
        <button type="button" className="code-copy" onClick={copy}>
          <Icon name={copied ? 'check' : 'copy'} size={13} />
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <pre>
        {lines.map((line, index) => (
          <div
            key={`${line}-${index}`}
            className={clsx('code-line', highlight === index + 1 && 'is-highlight')}
          >
            {showLineNumbers ? <span className="code-line-no">{index + 1}</span> : null}
            <code>{line || ' '}</code>
          </div>
        ))}
      </pre>
    </div>
  );
}

export function Divider({ label }: { label?: string }) {
  return (
    <div className="divider">
      {label ? <span>{label}</span> : null}
    </div>
  );
}

export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: Array<{ id: T; label: string; count?: number }>;
  value: T;
  onChange: (id: T) => void;
  className?: string;
}) {
  return (
    <div className={clsx('tabs', className)} role="tablist">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          role="tab"
          aria-selected={value === item.id}
          className={clsx('tab', value === item.id && 'is-active')}
          onClick={() => onChange(item.id)}
        >
          {item.label}
          {typeof item.count === 'number' ? <span>{item.count}</span> : null}
        </button>
      ))}
    </div>
  );
}
