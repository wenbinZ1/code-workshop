import type { SVGProps } from 'react';

export type IconName =
  | 'home'
  | 'sort'
  | 'code'
  | 'layers'
  | 'sparkles'
  | 'activity'
  | 'chart'
  | 'settings'
  | 'play'
  | 'pause'
  | 'step'
  | 'reset'
  | 'shuffle'
  | 'arrowRight'
  | 'arrowUp'
  | 'arrowDown'
  | 'check'
  | 'close'
  | 'menu'
  | 'sun'
  | 'moon'
  | 'monitor'
  | 'search'
  | 'plus'
  | 'trash'
  | 'star'
  | 'bolt'
  | 'target'
  | 'book'
  | 'clock'
  | 'chevronRight'
  | 'chevronDown'
  | 'copy'
  | 'download'
  | 'upload'
  | 'refresh'
  | 'terminal'
  | 'alert'
  | 'info'
  | 'gitBranch'
  | 'pin'
  | 'spark'
  | 'send'
  | 'stop'
  | 'external'
  | 'filter'
  | 'eye';

interface IconProps extends Omit<SVGProps<SVGSVGElement>, 'name'> {
  name: IconName;
  size?: number;
}

export function Icon({ name, size = 18, ...rest }: IconProps) {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
    focusable: 'false' as const,
    ...rest,
  };

  switch (name) {
    case 'home':
      return (
        <svg {...common}>
          <path d="M3.5 10.5 12 3l8.5 7.5" />
          <path d="M5.5 9.5V21h13V9.5" />
          <path d="M9.5 21v-6h5v6" />
        </svg>
      );
    case 'sort':
      return (
        <svg {...common}>
          <path d="M4 7h10M4 12h7M4 17h4" />
          <path d="M17 6v12M14.5 15.5 17 18l2.5-2.5" />
        </svg>
      );
    case 'code':
      return (
        <svg {...common}>
          <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" />
        </svg>
      );
    case 'layers':
      return (
        <svg {...common}>
          <path d="m12 3 9 5-9 5-9-5 9-5Z" />
          <path d="m3 12 9 5 9-5M3 16l9 5 9-5" />
        </svg>
      );
    case 'sparkles':
      return (
        <svg {...common}>
          <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
          <path d="m6.3 6.3 2.4 2.4M15.3 15.3l2.4 2.4M17.7 6.3l-2.4 2.4M8.7 15.3l-2.4 2.4" />
          <circle cx="12" cy="12" r="2.5" />
        </svg>
      );
    case 'activity':
      return (
        <svg {...common}>
          <path d="M3 12h4l2-7 4 14 2-7h6" />
        </svg>
      );
    case 'chart':
      return (
        <svg {...common}>
          <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
        </svg>
      );
    case 'settings':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6V21h-4v-.1a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.6-1H3v-4h.1a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1A1.7 1.7 0 0 0 9 4.6a1.7 1.7 0 0 0 1-1.6V3h4v.1a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.1v4H21a1.7 1.7 0 0 0-1.6 1Z" />
        </svg>
      );
    case 'play':
      return (
        <svg {...common}>
          <path d="M8 5v14l11-7Z" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'pause':
      return (
        <svg {...common}>
          <path d="M8 5v14M16 5v14" strokeWidth="3" />
        </svg>
      );
    case 'step':
      return (
        <svg {...common}>
          <path d="M5 5v14l9-7Z" fill="currentColor" stroke="none" />
          <path d="M18 5v14" strokeWidth="3" />
        </svg>
      );
    case 'reset':
      return (
        <svg {...common}>
          <path d="M3 4v6h6" />
          <path d="M3.5 10a8.5 8.5 0 1 1 2 8" />
        </svg>
      );
    case 'shuffle':
      return (
        <svg {...common}>
          <path d="M3 7h3c4 0 6 10 10 10h5" />
          <path d="m18 14 3 3-3 3M3 17h3c1.4 0 2.6-1.2 3.7-2.7M14.3 8.7C15.4 7.2 16.6 7 18 7h3" />
          <path d="m18 4 3 3-3 3" />
        </svg>
      );
    case 'arrowRight':
      return (
        <svg {...common}>
          <path d="M4 12h16M14 6l6 6-6 6" />
        </svg>
      );
    case 'arrowUp':
      return (
        <svg {...common}>
          <path d="M12 20V4M6 10l6-6 6 6" />
        </svg>
      );
    case 'arrowDown':
      return (
        <svg {...common}>
          <path d="M12 4v16M6 14l6 6 6-6" />
        </svg>
      );
    case 'check':
      return (
        <svg {...common}>
          <path d="m5 12.5 4.4 4.4L19 7" />
        </svg>
      );
    case 'close':
      return (
        <svg {...common}>
          <path d="M6 6l12 12M18 6 6 18" />
        </svg>
      );
    case 'menu':
      return (
        <svg {...common}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      );
    case 'sun':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
        </svg>
      );
    case 'moon':
      return (
        <svg {...common}>
          <path d="M20 14.5A8.5 8.5 0 0 1 9.5 4a8.5 8.5 0 1 0 10.5 10.5Z" />
        </svg>
      );
    case 'monitor':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="13" rx="2" />
          <path d="M8 21h8M12 17v4" />
        </svg>
      );
    case 'search':
      return (
        <svg {...common}>
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-4-4" />
        </svg>
      );
    case 'plus':
      return (
        <svg {...common}>
          <path d="M12 5v14M5 12h14" />
        </svg>
      );
    case 'trash':
      return (
        <svg {...common}>
          <path d="M4 7h16M9 7V4h6v3M7 7l1 13h8l1-13M10 11v5M14 11v5" />
        </svg>
      );
    case 'star':
      return (
        <svg {...common}>
          <path d="m12 3 2.7 5.6 6.1.8-4.5 4.2 1.2 6-5.5-3-5.5 3 1.2-6L3.2 9.4l6.1-.8Z" />
        </svg>
      );
    case 'bolt':
      return (
        <svg {...common}>
          <path d="M13 2 4 14h6l-1 8 9-12h-6Z" />
        </svg>
      );
    case 'target':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="8" />
          <circle cx="12" cy="12" r="4" />
          <circle cx="12" cy="12" r="1" fill="currentColor" />
        </svg>
      );
    case 'book':
      return (
        <svg {...common}>
          <path d="M4 4h7a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H4Z" />
          <path d="M20 4h-3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h3Z" />
        </svg>
      );
    case 'clock':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v5l3 2" />
        </svg>
      );
    case 'chevronRight':
      return (
        <svg {...common}>
          <path d="m9 5 7 7-7 7" />
        </svg>
      );
    case 'chevronDown':
      return (
        <svg {...common}>
          <path d="m5 9 7 7 7-7" />
        </svg>
      );
    case 'copy':
      return (
        <svg {...common}>
          <rect x="9" y="9" width="11" height="11" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      );
    case 'download':
      return (
        <svg {...common}>
          <path d="M12 3v12M7 10l5 5 5-5M4 21h16" />
        </svg>
      );
    case 'upload':
      return (
        <svg {...common}>
          <path d="M12 16V4M7 9l5-5 5 5M4 21h16" />
        </svg>
      );
    case 'refresh':
      return (
        <svg {...common}>
          <path d="M21 4v6h-6" />
          <path d="M20.5 10a8.5 8.5 0 1 0-2 8" />
        </svg>
      );
    case 'terminal':
      return (
        <svg {...common}>
          <rect x="3" y="4" width="18" height="16" rx="2" />
          <path d="m7 9 3 3-3 3M13 15h4" />
        </svg>
      );
    case 'alert':
      return (
        <svg {...common}>
          <path d="M12 3 2.5 20h19Z" />
          <path d="M12 9v5M12 17.5v.5" />
        </svg>
      );
    case 'info':
      return (
        <svg {...common}>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 11v5M12 7.5v.5" />
        </svg>
      );
    case 'gitBranch':
      return (
        <svg {...common}>
          <circle cx="6" cy="5" r="2.5" />
          <circle cx="6" cy="19" r="2.5" />
          <circle cx="18" cy="7" r="2.5" />
          <path d="M6 7.5v9M8.5 5H15a3 3 0 0 1 3 3v0" />
        </svg>
      );
    case 'pin':
      return (
        <svg {...common}>
          <path d="M12 17v5M7 3h10l-1 6 3 3v2H5v-2l3-3Z" />
        </svg>
      );
    case 'spark':
      return (
        <svg {...common}>
          <path d="M12 2v5M12 17v5M2 12h5M17 12h5M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M18.4 5.6l-3.5 3.5M9.1 14.9l-3.5 3.5" />
        </svg>
      );
    case 'send':
      return (
        <svg {...common}>
          <path d="M22 2 11 13M22 2l-7 20-4-9-9-4Z" />
        </svg>
      );
    case 'stop':
      return (
        <svg {...common}>
          <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'external':
      return (
        <svg {...common}>
          <path d="M14 3h7v7M21 3l-9 9" />
          <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
      );
    case 'filter':
      return (
        <svg {...common}>
          <path d="M3 5h18l-7 8v6l-4 2v-8Z" />
        </svg>
      );
    case 'eye':
      return (
        <svg {...common}>
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      );
    default:
      return null;
  }
}
