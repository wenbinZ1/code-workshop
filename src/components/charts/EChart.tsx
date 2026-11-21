import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import clsx from 'clsx';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';

export interface ChartTheme {
  mode: 'dark' | 'light';
  text: string;
  muted: string;
  faint: string;
  grid: string;
  panel: string;
  border: string;
  accent: string;
  accentSoft: string;
  green: string;
  blue: string;
  amber: string;
  red: string;
  violet: string;
  pink: string;
}

const DARK: ChartTheme = {
  mode: 'dark',
  text: '#e9f0ff',
  muted: '#93a7c9',
  faint: '#61759a',
  grid: 'rgba(233, 240, 255, 0.08)',
  panel: '#0c1322',
  border: '#1c2b45',
  accent: '#4d8dff',
  accentSoft: 'rgba(77, 141, 255, 0.18)',
  green: '#3ddc97',
  blue: '#4d8dff',
  amber: '#ffc44d',
  red: '#ff6b7d',
  violet: '#a78bfa',
  pink: '#ff8fb3',
};

const LIGHT: ChartTheme = {
  mode: 'light',
  text: '#101a2c',
  muted: '#55688a',
  faint: '#7d8fac',
  grid: 'rgba(16, 40, 80, 0.09)',
  panel: '#ffffff',
  border: '#d8e3f4',
  accent: '#1f66e0',
  accentSoft: 'rgba(31, 102, 224, 0.12)',
  green: '#0f9f6e',
  blue: '#2563eb',
  amber: '#b45309',
  red: '#dc2626',
  violet: '#6d28d9',
  pink: '#be185d',
};

export function useChartTheme(): ChartTheme {
  const mode = useResolvedTheme();
  return mode === 'dark' ? DARK : LIGHT;
}

export function baseTooltip(theme: ChartTheme): EChartsOption['tooltip'] {
  return {
    backgroundColor: theme.panel,
    borderColor: theme.border,
    borderWidth: 1,
    padding: [8, 10],
    textStyle: { color: theme.text, fontSize: 12 },
    extraCssText: 'box-shadow: 0 10px 30px rgba(0,0,0,.18); border-radius: 8px;',
  };
}

export function EChart({
  option,
  height = 260,
  className,
}: {
  option: EChartsOption;
  height?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const chart = useRef<echarts.ECharts | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    chart.current = echarts.init(ref.current, undefined, { renderer: 'canvas' });
    chart.current.setOption(option, true);
    const observer = new ResizeObserver(() => chart.current?.resize());
    observer.observe(ref.current);
    return () => {
      observer.disconnect();
      chart.current?.dispose();
      chart.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    chart.current?.setOption(option, true);
  }, [option]);

  return <div ref={ref} className={clsx('echart', className)} style={{ height }} />;
}
