import { useMemo } from 'react';
import { lastNDays, shortDate } from '@/lib/time';

export function Heatmap({
  days,
  weeks = 8,
  compact = false,
}: {
  days: Record<string, number>;
  weeks?: number;
  compact?: boolean;
}) {
  const cells = useMemo(() => {
    const keys = lastNDays(weeks * 7);
    return keys.map((key) => {
      const minutes = days[key] ?? 0;
      let level = 0;
      if (minutes > 0) level = 1;
      if (minutes >= 30) level = 2;
      if (minutes >= 60) level = 3;
      if (minutes >= 90) level = 4;
      return { key, minutes, level };
    });
  }, [days, weeks]);

  return (
    <div className={compact ? 'heatmap is-compact' : 'heatmap'}>
      <div className="heatmap-body">
        <div className="heatmap-days">
          <span>一</span>
          <span>三</span>
          <span>五</span>
          <span>日</span>
        </div>
        <div
          className="heatmap-grid"
          style={{ gridTemplateColumns: `repeat(${weeks}, 1fr)` }}
          role="img"
          aria-label={`近 ${weeks} 周学习活跃度`}
        >
          {Array.from({ length: weeks }).map((_, weekIndex) => (
            <div className="heatmap-week" key={weekIndex}>
              {cells.slice(weekIndex * 7, weekIndex * 7 + 7).map((cell) => (
                <i
                  key={cell.key}
                  className={`heatmap-cell level-${cell.level}`}
                  title={`${shortDate(cell.key)} · ${cell.minutes} 分钟`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
      <div className="heatmap-legend">
        <span>少</span>
        {[0, 1, 2, 3, 4].map((level) => (
          <i key={level} className={`heatmap-cell level-${level}`} />
        ))}
        <span>多</span>
      </div>
    </div>
  );
}
