import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { Badge, Breadcrumbs, Button, Card, EmptyState, Progress, Ring, SectionTitle, Tabs } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useAppStore } from '@/stores/appStore';
import { useUiStore } from '@/stores/uiStore';
import { relativeTime } from '@/lib/time';
import type { ProjectScore } from '@/types';

type TabId = 'overview' | 'board' | 'snapshots' | 'score';

const STATUS_LABEL: Record<string, string> = {
  running: '运行中',
  done: '已完成',
  paused: '已暂停',
  error: '异常',
  'not-started': '未启动',
};

export function ProjectDetailPage() {
  const { projectId = '' } = useParams();
  const navigate = useNavigate();
  const project = useAppStore((state) => state.projects.find((item) => item.id === projectId));
  const toggleTask = useAppStore((state) => state.actions.toggleProjectTask);
  const submitStageA = useAppStore((state) => state.actions.submitStageA);
  const completeStageB = useAppStore((state) => state.actions.completeStageB);
  const createSnapshot = useAppStore((state) => state.actions.createSnapshot);
  const rollbackSnapshot = useAppStore((state) => state.actions.rollbackSnapshot);
  const saveScore = useAppStore((state) => state.actions.saveProjectScore);
  const addLog = useAppStore((state) => state.actions.addProjectLog);
  const pushToast = useUiStore((state) => state.pushToast);

  const [tab, setTab] = useState<TabId>('overview');
  const [doing, setDoing] = useState<string[]>([]);
  const [score, setScore] = useState<ProjectScore>(() => project?.score ?? {
    feature: 85,
    quality: 80,
    tests: 75,
    docs: 80,
    total: 81,
    comment: '',
    at: new Date().toISOString(),
  });

  useEffect(() => {
    if (project?.score) setScore(project.score);
  }, [project?.id, project?.score]);

  const aTasks = useMemo(() => project?.tasks.filter((task) => task.stage === 'A') ?? [], [project]);
  const bTasks = useMemo(() => project?.tasks.filter((task) => task.stage === 'B') ?? [], [project]);
  const doneA = aTasks.filter((task) => task.done).length;
  const doneB = bTasks.filter((task) => task.done).length;

  if (!project) {
    return (
      <div className="page">
        <EmptyState
          icon="layers"
          title="项目不存在"
          description="它可能已经被删除，回到项目工坊重新选择。"
          action={<Button onClick={() => navigate('/forge')}>返回项目工坊</Button>}
        />
      </div>
    );
  }

  const allA = aTasks.length > 0 && doneA === aTasks.length;
  const allB = bTasks.length > 0 && doneB === bTasks.length;
  const totalScore = Math.round(score.feature * 0.35 + score.quality * 0.25 + score.tests * 0.2 + score.docs * 0.2);

  function handleStageA() {
    if (!allA) {
      pushToast('阶段 A 还有未完成任务，先做完再提交', 'error');
      return;
    }
    if (submitStageA(project!.id)) {
      pushToast('阶段 A 验收通过，阶段 B 已解锁', 'success');
      setTab('board');
    }
  }

  function handleStageB() {
    if (!allB) {
      pushToast('阶段 B 还有未完成任务', 'error');
      return;
    }
    if (completeStageB(project!.id)) {
      pushToast('项目已完成并归档，成长档案已更新', 'success');
      setTab('score');
    }
  }

  function boardColumn(stage: 'todo' | 'doing' | 'done') {
    const tasks = [...aTasks, ...bTasks].filter((task) => {
      if (task.stage === 'B' && !project!.stageAApproved) return false;
      if (stage === 'done') return task.done;
      if (stage === 'doing') return !task.done && doing.includes(task.id);
      return !task.done && !doing.includes(task.id);
    });
    return tasks;
  }

  function renderTask(task: (typeof aTasks)[number], column: 'todo' | 'doing' | 'done') {
    const locked = task.stage === 'B' && !project!.stageAApproved;
    return (
      <div className={clsx('kanban-task', locked && 'is-locked')} key={task.id}>
        <div className="kanban-task-top">
          <Badge tone={task.stage === 'A' ? 'accent' : 'blue'}>{task.stage} 阶段</Badge>
          <span>{task.id.replace('-', ' · ')}</span>
        </div>
        <p>{task.title}</p>
        <div className="kanban-task-actions">
          {locked ? (
            <span className="kanban-locked"><Icon name="pin" size={12} /> 先通过阶段 A</span>
          ) : column === 'todo' ? (
            <>
              <button type="button" onClick={() => setDoing((items) => [...items, task.id])}>开始</button>
              <button type="button" onClick={() => toggleTask(project!.id, task.id)}>直接完成</button>
            </>
          ) : column === 'doing' ? (
            <>
              <button type="button" onClick={() => toggleTask(project!.id, task.id)}>完成</button>
              <button type="button" onClick={() => setDoing((items) => items.filter((id) => id !== task.id))}>退回</button>
            </>
          ) : (
            <button type="button" onClick={() => toggleTask(project!.id, task.id)}>重开</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="page project-detail-page">
      <Breadcrumbs
        items={[
          { label: '工作台', to: '/', icon: 'home' },
          { label: '项目工坊', to: '/forge' },
          { label: project.title },
        ]}
      />

      <section className="project-detail-hero">
        <div className="project-detail-copy">
          <div className="row">
            <Badge tone="neutral">{project.level}</Badge>
            <Badge tone={project.status === 'done' ? 'success' : 'accent'} dot>
              {STATUS_LABEL[project.status]}
            </Badge>
            <span className="faint">阶段 {project.stage === 'done' ? '已归档' : `${project.stage} · ${project.stageAApproved ? '已通过门禁' : '门禁未通过'}`}</span>
          </div>
          <h1>{project.title}</h1>
          <p>{project.summary}</p>
          <div className="skill-chips">
            {project.skills.map((skill) => <span key={skill}>{skill}</span>)}
          </div>
        </div>
        <div className="project-detail-side">
          <Ring value={project.stageAApproved ? (doneB / Math.max(1, bTasks.length)) * 100 : (doneA / Math.max(1, aTasks.length)) * 100} size={86} stroke={7} label={`${project.stageAApproved ? doneB : doneA}/${project.stageAApproved ? bTasks.length : aTasks.length}`} sub={project.stageAApproved ? '阶段 B' : '阶段 A'} />
          <div className="project-detail-actions">
            <Button
              size="sm"
              icon="gitBranch"
              onClick={() => {
                createSnapshot(project.id, `手动快照 · ${new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}`);
                addLog(project.id, '创建手动快照。', 'info');
                pushToast('快照已创建', 'success');
              }}
            >
              创建快照
            </Button>
            <Button size="sm" icon="layers" onClick={() => setTab('board')}>打开看板</Button>
          </div>
        </div>
      </section>

      <Tabs<TabId>
        items={[
          { id: 'overview', label: '概览' },
          { id: 'board', label: '任务看板', count: project.tasks.filter((task) => !task.done).length },
          { id: 'snapshots', label: '版本快照', count: project.snapshots.length },
          { id: 'score', label: '项目评分' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'overview' ? (
        <div className="project-overview-grid">
          <div className="stack">
            <Card>
              <SectionTitle
                title="阶段 A · 基础功能"
                hint={project.stageAApproved ? '已通过验收，基线已记录' : '完成全部任务后才能提交'}
                actions={<Badge tone={project.stageAApproved ? 'success' : 'accent'}>{doneA}/{aTasks.length}</Badge>}
              />
              <div className="stage-task-list">
                {aTasks.map((task) => (
                  <label className={clsx('stage-task', task.done && 'is-done')} key={task.id}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      disabled={project.stageAApproved}
                      onChange={() => toggleTask(project.id, task.id)}
                    />
                    <span>{task.title}</span>
                    {task.done ? <Icon name="check" size={14} /> : null}
                  </label>
                ))}
              </div>
              {!project.stageAApproved ? (
                <Button variant="primary" icon="arrowRight" onClick={handleStageA} disabled={!allA}>
                  提交阶段 A，生成基线
                </Button>
              ) : (
                <div className="stage-done-note">
                  <Icon name="check" size={14} /> 阶段 A 已通过，阶段 B 已解锁
                </div>
              )}
            </Card>

            <Card>
              <SectionTitle
                title="阶段 B · 核心功能"
                hint={project.stageAApproved ? '完成后生成作品页与评分' : '通过阶段 A 后解锁'}
                actions={<Badge tone={project.stageAApproved ? 'blue' : 'neutral'}>{project.stageAApproved ? `${doneB}/${bTasks.length}` : '锁定'}</Badge>}
              />
              <div className={clsx('stage-task-list', !project.stageAApproved && 'is-disabled')}>
                {bTasks.map((task) => (
                  <label className={clsx('stage-task', task.done && 'is-done')} key={task.id}>
                    <input
                      type="checkbox"
                      checked={task.done}
                      disabled={!project.stageAApproved || project.status === 'done'}
                      onChange={() => toggleTask(project.id, task.id)}
                    />
                    <span>{task.title}</span>
                    {!project.stageAApproved ? <Icon name="pin" size={13} /> : task.done ? <Icon name="check" size={14} /> : null}
                  </label>
                ))}
              </div>
              {project.status === 'done' ? (
                <div className="stage-done-note">
                  <Icon name="check" size={14} /> 项目已归档{project.score ? ` · ${project.score.total} 分` : ''}
                </div>
              ) : (
                <Button
                  variant="primary"
                  icon="check"
                  onClick={handleStageB}
                  disabled={!project.stageAApproved || !allB}
                >
                  完成阶段 B，归档项目
                </Button>
              )}
            </Card>
          </div>

          <div className="stack">
            <Card>
              <SectionTitle title="项目日志" hint="启动、任务、快照与验收" />
              <div className="project-log">
                {project.logs.slice(0, 8).map((log) => (
                  <div className="project-log-item" key={log.id}>
                    <span className={`log-dot ${log.level}`} />
                    <div>
                      <p>{log.message}</p>
                      <span>{relativeTime(log.at)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SectionTitle title="交付摘要" hint="一眼看清当前状态" />
              <div className="delivery-summary">
                <div>
                  <span>阶段 A</span>
                  <strong>{doneA}/{aTasks.length}</strong>
                </div>
                <div>
                  <span>阶段 B</span>
                  <strong>{project.stageAApproved ? `${doneB}/${bTasks.length}` : '锁定'}</strong>
                </div>
                <div>
                  <span>快照</span>
                  <strong>{project.snapshots.length}</strong>
                </div>
                <div>
                  <span>评分</span>
                  <strong>{project.score?.total ?? '—'}</strong>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}

      {tab === 'board' ? (
        <div className="kanban-wrap">
          <div className="kanban-head">
            <div>
              <h2>任务看板</h2>
              <p>用按钮把任务移到进行中，再完成它。阶段 B 在门禁通过前保持锁定。</p>
            </div>
            <Badge tone={project.stageAApproved ? 'success' : 'warn'}>
              {project.stageAApproved ? '阶段 B 已解锁' : '阶段 B 锁定'}
            </Badge>
          </div>
          <div className="kanban">
            {[
              { id: 'todo' as const, title: 'TODO', hint: '待开始' },
              { id: 'doing' as const, title: 'DOING', hint: '进行中' },
              { id: 'done' as const, title: 'DONE', hint: '已完成' },
            ].map((column) => {
              const tasks = boardColumn(column.id);
              return (
                <div className={`kanban-column kanban-${column.id}`} key={column.id}>
                  <div className="kanban-column-head">
                    <strong>{column.title}</strong>
                    <span>{tasks.length} · {column.hint}</span>
                  </div>
                  <div className="kanban-column-body">
                    {tasks.length === 0 ? <div className="kanban-empty">这里还没有任务</div> : null}
                    {tasks.map((task) => renderTask(task, column.id))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {tab === 'snapshots' ? (
        <div className="snapshot-layout">
          <Card>
            <SectionTitle
              title="版本快照"
              hint="阶段提交与手动存档，可回滚"
              actions={<Button size="sm" icon="plus" onClick={() => {
                createSnapshot(project.id, `手动快照 · ${project.snapshots.length + 1}`);
                pushToast('快照已创建', 'success');
              }}>新建快照</Button>}
            />
            <div className="snapshot-list">
              {project.snapshots.length === 0 ? (
                <div className="kanban-empty">提交阶段 A 后会自动生成基线快照</div>
              ) : (
                project.snapshots.map((snapshot) => (
                  <div className="snapshot-row" key={snapshot.id}>
                    <div className="snapshot-icon"><Icon name="gitBranch" size={16} /></div>
                    <div className="snapshot-copy">
                      <strong>{snapshot.label}</strong>
                      <span>{new Date(snapshot.at).toLocaleString('zh-CN')} · 阶段 {snapshot.stage}</span>
                    </div>
                    <Badge tone="neutral">{snapshot.tasks.filter((task) => task.done).length} 项完成</Badge>
                    <Button
                      size="sm"
                      variant="ghost"
                      icon="reset"
                      onClick={() => {
                        if (window.confirm(`回滚到「${snapshot.label}」？当前任务状态会被覆盖。`)) {
                          rollbackSnapshot(project.id, snapshot.id);
                          pushToast('已回滚到快照', 'success');
                        }
                      }}
                    >
                      回滚
                    </Button>
                  </div>
                ))
              )}
            </div>
          </Card>
          <Card className="snapshot-tip">
            <Icon name="info" size={18} />
            <strong>回滚不是撤销历史</strong>
            <p>回滚会把任务状态恢复到快照时刻，并写入一条 warn 日志；你仍然可以再次前进。</p>
          </Card>
        </div>
      ) : null}

      {tab === 'score' ? (
        <div className="score-layout">
          <Card>
            <SectionTitle
              title="项目评分"
              hint="功能 35% · 质量 25% · 测试 20% · 文档 20%"
              actions={<Badge tone="accent">{totalScore} 分</Badge>}
            />
            <div className="score-sliders">
              {([
                ['feature', '功能完成度', '阶段 A/B 的任务是否真正可用'],
                ['quality', '代码规范', '命名、结构、边界处理'],
                ['tests', '测试覆盖', '关键路径是否有回归用例'],
                ['docs', '文档完整度', 'README、用法、已知限制'],
              ] as const).map(([key, label, hint]) => (
                <label className="score-row" key={key}>
                  <div className="row-between">
                    <span>{label}</span>
                    <strong>{score[key]}</strong>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={score[key]}
                    onChange={(event) =>
                      setScore((prev) => ({ ...prev, [key]: Number(event.target.value) }))
                    }
                  />
                  <small>{hint}</small>
                </label>
              ))}
            </div>
            <div className="field">
              <label htmlFor="score-comment">评语</label>
              <textarea
                id="score-comment"
                className="textarea"
                value={score.comment}
                onChange={(event) => setScore((prev) => ({ ...prev, comment: event.target.value }))}
                placeholder="写一句给三个月后的自己看的话…"
              />
            </div>
            <div className="row">
              <Button
                variant="primary"
                icon="check"
                onClick={() => {
                  const next = { ...score, total: totalScore, at: new Date().toISOString() };
                  saveScore(project.id, next);
                  addLog(project.id, `保存评分：${totalScore} 分。`, 'success');
                  pushToast('评分已保存', 'success');
                }}
              >
                保存评分
              </Button>
              {project.status !== 'done' ? (
                <Button icon="arrowRight" onClick={handleStageB} disabled={!allB || !project.stageAApproved}>
                  完成并归档
                </Button>
              ) : null}
            </div>
          </Card>
          <Card className="score-side">
            <Ring value={totalScore} size={110} stroke={9} label={totalScore} sub="综合评分" />
            <div className="score-breakdown">
              <div><span>功能</span><strong>{score.feature}</strong></div>
              <div><span>质量</span><strong>{score.quality}</strong></div>
              <div><span>测试</span><strong>{score.tests}</strong></div>
              <div><span>文档</span><strong>{score.docs}</strong></div>
            </div>
            <p>评分不是终点：把评语里的建议写成下一轮任务，项目才算真正交付。</p>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
