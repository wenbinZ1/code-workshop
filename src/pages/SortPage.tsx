import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Badge, Button, Card, PageHeader, SectionTitle } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useAppStore } from '@/stores/appStore';
import { useUiStore } from '@/stores/uiStore';
import { SORT_ALGORITHMS, algorithmById, generateSortSteps, makeRandomArray, verifySorted } from '@/lib/sorting';
import { formatClock } from '@/lib/time';
import type { SortAlgorithmId } from '@/types';

type Distribution = 'random' | 'reversed' | 'nearly' | 'few';

interface BenchRow {
  id: SortAlgorithmId;
  name: string;
  ms: number;
  comparisons: number;
  swaps: number;
  frames: number;
  frameEvery: number;
}

const DISTRIBUTIONS: Array<{ id: Distribution; label: string }> = [
  { id: 'random', label: '随机' },
  { id: 'nearly', label: '近乎有序' },
  { id: 'reversed', label: '完全逆序' },
  { id: 'few', label: '少量重复' },
];

const MAX_BARS = 160;

function Bars({
  array,
  comparing,
  swapping,
  sorted,
  pivot,
  max,
}: {
  array: number[];
  comparing: number[];
  swapping: number[];
  sorted: number[];
  pivot?: number;
  max: number;
}) {
  // 500 元素时不为每个元素渲染一根柱子：按桶降采样到最多 160 根，
  // 桶内任意元素高亮就把整根柱子标记为对应状态。
  const stride = Math.max(1, Math.ceil(array.length / MAX_BARS));
  const compareSet = new Set(comparing);
  const swapSet = new Set(swapping);
  const sortedSet = new Set(sorted);
  const bars: Array<{
    value: number;
    from: number;
    to: number;
    compare: boolean;
    swap: boolean;
    sorted: boolean;
    pivot: boolean;
  }> = [];

  for (let start = 0; start < array.length; start += stride) {
    const end = Math.min(array.length, start + stride);
    let bucketMax = array[start];
    let isCompare = false;
    let isSwap = false;
    let isSorted = false;
    let isPivot = false;
    for (let index = start; index < end; index += 1) {
      bucketMax = Math.max(bucketMax, array[index]);
      if (compareSet.has(index)) isCompare = true;
      if (swapSet.has(index)) isSwap = true;
      if (sortedSet.has(index)) isSorted = true;
      if (pivot === index) isPivot = true;
    }
    bars.push({
      value: bucketMax,
      from: start,
      to: end - 1,
      compare: isCompare,
      swap: isSwap,
      sorted: isSorted,
      pivot: isPivot,
    });
  }

  return (
    <div className="bars" style={{ gridTemplateColumns: `repeat(${bars.length}, minmax(2px, 1fr))` }}>
      {bars.map((bar) => (
        <div
          className="bar-slot"
          key={bar.from}
          title={
            stride === 1
              ? `a[${bar.from}] = ${bar.value}`
              : `a[${bar.from}…${bar.to}] 最大值 ${bar.value}`
          }
        >
          <span
            className={clsx(
              'bar',
              bar.sorted && 'is-sorted',
              bar.compare && 'is-comparing',
              bar.swap && 'is-swapping',
              bar.pivot && 'is-pivot',
            )}
            style={{ height: `${Math.max(6, (bar.value / max) * 100)}%` }}
          />
        </div>
      ))}
    </div>
  );
}

export function SortPage() {
  const completeSort = useAppStore((state) => state.actions.completeSort);
  const pushToast = useUiStore((state) => state.pushToast);
  const [algorithm, setAlgorithm] = useState<SortAlgorithmId>('bubble');
  const [compareWith, setCompareWith] = useState<SortAlgorithmId>('quick');
  const [compare, setCompare] = useState(false);
  const [size, setSize] = useState(32);
  const [distribution, setDistribution] = useState<Distribution>('random');
  const [array, setArray] = useState<number[]>(() => makeRandomArray(32, 'random'));
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const completed = useRef<string>('');
  const [bench, setBench] = useState<BenchRow[] | null>(null);
  const [benching, setBenching] = useState(false);

  const primary = useMemo(() => algorithmById(algorithm), [algorithm]);
  const secondary = useMemo(() => algorithmById(compareWith), [compareWith]);
  const run = useMemo(() => generateSortSteps(algorithm, array), [algorithm, array]);
  const secondRun = useMemo(() => generateSortSteps(compareWith, array), [compareWith, array]);
  const step = run.steps[Math.min(index, run.steps.length - 1)];
  const secondStep = secondRun.steps[Math.min(index, secondRun.steps.length - 1)];
  const lastIndex = Math.max(run.steps.length - 1, compare ? secondRun.steps.length - 1 : 0);
  const finished = index >= run.steps.length - 1 && (!compare || index >= secondRun.steps.length - 1);

  useEffect(() => {
    setIndex(0);
    setPlaying(false);
    setStartedAt(null);
    setElapsed(0);
    completed.current = '';
  }, [algorithm, compareWith, array, compare]);

  useEffect(() => {
    if (!playing) return;
    const delay = speed === 0.5 ? 600 : speed === 1 ? 300 : speed === 2 ? 150 : speed === 4 ? 75 : 35;
    const timer = window.setTimeout(() => {
      setIndex((value) => {
        if (value >= lastIndex) {
          setPlaying(false);
          return value;
        }
        return value + 1;
      });
    }, delay);
    return () => window.clearTimeout(timer);
  }, [playing, index, lastIndex, speed]);

  useEffect(() => {
    if (!startedAt) return;
    const timer = window.setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 250);
    return () => window.clearInterval(timer);
  }, [startedAt]);

  useEffect(() => {
    if (!finished) return;
    const key = `${algorithm}-${array.join(',')}`;
    if (completed.current === key) return;
    completed.current = key;
    setPlaying(false);
    if (verifySorted(step.array)) {
      completeSort(algorithm, step.comparisons, step.swaps);
      if (compare && verifySorted(secondStep.array)) {
        completeSort(compareWith, secondStep.comparisons, secondStep.swaps);
      }
      pushToast(`排序完成：比较 ${step.comparisons} 次，交换 ${step.swaps} 次`, 'success');
    }
  }, [finished, algorithm, array, compare, compareWith, completeSort, pushToast, secondStep, step]);

  function newArray(nextSize = size, nextDistribution = distribution) {
    setArray(makeRandomArray(nextSize, nextDistribution));
    setIndex(0);
    setPlaying(false);
    completed.current = '';
  }

  function reset() {
    setIndex(0);
    setPlaying(false);
    completed.current = '';
  }

  function play() {
    if (finished) reset();
    if (!startedAt) setStartedAt(Date.now());
    setPlaying((value) => !value);
  }

  function stepOnce() {
    if (!startedAt) setStartedAt(Date.now());
    setPlaying(false);
    setIndex((value) => Math.min(lastIndex, value + 1));
  }

  async function runBenchmark() {
    if (benching) return;
    setBenching(true);
    setBench([]);
    const sample = makeRandomArray(array.length || size, 'random');
    const rows: BenchRow[] = [];
    for (const algo of SORT_ALGORITHMS) {
      // 让出一帧，避免 8 个算法连续同步执行把界面完全卡住。
      await new Promise<void>((resolve) => window.setTimeout(resolve, 0));
      const started = performance.now();
      const result = generateSortSteps(algo.id, sample, { maxFrames: 4000 });
      rows.push({
        id: algo.id,
        name: algo.name,
        ms: Math.round((performance.now() - started) * 10) / 10,
        comparisons: result.comparisons,
        swaps: result.swaps,
        frames: result.steps.length,
        frameEvery: result.frameEvery,
      });
      setBench([...rows]);
    }
    setBenching(false);
  }

  const max = Math.max(...array, 1);
  const donePercent = Math.min(100, Math.round(((index + 1) / run.steps.length) * 100));

  return (
    <div className="page sort-page">
      <PageHeader
        eyebrow="LEARN / ALGORITHM"
        title="排序算法实验室"
        description="把数据动起来：逐帧观察比较、交换与归位，再用指标对比不同算法的代价。"
        actions={
          <>
            <Button
              variant={compare ? 'primary' : 'default'}
              icon="gitBranch"
              onClick={() => setCompare((value) => !value)}
            >
              {compare ? '关闭对比' : '双栏对比'}
            </Button>
            <Button icon="shuffle" onClick={() => newArray()}>
              换一组数据
            </Button>
          </>
        }
      />

      <div className="sort-layout">
        <div className="sort-main">
          <Card className="sort-toolbar">
            <div className="sort-controls">
              <div className="field">
                <span className="field-label">数据规模 · {size}</span>
                <input
                  type="range"
                  min={10}
                  max={500}
                  step={10}
                  value={size}
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setSize(value);
                    newArray(value, distribution);
                  }}
                />
                <span className="field-hint">
                  {size > 120
                    ? '大数组模式：动画按帧抽样，柱状图按桶聚合'
                    : '10–500 个元素，超过 120 自动开启降采样'}
                </span>
              </div>
              <div className="segmented">
                {DISTRIBUTIONS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={distribution === item.id ? 'is-active' : ''}
                    onClick={() => {
                      setDistribution(item.id);
                      newArray(size, item.id);
                    }}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
              <div className="segmented speed-seg">
                {[0.5, 1, 2, 4, 10].map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={speed === value ? 'is-active' : ''}
                    onClick={() => setSpeed(value)}
                  >
                    {value}x
                  </button>
                ))}
              </div>
            </div>
            <div className="sort-actions">
              <Button variant="primary" icon={playing ? 'pause' : 'play'} onClick={play}>
                {playing ? '暂停' : '播放'}
              </Button>
              <Button icon="step" onClick={stepOnce} disabled={finished}>
                单步
              </Button>
              <Button icon="reset" onClick={reset}>
                重置
              </Button>
              <span className="sort-clock">
                <Icon name="clock" size={13} /> {formatClock(elapsed)}
              </span>
            </div>
          </Card>

          <Card className="visualizer-card">
            <div className="visualizer-head">
              <div>
                <div className="row">
                  <span className="algo-dot" style={{ background: primary.color }} />
                  <h3>{primary.name}</h3>
                  <Badge tone="neutral">{primary.complexity}</Badge>
                </div>
                <p>{primary.summary}</p>
              </div>
              <div className="visualizer-progress">
                <span>{donePercent}%</span>
                <div className="progress">
                  <span style={{ width: `${donePercent}%` }} />
                </div>
              </div>
            </div>
            <div className="bars-wrap">
              <Bars
                array={step.array}
                comparing={step.comparing}
                swapping={step.swapping}
                sorted={step.sorted}
                pivot={step.pivot}
                max={max}
              />
            </div>
            <div className="legend-row">
              <span><i className="legend-swatch is-comparing" /> 比较中</span>
              <span><i className="legend-swatch is-swapping" /> 交换中</span>
              <span><i className="legend-swatch is-sorted" /> 已就位</span>
              <span><i className="legend-swatch is-pivot" /> 基准</span>
            </div>
          </Card>

          {compare ? (
            <Card className="visualizer-card compare-card">
              <div className="visualizer-head">
                <div>
                  <div className="row">
                    <span className="algo-dot" style={{ background: secondary.color }} />
                    <h3>{secondary.name}</h3>
                    <Badge tone="neutral">{secondary.complexity}</Badge>
                  </div>
                  <p>{secondary.summary}</p>
                </div>
                <div className="visualizer-progress">
                  <span>{Math.round(((index + 1) / secondRun.steps.length) * 100)}%</span>
                  <div className="progress">
                    <span style={{ width: `${Math.round(((index + 1) / secondRun.steps.length) * 100)}%` }} />
                  </div>
                </div>
              </div>
              <div className="bars-wrap">
                <Bars
                  array={secondStep.array}
                  comparing={secondStep.comparing}
                  swapping={secondStep.swapping}
                  sorted={secondStep.sorted}
                  pivot={secondStep.pivot}
                  max={max}
                />
              </div>
            </Card>
          ) : null}

          <div className="sort-metrics">
            <Card className="metric-card">
              <span>比较次数</span>
              <strong>{step.comparisons}</strong>
            </Card>
            <Card className="metric-card">
              <span>交换 / 写入</span>
              <strong>{step.swaps}</strong>
            </Card>
            <Card className="metric-card">
              <span>递归深度</span>
              <strong>{step.depth}</strong>
            </Card>
            <Card className="metric-card">
              <span>当前帧</span>
              <strong>
                {index + 1}
                <em>/ {run.steps.length}</em>
              </strong>
            </Card>
          </div>

          <div className="sort-detail-grid">
            <Card>
              <SectionTitle title="伪代码" hint="高亮行跟随执行" />
              <div className="pseudo-code">
                {primary.code.map((line, lineIndex) => (
                  <div key={lineIndex} className={step.line === lineIndex + 1 ? 'is-active' : ''}>
                    <span>{lineIndex + 1}</span>
                    <code>{line || ' '}</code>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle title="要点" hint={`${primary.en} / ${primary.stable ? '稳定' : '不稳定'}`} />
              <ul className="bullet-list">
                {primary.pseudo.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
              <div className="complexity-row">
                <div>
                  <span>平均时间</span>
                  <strong>{primary.complexity}</strong>
                </div>
                <div>
                  <span>额外空间</span>
                  <strong>{primary.space}</strong>
                </div>
                <div>
                  <span>稳定性</span>
                  <strong>{primary.stable ? '稳定' : '不稳定'}</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>

        <aside className="sort-side">
          <Card>
            <SectionTitle title="算法" hint="选一个观察它的节奏" />
            <div className="algo-list">
              {SORT_ALGORITHMS.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={clsx('algo-item', algorithm === item.id && 'is-active')}
                  onClick={() => setAlgorithm(item.id)}
                >
                  <span className="algo-dot" style={{ background: item.color }} />
                  <span className="algo-copy">
                    <strong>{item.name}</strong>
                    <small>{item.en}</small>
                  </span>
                  <em>{item.complexity}</em>
                </button>
              ))}
            </div>
          </Card>
          {compare ? (
            <Card>
              <SectionTitle title="对比对象" hint="另一条执行路径" />
              <select
                className="select"
                value={compareWith}
                onChange={(event) => setCompareWith(event.target.value as SortAlgorithmId)}
              >
                {SORT_ALGORITHMS.filter((item) => item.id !== algorithm).map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} · {item.complexity}
                  </option>
                ))}
              </select>
              <div className="compare-note">
                <Icon name="info" size={14} />
                两栏共享同一组数据与播放进度，便于同步观察差异。
              </div>
            </Card>
          ) : null}
          <Card>
            <SectionTitle title="性能基准" hint={`${size} 元素 · 8 算法`} />
            <div className="bench-list">
              {bench === null ? (
                <p className="bench-empty">
                  用当前数据规模给 8 个算法各跑一次，记录生成耗时、比较/交换次数与动画帧数。
                  把规模拉到 500 可以观察 O(n²) 与 O(n log n) 的差距。
                </p>
              ) : (
                bench.map((row) => (
                  <div className="bench-row" key={row.id}>
                    <span className="bench-name">{row.name}</span>
                    <span className="bench-ms">{row.ms} ms</span>
                    <span className="bench-detail">
                      比较 {row.comparisons} · 交换 {row.swaps} · 帧 {row.frames}
                      {row.frameEvery > 1 ? ` · 每 ${row.frameEvery} 步取 1 帧` : ''}
                    </span>
                  </div>
                ))
              )}
              {benching ? <p className="bench-empty">跑分中…</p> : null}
            </div>
            <Button
              icon="spark"
              onClick={runBenchmark}
              disabled={benching}
              style={{ marginTop: 10 }}
            >
              {benching ? '跑分中…' : '跑一次性能基准'}
            </Button>
          </Card>
          <Card className="sort-tip">
            <div className="sort-tip-icon">
              <Icon name="spark" size={18} />
            </div>
            <strong>看懂一个算法</strong>
            <p>先单步走 5 帧，观察比较与交换的颜色变化，再按 2x 播放整体节奏。</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
