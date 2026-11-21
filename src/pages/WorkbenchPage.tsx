import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import clsx from 'clsx';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { Badge, Button, Card, PageHeader, Progress, Ring, SectionTitle, Sparkline } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { EChart, baseTooltip, useChartTheme } from '@/components/charts/EChart';
import { Heatmap } from '@/components/charts/Heatmap';
import { useAppStore, levelOfXp, xpIntoLevel } from '@/stores/appStore';
import { useUiStore } from '@/stores/uiStore';
import { CURRICULUM } from '@/data/curriculum';
import { buildDailyQuests } from '@/lib/gamification';
import { dateKey, lastNDays, longestStreakOf, relativeTime, shortDate, streakOf, todayMinutes } from '@/lib/time';
import type { SkillScores } from '@/types';

const SKILL_LABELS: Array<[keyof SkillScores, string]> = [
  ['algorithm', '算法基础'],
  ['language', '语言熟练度'],
  ['engineering', '工程能力'],
  ['ai', 'AI 协作'],
  ['system', '系统设计'],
  ['product', '产品思维'],
];

function statusTone(status: string) {
  if (status === 'running') return 'success';
  if (status === 'error') return 'danger';
  if (status === 'done') return 'accent';
  return 'neutral';
}

export function WorkbenchPage() {
  const navigate = useNavigate();
  const theme = useChartTheme();
  const nickname = useAppStore((state) => state.nickname);
  const xp = useAppStore((state) => state.xp);
  const days = useAppStore((state) => state.studyMinutes);
  const events = useAppStore((state) => state.events);
  const projects = useAppStore((state) => state.projects);
  const skills = useAppStore((state) => state.skills);
  const sessions = useAppStore((state) => state.sessions);
  const goals = useAppStore((state) => state.goals);
  const levelProgress = useAppStore((state) => state.levelProgress);
  const sortingRecords = useAppStore((state) => state.sortingRecords);
  const aiMessages = useAppStore((state) => state.aiMessages);
  const questClaims = useAppStore((state) => state.questClaims);
  const claimQuest = useAppStore((state) => state.actions.claimQuest);
  const pushToast = useUiStore((state) => state.pushToast);

  const level = levelOfXp(xp);
  const into = xpIntoLevel(xp);
  const today = todayMinutes(days);
  const streak = streakOf(days);
  const longest = longestStreakOf(days);
  const running = projects.filter((project) => project.status === 'running').length;
  const passedLevels = Object.values(levelProgress).filter((p) => p.passed).length;
  const sortDone = Object.values(sortingRecords).filter((r) => r.completed).length;
  const last7 = lastNDays(7).map((key) => days[key] ?? 0);
  const last14 = lastNDays(14);
  const lineValues = last14.map((key) => days[key] ?? 0);
  const dateLabels = last14.map(shortDate);

  const nextLevel = useMemo(() => {
    for (const chapter of CURRICULUM) {
      for (const levelItem of chapter.levels) {
        if (!levelProgress[levelItem.id]?.passed) return { chapter, level: levelItem };
      }
    }
    return null;
  }, [levelProgress]);

  const onlineProjects = projects.filter((project) => project.status !== 'done').slice(0, 3);
  const activeGoals = goals.slice(0, 3);

  const todayKey = dateKey();
  const todayLevels = Object.values(levelProgress).filter(
    (item) => item.passed && item.bestAt && dateKey(new Date(item.bestAt)) === todayKey,
  ).length;
  const todaySorts = Object.values(sortingRecords).filter(
    (item) => item.completed && dateKey(new Date(item.at)) === todayKey,
  ).length;
  const todayAi = aiMessages.filter(
    (message) => message.role === 'user' && dateKey(new Date(message.at)) === todayKey,
  ).length;
  const dailyQuests = useMemo(
    () => buildDailyQuests({ minutes: today, levels: todayLevels, sorts: todaySorts, aiMessages: todayAi }),
    [today, todayLevels, todaySorts, todayAi],
  );
  const claimedToday = questClaims[todayKey] ?? [];

  const lineOption = useMemo<EChartsOption>(
    () => ({
      animationDuration: 900,
      grid: { left: 34, right: 14, top: 18, bottom: 26 },
      tooltip: {
        ...baseTooltip(theme),
        trigger: 'axis',
        axisPointer: { type: 'line', lineStyle: { color: theme.border } },
        formatter: (params: unknown) => {
          const list = params as Array<{ axisValue: string; value: number }>;
          const item = list[0];
          return `${item.axisValue}<br/><b style="color:${theme.accent}">${item.value} 分钟</b>`;
        },
      },
      xAxis: {
        type: 'category',
        data: dateLabels,
        boundaryGap: false,
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { show: false },
        axisLabel: { color: theme.faint, fontSize: 9, interval: 2 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: theme.grid } },
        axisLabel: { color: theme.faint, fontSize: 9 },
      },
      series: [
        {
          type: 'line',
          data: lineValues,
          smooth: 0.35,
          showSymbol: false,
          lineStyle: { width: 2.2, color: theme.accent },
          itemStyle: { color: theme.accent },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: theme.accentSoft },
              { offset: 1, color: 'rgba(0,0,0,0)' },
            ]),
          },
          markPoint: {
            symbol: 'circle',
            symbolSize: 5,
            data: [{ type: 'max', name: '峰值' }],
            itemStyle: { color: theme.accent, borderColor: theme.panel, borderWidth: 2 },
            label: { show: false },
          },
        },
      ],
    }),
    [dateLabels, lineValues, theme],
  );

  const radarOption = useMemo<EChartsOption>(
    () => ({
      animationDuration: 800,
      tooltip: { ...baseTooltip(theme), trigger: 'item' },
      legend: {
        bottom: 0,
        itemWidth: 8,
        itemHeight: 8,
        textStyle: { color: theme.muted, fontSize: 10 },
        data: ['本周', '上月'],
      },
      radar: {
        center: ['50%', '46%'],
        radius: '64%',
        splitNumber: 4,
        indicator: SKILL_LABELS.map(([, label]) => ({ name: label, max: 100 })),
        axisName: { color: theme.muted, fontSize: 9.5 },
        splitLine: { lineStyle: { color: theme.grid } },
        splitArea: { areaStyle: { color: ['transparent', 'rgba(255,255,255,0.012)'] } },
        axisLine: { lineStyle: { color: theme.grid } },
      },
      series: [
        {
          type: 'radar',
          symbolSize: 3.5,
          data: [
            {
              name: '本周',
              value: SKILL_LABELS.map(([key]) => skills[key]),
              lineStyle: { color: theme.accent, width: 2 },
              itemStyle: { color: theme.accent },
              areaStyle: { color: theme.accentSoft },
            },
            {
              name: '上月',
              value: SKILL_LABELS.map(([key]) => Math.max(8, skills[key] - [8, 7, 6, 5, 4, 3][SKILL_LABELS.findIndex(([k]) => k === key)])),
              lineStyle: { color: theme.faint, width: 1.2, type: 'dashed' },
              itemStyle: { color: theme.faint },
              areaStyle: { color: 'rgba(0,0,0,0)' },
            },
          ],
        },
      ],
    }),
    [skills, theme],
  );

  const moduleNames: Record<string, string> = {
    grammar: '语法闯关',
    sort: '排序实验室',
    project: '项目工坊',
    forge: '项目工坊',
    ai: 'AI 训练场',
    monitor: '监控台',
    growth: '成长档案',
  };
  const moduleTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const session of sessions.slice(0, 60)) {
      const key = moduleNames[session.module] ?? session.module;
      totals[key] = (totals[key] ?? 0) + session.minutes;
    }
    if (Object.keys(totals).length === 0) {
      totals['语法闯关'] = 1;
    }
    return Object.entries(totals).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [sessions]);

  const barOption = useMemo<EChartsOption>(
    () => ({
      animationDuration: 800,
      grid: { left: 76, right: 24, top: 10, bottom: 10 },
      tooltip: { ...baseTooltip(theme), trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: { type: 'value', show: false },
      yAxis: {
        type: 'category',
        inverse: true,
        data: moduleTotals.map(([name]) => name),
        axisLine: { show: false },
        axisTick: { show: false },
        axisLabel: { color: theme.muted, fontSize: 10 },
      },
      series: [
        {
          type: 'bar',
          data: moduleTotals.map(([, value]) => value),
          barWidth: 9,
          itemStyle: {
            borderRadius: 5,
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: theme.accent },
              { offset: 1, color: theme.green },
            ]),
          },
          label: {
            show: true,
            position: 'right',
            color: theme.faint,
            fontSize: 9,
            formatter: '{c}m',
          },
        },
      ],
    }),
    [moduleTotals, theme],
  );

  return (
    <div className="page workbench-page">
      <section className="wb-hero">
        <div className="wb-hero-copy">
          <div className="eyebrow">WORKBENCH / {new Date().toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</div>
          <h1>
            早上好，{nickname}
            <span className="wb-hero-dot" />
          </h1>
          <p>
            {streak > 0 ? (
              <>
                今天继续把
                <strong> {nextLevel ? `「${nextLevel.level.title}」` : '项目收尾'}</strong>
                收个尾。你已经连续学习 {streak} 天，保持这个节奏。
              </>
            ) : (
              <>
                从今天开始记录成长：先完成
                <strong>「{nextLevel?.level.title ?? '第一个关卡'}」</strong>
                ，学习曲线就会亮起来。
              </>
            )}
          </p>
          <div className="wb-hero-actions">
            <Button variant="primary" icon="bolt" onClick={() => navigate(nextLevel ? `/grammar/${nextLevel.chapter.id}/${nextLevel.level.id}` : '/grammar')}>
              继续学习
            </Button>
            <Button icon="layers" onClick={() => navigate('/forge')}>
              打开项目工坊
            </Button>
            <Badge tone="success" dot>
              {xp === 0 ? '全新档案' : '本地档案'}
            </Badge>
          </div>
        </div>
        <div className="wb-hero-orbit" aria-hidden="true">
          <div className="orbit-ring orbit-ring-1" />
          <div className="orbit-ring orbit-ring-2" />
          <div className="orbit-core">
            <strong>Lv.{level}</strong>
            <span>{into}/100</span>
          </div>
          <span className="orbit-chip orbit-chip-a">PY</span>
          <span className="orbit-chip orbit-chip-b">SORT</span>
          <span className="orbit-chip orbit-chip-c">AI</span>
        </div>
      </section>

      <section className="wb-kpis">
        <Card className="kpi-card">
          <Ring value={into} size={72} stroke={7} label={`Lv.${level}`} sub="等级" />
          <div className="kpi-copy">
            <span className="kpi-label">当前等级</span>
            <strong className="kpi-value">
              {xp.toLocaleString('zh-CN')}
              <em>XP</em>
            </strong>
            <span className="kpi-hint">
              {into}/100 · 距 Lv.{level + 1} 还差 {100 - into} XP
            </span>
            <Sparkline values={last7} width={120} height={24} />
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon" style={{ color: 'var(--green)' }}>
            <Icon name="clock" size={18} />
          </div>
          <div className="kpi-copy">
            <span className="kpi-label">今日学习</span>
            <strong className="kpi-value">
              {today}
              <em>分钟</em>
            </strong>
            <span className="kpi-hint">
              {today === 0
                ? '今天还没有学习记录'
                : `比昨日 ${today >= (last7[last7.length - 2] ?? 0) ? '更多' : '略少'}`} · 目标 60 分钟
            </span>
            <Sparkline values={last7} width={120} height={24} color="var(--green)" />
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon" style={{ color: 'var(--amber)' }}>
            <Icon name="bolt" size={18} />
          </div>
          <div className="kpi-copy">
            <span className="kpi-label">连续学习</span>
            <strong className="kpi-value">
              {streak}
              <em>天</em>
            </strong>
            <span className="kpi-hint">历史最长 {longest} 天</span>
            <div className="streak-dots">
              {Array.from({ length: 7 }).map((_, index) => (
                <i key={index} className={index < Math.min(7, streak) ? 'is-on' : ''} />
              ))}
            </div>
          </div>
        </Card>
        <Card className="kpi-card">
          <div className="kpi-icon" style={{ color: 'var(--blue)' }}>
            <Icon name="activity" size={18} />
          </div>
          <div className="kpi-copy">
            <span className="kpi-label">运行中的项目</span>
            <strong className="kpi-value">
              {running}
              <em>/ {projects.length}</em>
            </strong>
            <span className="kpi-hint">
              {projects.length - running} 个待启动 · 本地监控
            </span>
            <div className="status-dots">
              {projects.slice(0, 6).map((project) => (
                <i key={project.id} className={`status-dot ${project.status}`} title={project.title} />
              ))}
            </div>
          </div>
        </Card>
      </section>

      <section className="wb-quests">
        <Card className="quest-panel">
          <SectionTitle
            title="今日任务"
            hint="每天 0 点刷新 · 完成后手动领取 XP"
            actions={
              <Badge tone="accent" dot>
                {claimedToday.length}/{dailyQuests.length} 已领取
              </Badge>
            }
          />
          <div className="quest-grid">
            {dailyQuests.map((quest) => {
              const claimed = claimedToday.includes(quest.id);
              return (
                <div className={clsx('quest-item', quest.done && 'is-done', claimed && 'is-claimed')} key={quest.id}>
                  <span className="quest-icon">
                    <Icon name={claimed ? 'check' : quest.icon} size={17} />
                  </span>
                  <div className="quest-copy">
                    <strong>{quest.title}</strong>
                    <span>{quest.hint}</span>
                    <Progress
                      value={Math.min(quest.current, quest.target)}
                      max={quest.target}
                      tone={quest.done ? 'green' : 'blue'}
                    />
                  </div>
                  <Button
                    size="sm"
                    variant={claimed ? 'ghost' : quest.done ? 'primary' : 'ghost'}
                    disabled={!quest.done || claimed}
                    onClick={() => {
                      claimQuest(quest.id, quest.xp, quest.title);
                      pushToast(`已领取「${quest.title}」 +${quest.xp} XP`, 'success');
                    }}
                  >
                    {claimed ? '已领取' : quest.done ? `+${quest.xp} XP` : `${quest.current}/${quest.target}`}
                  </Button>
                </div>
              );
            })}
          </div>
        </Card>
      </section>

      <section className="wb-chart-row">
        <Card className="wb-chart-card">
          <SectionTitle
            title="学习时长趋势"
            hint="近 14 天 · 每日分钟"
            actions={<Badge tone="accent">{lineValues.reduce((a, b) => a + b, 0)} 分钟</Badge>}
          />
          <EChart option={lineOption} height={252} />
        </Card>
        <Card className="wb-radar-card">
          <SectionTitle title="六维能力" hint="本周 vs 上月" />
          <EChart option={radarOption} height={272} />
        </Card>
      </section>

      <section className="wb-main-grid">
        <Card className="wb-islands-card">
          <SectionTitle
            title="学习岛"
            hint="把路线走成一张地图"
            actions={<Link to="/grammar" className="text-link">全部关卡 <Icon name="arrowRight" size={13} /></Link>}
          />
          <div className="island-grid">
            <Link to="/sort" className="island-tile">
              <Ring value={(sortDone / 8) * 100} size={54} stroke={5} label={`${sortDone}/8`} sub="算法" color="var(--blue)" />
              <div>
                <strong>排序实验室</strong>
                <span>8 种排序 · 可视化</span>
              </div>
              <Icon name="chevronRight" size={14} />
            </Link>
            <Link to="/grammar" className="island-tile">
              <Ring value={(passedLevels / 50) * 100} size={54} stroke={5} label={`${passedLevels}/50`} sub="关卡" />
              <div>
                <strong>Python 语法闯关</strong>
                <span>10 章 · 50 关</span>
              </div>
              <Icon name="chevronRight" size={14} />
            </Link>
            <div className="island-tile is-locked">
              <Ring value={0} size={54} stroke={5} label="0/8" sub="二期" color="var(--faint)" />
              <div>
                <strong>Go 语法闯关</strong>
                <span>二期开放</span>
              </div>
              <Badge>锁定</Badge>
            </div>
            <div className="island-tile is-locked">
              <Ring value={0} size={54} stroke={5} label="0/8" sub="二期" color="var(--faint)" />
              <div>
                <strong>Java 语法闯关</strong>
                <span>二期开放</span>
              </div>
              <Badge>锁定</Badge>
            </div>
          </div>
        </Card>

        <Card className="wb-focus-card">
          <SectionTitle title="今日建议" hint="按你的进度生成" />
          {nextLevel ? (
            <div className="focus-body">
              <div className="focus-head">
                <span className="focus-index">CH.{String(nextLevel.chapter.index).padStart(2, '0')}</span>
                <Badge tone="accent">{nextLevel.level.xp} XP</Badge>
              </div>
              <h3>{nextLevel.level.title}</h3>
              <p>{nextLevel.level.summary}</p>
              <div className="focus-meta">
                <span>
                  <Icon name="book" size={13} /> {nextLevel.chapter.title}
                </span>
                <span>
                  <Icon name="clock" size={13} /> 5–10 分钟
                </span>
              </div>
              <Button variant="primary" icon="play" onClick={() => navigate(`/grammar/${nextLevel.chapter.id}/${nextLevel.level.id}`)}>
                继续这一关
              </Button>
            </div>
          ) : (
            <div className="focus-body">
              <h3>全部关卡已通关</h3>
              <p>去项目工坊把学到的语法用起来。</p>
              <Button variant="primary" onClick={() => navigate('/forge')}>
                打开项目工坊
              </Button>
            </div>
          )}
          <div className="goal-list">
            {activeGoals.map((goal) => (
              <div className="goal-row" key={goal.id}>
                <div className="row-between">
                  <span>{goal.title}</span>
                  <em>
                    {goal.progress}/{goal.target}
                  </em>
                </div>
                <Progress value={goal.progress} max={goal.target} tone="green" />
              </div>
            ))}
          </div>
        </Card>
      </section>

      <section className="wb-bottom-grid">
        <Card>
          <SectionTitle
            title="学习活跃度"
            hint="近 8 周 · 每格一天"
            actions={<Badge tone="success" dot>连续 {streak} 天</Badge>}
          />
          <Heatmap days={days} weeks={8} />
          <div className="activity-note">
            <Icon name="info" size={13} />
            颜色越亮代表当天学习时间越长；空白是休息日，不断签。
          </div>
        </Card>
        <Card>
          <SectionTitle
            title="最近事件"
            hint="工作台里发生的事"
            actions={<Link to="/monitor" className="text-link">监控台 <Icon name="arrowRight" size={13} /></Link>}
          />
          <div className="timeline">
            {events.slice(0, 6).map((event) => (
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
      </section>

      <section className="wb-project-row">
        <Card>
          <SectionTitle
            title="项目脉搏"
            hint="阶段门禁与运行状态"
            actions={<Link to="/forge" className="text-link">项目工坊 <Icon name="arrowRight" size={13} /></Link>}
          />
          <div className="project-pulse">
            {onlineProjects.length === 0 ? (
              <div className="project-pulse-empty">
                <Icon name="layers" size={18} />
                还没有运行中的项目，去项目工坊挑一个模板。
              </div>
            ) : (
              onlineProjects.map((project) => {
                const aTasks = project.tasks.filter((task) => task.stage === 'A');
                const bTasks = project.tasks.filter((task) => task.stage === 'B');
                const aDone = aTasks.filter((task) => task.done).length;
                const bDone = bTasks.filter((task) => task.done).length;
                return (
                  <Link to={`/forge/${project.id}`} className="project-pulse-item" key={project.id}>
                    <Badge tone={statusTone(project.status) as 'success'} dot>
                      {project.status === 'running' ? '运行中' : project.status === 'error' ? '异常' : '待启动'}
                    </Badge>
                    <div className="project-pulse-main">
                      <strong>{project.title}</strong>
                      <span>{project.stageAApproved ? `阶段 B · ${bDone}/${bTasks.length}` : `阶段 A · ${aDone}/${aTasks.length}`}</span>
                    </div>
                    <div className="project-pulse-progress">
                      <Progress value={project.stageAApproved ? bDone : aDone} max={project.stageAApproved ? bTasks.length : aTasks.length} tone="blue" />
                    </div>
                    <Icon name="chevronRight" size={14} />
                  </Link>
                );
              })
            )}
          </div>
        </Card>
        <Card>
          <SectionTitle title="模块投入" hint="按最近学习会话统计" />
          <EChart option={barOption} height={190} />
        </Card>
      </section>
    </div>
  );
}
