import { useEffect, useState } from 'react';
import { useAppStore } from '@/stores/appStore';

export type ResolvedTheme = 'dark' | 'light';

export function useResolvedTheme(): ResolvedTheme {
  const mode = useAppStore((state) => state.theme);
  const [systemDark, setSystemDark] = useState(() =>
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-color-scheme: dark)').matches
      : true,
  );

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystemDark(media.matches);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, []);

  if (mode === 'system') return systemDark ? 'dark' : 'light';
  return mode;
}
