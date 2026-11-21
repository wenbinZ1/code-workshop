import { useEffect, useMemo, useRef, useState } from 'react';
import clsx from 'clsx';
import { Badge, Button, Card, PageHeader, SectionTitle } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { Sparkline } from '@/components/ui/primitives';
import { useAppStore } from '@/stores/appStore';
import { useUiStore } from '@/stores/uiStore';
import { formatClock, relativeTime } from '@/lib/time';
import type { AppEvent } from '@/types';

type ModuleStatus = 'running' | 'starting' | 'stopped' | 'error' | 'unknown';

interface ModuleItem {
  id: string;
  name: string;
  hint: string;
  status: ModuleStatus;
  cpu: number;
  memory: number;
  fps: number;
  uptime: number;
  spark: number[];
}

const INITIAL_MODULES: ModuleItem[] = [
  { id: 'shell', name: '工作台外壳', hint: '窗口 / 导航 / 主题', status: 'running', cpu: 2.4, memory: 186, fps: 60, uptime: 7620, spark: [42, 46, 44, 51, 48, 54, 52] },
  { id: 'sort', name: '排序实验室', hint: '可视化画布 · 8 算法', status: 'running', cpu: 8.6, memory: 94, fps: 58, uptime: 2140, spark: [55, 60, 58, 66, 62, 70, 68] },
  { id: 'grammar', name: 'Python 语法闯关', hint: '关卡引擎 / 判题', status: 'running', cpu: 3.1, memory: 72, fps: 60, uptime: 1840, spark: [32, 36, 34, 40, 38, 42, 41] },
  { id: 'forge', name: '项目工坊', hint: '模板 / 看板 / 快照', status: 'running', cpu: 4.8, memory: 118, fps: 60, uptime: 960, spark: [40, 44, 47, 45, 50, 48, 53] },
  { id: 'ai', name: 'AI 训练场', hint: '提示词 / 工作流', status: 'stopped', cpu: 0, memory: 0, fps: 0, uptime: 0, spark: [0, 0, 0, 0, 0, 0, 0] },
  { id: 'growth', name: '成长档案', hint: '雷达 / 周报', status: 'stopped', cpu: 0, memory: 0, fps: 0, uptime: 0, spark: [0, 0, 0, 0, 0, 0, 0] },
  { id: 'data', name: '本地数据服务', hint: 'SQLite / 事件库', status: 'running', cpu: 1.2, memory: 44, fps: 0, uptime: 7620, spark: [18, 20, 19, 21, 20, 22, 21] },
  { id: 'monitor', name: '监控边车', hint: '心跳 / 指标 / 日志', status: 'running', cpu: 3.8, memory: 58, fps: 0, uptime: 7620, spark: [28, 30, 32, 31, 34, 33, 35] },
];

const STATUS_LABEL: Record<ModuleStatus, string> = {
  running: '运行中',
  starting: '启动中',
  stopped: '已停止',
  error: '异常',
  unknown: '未知',
};

const LEVEL_TONE: Record<AppEvent['level'], 'success' | 'warn' | 'danger' | 'blue'> = {
  success: 'success',
  warn: 'warn',
  error: 'danger',
  info: 'blue',
};

interface LogLine {
  id: string;
  at: string;
  level: 'INFO' | 'WARN' | 'ERROR';
  source: string;
  message: string;
}

function seedLogs(): LogLine[] {
  const now = Date.now();
  return [
    ['INFO', 'shell', '工作台已就绪，加载 8 个模块'],
    ['INFO', 'sort', '排序画布初始化完成，当前算法 bubble'],
    ['SUCCESS', 'grammar', '关卡 py-1-1 判定通过 · 5/5 任务'],
    ['WARN', 'monitor', '天气查询工具心跳丢失，进入退避重试'],
    ['INFO', 'forge', '阶段 A 基线快照已生成'],
    ['ERROR', 'monitor', '天气查询工具连续 3 次健康检查失败'],
    ['INFO', 'data', 'SQLite WAL checkpoint 完成'],
    ['INFO', 'forge', '看板任务状态已持久化'],
  ].map(([level, source, message], index) => ({
    id: `seed-log-${index}`,
    at: new Date(now - (index + 1) * 1000 * 60 * 7).toISOString(),
    level: level === 'SUCCESS' ? 'INFO' : (level as LogLine['level']),
    source,
    message,
  }));
}

export function MonitorPage() {
  const projects = useAppStore((state) => state.projects);
  const events = useAppStore((state) => state.events);
  const pushToast = useUiStore((state) => state.pushToast);
  const [modules, setModules] = useState(INITIAL_MODULES);
  const [logs, setLogs] = useState<LogLine[]>(seedLogs);
  const [levelFilter, setLevelFilter] = useState<'ALL' | 'INFO' | 'WARN' | 'ERROR'>('ALL');
  const [search, setSearch] = useState('');
  const [auto, setAuto] = useState(true);
  const [tick, setTick] = useState(0);
  const logsRef = useRef(logs);
  logsRef.current = logs;

  useEffect(() => {
    if (!auto) return;
    const timer = window.setInterval(() => {
      setTick((value) => value + 1);
      setModules((items) =>
        items.map((item) => {
          if (item.status !== 'running') return item;
          const drift = (Math.random() - 0.5) * 2;
          return {
            ...item,
            cpu: Math.max(0.4, Math.min(24, item.cpu + drift)),
            memory: Math.max(20, Math.min(320, item.memory + drift * 2)),
            fps: item.fps ? Math.max(52, Math.min(60, item.fps + (Math.random() > 0.5 ? 1 : -1))) : 0,
            uptime: item.uptime + 2,
            spark: [...item.spark.slice(1), Math.max(10, Math.min(90, (item.spark[item.spark.length - 1] ?? 40) + drift * 4))],
          };
        }),
      );
    }, 2200);
    return () => window.clearInterval(timer);
  }, [auto]);

  function addLog(level: LogLine['level'], source: string, message: string) {
    setLogs((items) => [
      { id: `log-${Date.now()}-${Math.random()}`, at: new Date().toISOString(), level, source, message },
      ...items,
    ].slice(0, 120));
  }

  function changeModule(id: string, action: 'start' | 'stop' | 'restart') {
    const module = modules.find((item) => item.id === id);
    if (!module) return;
    if (action === 'stop') {
      setModules((items) => items.map((item) => (item.id === id ? { ...item, status: 'stopped', cpu: 0, fps: 0, uptime: 0 } : item)));
      addLog('WARN', id, '收到手动停止指令，进程已退出');
      pushToast(`${module.name} 已停止`, 'info');
      return;
    }
    setModules((items) => items.map((item) => (item.id === id ? { ...item, status: 'starting' } : item)));
    addLog('INFO', id, action === 'restart' ? '收到重启指令，正在拉起进程' : '收到启动指令，正在拉起进程');
    window.setTimeout(() => {
      setModules((items) =>
        items.map((item) =>
          item.id === id
            ? { ...item, status: 'running', cpu: 2.1, memory: 48, fps: item.fps ? 60 : 0, uptime: 1 }
            : item,
        ),
      );
      addLog('INFO', id, '进程启动成功，健康检查通过');
      pushToast(`${module.name} 已启动`, 'success');
    }, 900);
  }

  function simulateError() {
    const running = modules.filter((item) => item.status === 'running');
    const target = running[Math.floor(Math.random() * running.length)];
    if (!target) return;
    setModules((items) => items.map((item) => (item.id === target.id ? { ...item, status: 'error', cpu: 0, fps: 0 } : item)));
    addLog('ERROR', target.id, '健康检查连续 3 次失败，标记为异常');
    pushToast(`${target.name} 模拟异常，可在卡片内重试`, 'error');
  }

  const filteredLogs = logs.filter((log) => {
    const levelOk = levelFilter === 'ALL' || log.level === levelFilter;
    const text = `${log.source} ${log.message}`.toLowerCase();
    return levelOk && (!search || text.includes(search.toLowerCase()));
  });

  const running = modules.filter((item) => item.status === 'running').length;
  const errors = modules.filter((item) => item.status === 'error').length;
  const memory = Math.round(modules.reduce((sum, item) => sum + item.memory, 0));
  const onlineProjects = projects.filter((project) => project.status === 'running').length;

  const timeline = useMemo(() => events.slice(0, 8), [events]);

  return (
    <div className="page monitor-page">
      <PageHeader
        eyebrow="OBSERVE / RUNTIME"
        title="项目运行监控台"
        description="统一查看模块状态、进程指标、日志与异常事件。演示环境使用本地模拟数据，接入真实进程后可替换采集层。"
        actions={
          <>
            <Badge tone={errors ? 'danger' : 'success'} dot>
              {errors ? `${errors} 个异常` : '全部健康'}
            </Badge>
            <Button icon="refresh" onClick={() => { setTick((v) => v + 1); pushToast('指标已刷新', 'success'); }}>刷新</Button>
            <Button icon="alert" variant="ghost" onClick={simulateError}>模拟异常</Button>
          </>
        }
      />

      <div className="monitor-kpis">
        <Card className="monitor-kpi">
          <span>模块</span>
          <strong>{running}<em>/ {modules.length}</em></strong>
          <small>运行中</small>
        </Card>
        <Card className="monitor-kpi">
          <span>本地项目</span>
          <strong>{onlineProjects}<em>/ {projects.length}</em></strong>
          <small>运行中</small>
        </Card>
        <Card className="monitor-kpi">
          <span>内存占用</span>
          <strong>{memory}<em>MB</em></strong>
          <small>全部模块</small>
        </Card>
        <Card className="monitor-kpi">
          <span>自动刷新</span>
          <strong>{auto ? 'ON' : 'OFF'}</strong>
          <button type="button" className={`toggle ${auto ? 'is-on' : ''}`} onClick={() => setAuto((value) => !value)} aria-pressed={auto}>
            <i />
          </button>
        </Card>
      </div>

      <div className="monitor-layout">
        <div className="monitor-main">
          <SectionTitle
            title="模块状态"
            hint="启动 / 停止 / 重启 · 健康检查"
            actions={<span className="monitor-tick">刷新 #{tick}</span>}
          />
          <div className="module-grid">
            {modules.map((module) => (
              <Card className={`module-card is-${module.status}`} key={module.id}>
                <div className="module-head">
                  <div className="module-name">
                    <span className={`status-dot ${module.status}`} />
                    <div>
                      <strong>{module.name}</strong>
                      <span>{module.hint}</span>
                    </div>
                  </div>
                  <Badge tone={module.status === 'running' ? 'success' : module.status === 'error' ? 'danger' : 'neutral'} dot>
                    {STATUS_LABEL[module.status]}
                  </Badge>
                </div>
                <div className="module-metrics">
                  <div>
                    <span>CPU</span>
                    <strong>{Math.round(module.cpu * 10) / 10}%</strong>
                  </div>
                  <div>
                    <span>内存</span>
                    <strong>{Math.round(module.memory)}MB</strong>
                  </div>
                  <div>
                    <span>{module.fps ? 'FPS' : '运行'}</span>
                    <strong>{module.fps ? module.fps : formatClock(module.uptime)}</strong>
                  </div>
                  <Sparkline values={module.spark} width={76} height={22} color={module.status === 'error' ? 'var(--red)' : 'var(--accent)'} />
                </div>
                <div className="module-actions">
                  <button type="button" onClick={() => changeModule(module.id, 'start')} disabled={module.status === 'running'}>启动</button>
                  <button type="button" onClick={() => changeModule(module.id, 'stop')} disabled={module.status !== 'running'}>停止</button>
                  <button type="button" onClick={() => changeModule(module.id, 'restart')}>重启</button>
                </div>
              </Card>
            ))}
          </div>

          <Card className="log-card">
            <SectionTitle
              title="日志中心"
              hint={`${filteredLogs.length} 条 · 按级别与关键词过滤`}
              actions={
                <div className="log-actions">
                  <div className="segmented">
                    {(['ALL', 'INFO', 'WARN', 'ERROR'] as const).map((level) => (
                      <button key={level} type="button" className={levelFilter === level ? 'is-active' : ''} onClick={() => setLevelFilter(level)}>
                        {level}
                      </button>
                    ))}
                  </div>
                  <div className="search-input search-sm">
                    <Icon name="search" size={14} />
                    <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索日志…" />
                  </div>
                </div>
              }
            />
            <div className="log-console">
              {filteredLogs.map((log) => (
                <div className={`log-line is-${log.level.toLowerCase()}`} key={log.id}>
                  <span>{new Date(log.at).toLocaleTimeString('zh-CN', { hour12: false })}</span>
                  <em>{log.level}</em>
                  <b>{log.source}</b>
                  <p>{log.message}</p>
                </div>
              ))}
              {filteredLogs.length === 0 ? <div className="log-empty">没有匹配的日志</div> : null}
            </div>
          </Card>
        </div>

        <aside className="monitor-side">
          <Card>
            <SectionTitle title="事件时间线" hint="启动 / 停止 / 崩溃 / 重启" />
            <div className="timeline">
              {timeline.map((event) => (
                <div className="timeline-item" key={event.id}>
                  <span className={`timeline-dot ${event.level}`} />
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.detail}</span>
                  </div>
                  <em>{relativeTime(event.at)}</em>
                </div>
              ))}
            </div>
          </Card>
          <Card>
            <SectionTitle title="健康检查规则" hint="与 manifest 约定一致" />
            <ul className="bullet-list">
              <li>每 5 秒轮询一次 <code>/health</code></li>
              <li>连续 3 次失败标记为异常</li>
              <li>异常后按 1s → 2s → 4s 退避</li>
              <li>重启上限 30s，仍失败则等待人工处理</li>
            </ul>
            <div className="health-legend">
              {(['running', 'starting', 'stopped', 'error'] as ModuleStatus[]).map((status) => (
                <span key={status}><i className={`status-dot ${status}`} />{STATUS_LABEL[status]}</span>
              ))}
            </div>
          </Card>
          <Card className="monitor-note">
            <Icon name="info" size={15} />
            <p>演示数据只在本页模拟，不会写入持久化事件库；真实接入点见项目文档 9.2 / 9.3。</p>
          </Card>
        </aside>
      </div>
    </div>
  );
}
