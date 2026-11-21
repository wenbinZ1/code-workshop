import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as echarts from 'echarts';
import type { EChartsOption } from 'echarts';
import { Badge, Button, Card, EmptyState, Modal, PageHeader, Progress, Ring, SectionTitle } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { EChart, baseTooltip, useChartTheme } from '@/components/charts/EChart';
import { Heatmap } from '@/components/charts/Heatmap';
import { useAppStore, levelOfXp } from '@/stores/appStore';
import { useUiStore } from '@/stores/uiStore';
import { CURRICULUM } from '@/data/curriculum';
import { buildAchievements } from '@/lib/gamification';
import { dateKey, formatMinutes, lastNDays, longestStreakOf, relativeTime, shortDate, streakOf } from '@/lib/time';
import type { SkillScores } from '@/types';

const SKILLS: Array<[keyof SkillScores, string]> = [
  ['algorithm', '算法基础'],
  ['language', '语言熟练度'],
  ['engineering', '工程能力'],
  ['ai', 'AI 协作'],
  ['system', '系统设计'],
  ['product', '产品思维'],
];

const MODULE_NAMES: Record<string, string> = {
  grammar: '语法闯关',
  sort: '排序实验室',
  project: '项目工坊',
  forge: '项目工坊',
  ai: 'AI 训练场',
  monitor: '监控台',
  growth: '成长档案',
};

export function GrowthPage() {
  const navigate = useNavigate();
  const theme = useChartTheme();
  const pushToast = useUiStore((state) => state.pushToast);
  const xp = useAppStore((state) => state.xp);
  const days = useAppStore((state) => state.studyMinutes);
  const sessions = useAppStore((state) => state.sessions);
  const skills = useAppStore((state) => state.skills);
  const levelProgress = useAppStore((state) => state.levelProgress);
  const projects = useAppStore((state) => state.projects);
  const goals = useAppStore((state) => state.goals);
  const workflowRuns = useAppStore((state) => state.workflowRuns);
  const prompts = useAppStore((state) => state.prompts);
  const sortingRecords = useAppStore((state) => state.sortingRecords);
  const aiMessages = useAppStore((state) => state.aiMessages);
  const addGoal = useAppStore((state) => state.actions.addGoal);
  const updateGoal = useAppStore((state) => state.actions.updateGoal);
  const removeGoal = useAppStore((state) => state.actions.removeGoal);

  const [reportOpen, setReportOpen] = useState(false);
  const [report, setReport] = useState('');
  const [goalOpen, setGoalOpen] = useState(false);
  const [goalTitle, setGoalTitle] = useState('');
  const [goalTarget, setGoalTarget] = useState(4);
  const [goalDue, setGoalDue] = useState(new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10));

  const level = levelOfXp(xp);
  const streak = streakOf(days);
  const passedLevels = Object.values(levelProgress).filter((item) => item.passed).length;
  const totalMinutes = Object.values(days).reduce((sum, value) => sum + value, 0);
  const doneProjects = projects.filter((project) => project.status === 'done');
  const last14 = lastNDays(14);
  const weekMinutes = last14.slice(-7).reduce((sum, key) => sum + (days[key] ?? 0), 0);
  const previousWeek = last14.slice(0, 7).reduce((sum, key) => sum + (days[key] ?? 0), 0);
  const weekDelta = previousWeek ? Math.round(((weekMinutes - previousWeek) / previousWeek) * 100) : 0;
  const totalStars = Object.values(levelProgress).reduce((sum, item) => sum + (item.stars ?? 0), 0);
  const longest = longestStreakOf(days);
  const achievements = useMemo(
    () =>
      buildAchievements({
        xp,
        streak,
        passedLevels,
        totalStars,
        sorts: Object.values(sortingRecords).filter((item) => item.completed).length,
        projectsStarted: projects.length,
        projectsDone: doneProjects.length,
        aiMessages: aiMessages.filter((message) => message.role === 'user').length,
        workflowsDone: workflowRuns.filter((run) => run.status === 'done').length,
        goals: goals.length,
      }),
    [xp, streak, passedLevels, totalStars, sortingRecords, projects, doneProjects.length, aiMessages, workflowRuns, goals.length],
  );
  const unlockedAchievements = achievements.filter((item) => item.unlocked).length;

  const radarOption = useMemo<EChartsOption>(
    () => ({
      animationDuration: 900,
      tooltip: { ...baseTooltip(theme), trigger: 'item' },
      radar: {
        center: ['50%', '52%'],
        radius: '68%',
        splitNumber: 4,
        indicator: SKILLS.map(([, label]) => ({ name: label, max: 100 })),
        axisName: { color: theme.muted, fontSize: 10 },
        splitLine: { lineStyle: { color: theme.grid } },
        splitArea: { areaStyle: { color: ['transparent', 'rgba(255,255,255,0.015)'] } },
        axisLine: { lineStyle: { color: theme.grid } },
      },
      series: [
        {
          type: 'radar',
          symbolSize: 4,
          data: [
            {
              value: SKILLS.map(([key]) => skills[key]),
              name: '当前',
              lineStyle: { color: theme.accent, width: 2 },
              itemStyle: { color: theme.accent },
              areaStyle: { color: theme.accentSoft },
            },
          ],
        },
      ],
    }),
    [skills, theme],
  );

  const studyOption = useMemo<EChartsOption>(
    () => ({
      animationDuration: 800,
      grid: { left: 34, right: 14, top: 18, bottom: 26 },
      tooltip: { ...baseTooltip(theme), trigger: 'axis', axisPointer: { type: 'shadow' } },
      xAxis: {
        type: 'category',
        data: last14.map(shortDate),
        axisLine: { lineStyle: { color: theme.grid } },
        axisTick: { show: false },
        axisLabel: { color: theme.faint, fontSize: 9, interval: 1 },
      },
      yAxis: {
        type: 'value',
        splitLine: { lineStyle: { color: theme.grid } },
        axisLabel: { color: theme.faint, fontSize: 9 },
      },
      series: [
        {
          type: 'bar',
          data: last14.map((key) => days[key] ?? 0),
          barWidth: 10,
          itemStyle: {
            borderRadius: [4, 4, 0, 0],
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: theme.accent },
              { offset: 1, color: theme.accentSoft },
            ]),
          },
        },
      ],
    }),
    [days, last14, theme],
  );

  const moduleOption = useMemo<EChartsOption>(() => {
    const totals: Record<string, number> = {};
    for (const session of sessions) {
      const name = MODULE_NAMES[session.module] ?? session.module;
      totals[name] = (totals[name] ?? 0) + session.minutes;
    }
    if (Object.keys(totals).length === 0) totals['语法闯关'] = 1;
    return {
      animationDuration: 700,
      tooltip: { ...baseTooltip(theme), trigger: 'item', formatter: '{b}: {c} 分钟 ({d}%)' },
      legend: { bottom: 0, textStyle: { color: theme.muted, fontSize: 9 }, itemWidth: 7, itemHeight: 7 },
      color: [theme.accent, theme.green, theme.blue, theme.violet, theme.amber, theme.pink],
      series: [
        {
          type: 'pie',
          radius: ['56%', '76%'],
          center: ['50%', '44%'],
          avoidLabelOverlap: true,
          label: { show: false },
          data: Object.entries(totals).map(([name, value]) => ({ name, value })),
        },
      ],
    };
  }, [sessions, theme]);

  function generateReport() {
    const lines = [
      '# 码上工坊 · 成长周报',
      '',
      `生成时间：${new Date().toLocaleString('zh-CN')}`,
      `档案：Lv.${level} · ${xp} XP · 连续 ${streak} 天`,
      '',
      '## 本周数据',
      `- 学习时长：${formatMinutes(weekMinutes)}（较上周 ${weekDelta >= 0 ? '+' : ''}${weekDelta}%）`,
      `- 累计通关：${passedLevels} / ${CURRICULUM.flatMap((chapter) => chapter.levels).length} 关`,
      `- 累计星级：${totalStars} 星`,
      `- 完成项目：${doneProjects.length} 个`,
      `- 六步工作流：${workflowRuns.filter((run) => run.status === 'done').length} 次`,
      `- 提示词模板：${prompts.length} 个，收藏 ${prompts.filter((prompt) => prompt.favorite).length} 个`,
      '',
      '## 六维能力',
      ...SKILLS.map(([key, label]) => `- ${label}：${skills[key]} / 100`),
      '',
      '## 本周产出',
      ...(doneProjects.length
        ? doneProjects.map((project) => `- ${project.title}：${project.score?.total ?? '待评分'} 分`)
        : ['- 暂无归档项目，继续推进项目工坊的阶段 A。']),
      '',
      '## 下周建议',
      passedLevels < 10
        ? '- 先把 Python 前两章打通，优先完成“类型转换”和“条件分支”。'
        : '- 挑一个 L1 项目完成阶段 A，把语法用起来。',
      '- 每天保持 30 分钟以上的连续学习，比周末补 3 小时更稳。',
      '- 用六步工作流至少完成一次真实需求，记录人工修改点。',
      '',
      '> 数据来源：本机 localStorage · 码上工坊 v0.1.0',
    ];
    setReport(lines.join('\n'));
    setReportOpen(true);
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      pushToast('周报已复制到剪贴板', 'success');
    } catch {
      pushToast('复制失败，请手动选择文本', 'error');
    }
  }

  function downloadReport() {
    const blob = new Blob([report], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `码上工坊-周报-${dateKey()}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  function printReport() {
    const popup = window.open('', '_blank', 'width=900,height=720');
    if (!popup) {
      pushToast('浏览器拦截了打印窗口，请允许弹窗后再试', 'error');
      return;
    }
    const escaped = report
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    popup.document.write(`<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><title>码上工坊 · 成长周报</title><style>
      body{margin:0;padding:36px 42px;color:#15251a;font:14px/1.8 'Microsoft YaHei','Segoe UI',sans-serif}
      h1{font-size:22px;margin:0 0 8px}pre{white-space:pre-wrap;font:13px/1.85 'Cascadia Code','Microsoft YaHei',monospace;background:#f6faf6;padding:20px;border-radius:10px}
    </style></head><body><pre>${escaped}</pre></body></html>`);
    popup.document.close();
    window.setTimeout(() => {
      popup.focus();
      popup.print();
    }, 350);
  }

  return (
    <div className="page growth-page">
      <PageHeader
        eyebrow="OBSERVE / GROWTH"
        title="能力成长档案"
        description="把零散的学习与项目行为，沉淀成可量化、可回顾、可分享的成长轨迹。"
        actions={
          <>
            <Button icon="download" onClick={generateReport}>生成周报</Button>
            <Button variant="primary" icon="target" onClick={() => setGoalOpen(true)}>设定目标</Button>
          </>
        }
      />

      <div className="growth-hero">
        <Card className="growth-level">
          <Ring value={xp % 100} size={96} stroke={8} label={`Lv.${level}`} sub={`${xp % 100}/100`} />
          <div>
            <span className="field-label">累计经验</span>
            <strong>{xp.toLocaleString('zh-CN')} XP</strong>
            <p>连续学习 {streak} 天 · 累计 {formatMinutes(totalMinutes)}</p>
            <div className="growth-level-tags">
              <Badge tone="accent">{passedLevels} 关通关</Badge>
              <Badge tone="success">{doneProjects.length} 个项目归档</Badge>
            </div>
          </div>
        </Card>
        <Card className="growth-radar">
          <EChart option={radarOption} height={250} />
        </Card>
        <Card className="growth-week">
          <span className="field-label">本周学习</span>
          <strong>{formatMinutes(weekMinutes)}</strong>
          <span className={weekDelta >= 0 ? 'growth-delta is-up' : 'growth-delta is-down'}>
            <Icon name={weekDelta >= 0 ? 'arrowUp' : 'arrowDown'} size={12} />
            {weekDelta >= 0 ? '+' : ''}{weekDelta}% 较上周
          </span>
          <div className="growth-week-stats">
            <div><span>星级</span><strong>{totalStars}</strong></div>
            <div><span>工作流</span><strong>{workflowRuns.filter((run) => run.status === 'done').length}</strong></div>
            <div><span>模板</span><strong>{prompts.length}</strong></div>
          </div>
          <Button size="sm" icon="arrowRight" onClick={() => navigate('/grammar')}>继续学习</Button>
        </Card>
      </div>

      <div className="growth-chart-grid">
        <Card>
          <SectionTitle title="学习时长" hint="近 14 天 · 分钟" actions={<Badge tone="accent">{formatMinutes(weekMinutes)} / 周</Badge>} />
          <EChart option={studyOption} height={230} />
        </Card>
        <Card>
          <SectionTitle title="模块投入" hint="按学习会话统计" />
          <EChart option={moduleOption} height={230} />
        </Card>
      </div>

      <div className="growth-bottom-grid">
        <Card>
          <SectionTitle title="学习活跃度" hint="近 8 周" />
          <Heatmap days={days} weeks={8} />
          <div className="growth-heat-foot">
            <span>最长连续 {longest} 天</span>
            <span>累计 {formatMinutes(totalMinutes)}</span>
          </div>
        </Card>
        <Card>
          <SectionTitle
            title="阶段目标"
            hint="目标完成度实时计算"
            actions={<Button size="sm" variant="ghost" icon="plus" onClick={() => setGoalOpen(true)}>新增</Button>}
          />
          <div className="goal-cards">
            {goals.length === 0 ? <span className="faint">还没有目标，设一个 30 天的小目标。</span> : null}
            {goals.map((goal) => (
              <div className="goal-card" key={goal.id}>
                <div className="row-between">
                  <strong>{goal.title}</strong>
                  <button type="button" className="icon-btn" aria-label="删除目标" onClick={() => removeGoal(goal.id)}>
                    <Icon name="trash" size={14} />
                  </button>
                </div>
                <div className="row-between">
                  <span className="faint">截止 {goal.due}</span>
                  <span>{goal.progress} / {goal.target}</span>
                </div>
                <Progress value={goal.progress} max={goal.target} tone="green" />
                <div className="row">
                  <Button size="sm" variant="ghost" onClick={() => updateGoal(goal.id, goal.progress - 1)}>−1</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateGoal(goal.id, goal.progress + 1)}>+1</Button>
                  <Button size="sm" variant="ghost" onClick={() => updateGoal(goal.id, goal.target)}>完成</Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <SectionTitle
        title="成就墙"
        hint="学习、排序、项目与 AI 协作的综合里程碑"
        actions={<Badge tone="accent" dot>{unlockedAchievements}/{achievements.length} 已解锁</Badge>}
      />
      <div className="achievement-grid">
        {achievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`achievement-item tone-${achievement.tone} ${achievement.unlocked ? 'is-unlocked' : ''}`}
          >
            <span className="achievement-icon">
              <Icon name={achievement.icon} size={18} />
            </span>
            <div className="achievement-copy">
              <div className="row-between">
                <strong>{achievement.title}</strong>
                <Badge tone={achievement.unlocked ? 'success' : 'neutral'}>
                  {achievement.unlocked ? '已解锁' : `${achievement.current}/${achievement.target}`}
                </Badge>
              </div>
              <span>{achievement.description}</span>
              <Progress
                value={Math.min(achievement.current, achievement.target)}
                max={achievement.target}
                tone={achievement.unlocked ? 'green' : 'blue'}
              />
            </div>
          </div>
        ))}
      </div>

      <SectionTitle title="作品集" hint="已完成项目会自动汇总到这里" actions={<Button size="sm" variant="ghost" icon="arrowRight" onClick={() => navigate('/forge')}>去项目工坊</Button>} />
      {doneProjects.length === 0 ? (
        <EmptyState
          icon="layers"
          title="还没有归档项目"
          description="完成一个 L1 项目的阶段 A 和阶段 B，它就会出现在作品集里。"
          action={<Button variant="primary" onClick={() => navigate('/forge')}>挑一个项目</Button>}
        />
      ) : (
        <div className="portfolio-grid">
          {doneProjects.map((project) => (
            <Card className="portfolio-card card-hover" key={project.id}>
              <div className="row-between">
                <Badge tone="success" dot>已归档</Badge>
                <strong>{project.score?.total ?? '—'} 分</strong>
              </div>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <div className="skill-chips">
                {project.skills.map((skill) => <span key={skill}>{skill}</span>)}
              </div>
              <div className="portfolio-foot">
                <span>{project.snapshots.length} 个快照</span>
                <Button size="sm" variant="ghost" onClick={() => navigate(`/forge/${project.id}`)}>查看</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Card className="growth-note">
        <Icon name="info" size={15} />
        <p>周报数据来自本机事件库；导出的 Markdown 可以直接贴进复盘笔记，也可以用浏览器打印为 PDF。</p>
        <span>本地事件库 · 实时汇总</span>
      </Card>

      <Modal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        title="本周成长周报"
        width={720}
        footer={
          <>
            <Button variant="ghost" icon="copy" onClick={copyReport}>复制</Button>
            <Button variant="ghost" icon="external" onClick={printReport}>打印 / PDF</Button>
            <Button variant="primary" icon="download" onClick={downloadReport}>下载 Markdown</Button>
          </>
        }
      >
        <pre className="report-preview">{report}</pre>
      </Modal>

      <Modal
        open={goalOpen}
        onClose={() => setGoalOpen(false)}
        title="设定阶段目标"
        width={480}
        footer={
          <>
            <Button variant="ghost" onClick={() => setGoalOpen(false)}>取消</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (!goalTitle.trim()) {
                  pushToast('先给目标起个名字', 'error');
                  return;
                }
                addGoal(goalTitle.trim(), Math.max(1, goalTarget), goalDue);
                setGoalTitle('');
                setGoalOpen(false);
                pushToast('目标已创建', 'success');
              }}
            >
              创建目标
            </Button>
          </>
        }
      >
        <div className="stack">
          <div className="field">
            <label htmlFor="goal-title">目标</label>
            <input id="goal-title" className="input" value={goalTitle} onChange={(event) => setGoalTitle(event.target.value)} placeholder="例如：4 周完成 Python 前 3 章" />
          </div>
          <div className="field">
            <label htmlFor="goal-target">目标数量</label>
            <input id="goal-target" className="input" type="number" min={1} max={100} value={goalTarget} onChange={(event) => setGoalTarget(Number(event.target.value))} />
          </div>
          <div className="field">
            <label htmlFor="goal-due">截止日期</label>
            <input id="goal-due" className="input" type="date" value={goalDue} onChange={(event) => setGoalDue(event.target.value)} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
