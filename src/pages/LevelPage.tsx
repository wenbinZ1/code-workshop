import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import clsx from 'clsx';
import { Badge, Breadcrumbs, Button, Card, CodeBlock, EmptyState, Progress, Ring } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { CodeEditor } from '@/components/ui/CodeEditor';
import { useAppStore } from '@/stores/appStore';
import { useUiStore } from '@/stores/uiStore';
import { CURRICULUM, findChapter, findLevel } from '@/data/curriculum';
import { runPython, warmUpPython, type PythonRunResult } from '@/lib/pythonRunner';
import type { ChallengeTask, LevelTask } from '@/types';

const TASK_LABEL: Record<LevelTask['kind'], string> = {
  concept: '概念卡',
  choice: '单选题',
  fill: '填空题',
  order: '拼装题',
  challenge: '迷你挑战',
};

function seededShuffle(lines: string[], seed: string): string[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  const out = lines.slice();
  for (let i = out.length - 1; i > 0; i -= 1) {
    hash = (hash * 1664525 + 1013904223) >>> 0;
    const j = hash % (i + 1);
    const temp = out[i];
    out[i] = out[j];
    out[j] = temp;
  }
  return out;
}

function judgeChallenge(code: string, task: ChallengeTask) {
  const normalized = code.replace(/\s+/g, ' ').trim().toLowerCase();
  return task.checks.map((check) => {
    let ok = false;
    if (check.type === 'contains') ok = normalized.includes(check.value.toLowerCase());
    else if (check.type === 'notContains') ok = !normalized.includes(check.value.toLowerCase());
    else {
      try {
        ok = new RegExp(check.value, 'i').test(code);
      } catch {
        ok = false;
      }
    }
    return { ...check, ok };
  });
}

function normalizeOutput(value: string): string {
  return value.replace(/\r\n/g, '\n').replace(/[ \t]+$/gm, '').trim();
}

function Feedback({
  tone,
  title,
  detail,
}: {
  tone: 'success' | 'error' | 'info';
  title: string;
  detail?: string;
}) {
  return (
    <div className={`feedback feedback-${tone}`} role="status">
      <Icon name={tone === 'success' ? 'check' : tone === 'error' ? 'alert' : 'info'} size={16} />
      <div>
        <strong>{title}</strong>
        {detail ? <p>{detail}</p> : null}
      </div>
    </div>
  );
}

export function LevelPage() {
  const { chapterId = '', levelId = '' } = useParams();
  const navigate = useNavigate();
  const chapter = findChapter(chapterId);
  const level = findLevel(chapterId, levelId);
  const progress = useAppStore((state) => state.levelProgress[levelId]);
  const setLevelProgress = useAppStore((state) => state.actions.setLevelProgress);
  const passLevel = useAppStore((state) => state.actions.passLevel);
  const pushToast = useUiStore((state) => state.pushToast);

  const [current, setCurrent] = useState(0);
  const [completed, setCompleted] = useState<number[]>([]);
  const [attempts, setAttempts] = useState(0);
  const [hints, setHints] = useState(0);
  const [taskAttempts, setTaskAttempts] = useState(0);
  const [hintShown, setHintShown] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [canContinue, setCanContinue] = useState(false);
  const [view, setView] = useState<'run' | 'result'>('run');
  const [feedback, setFeedback] = useState<{ tone: 'success' | 'error' | 'info'; title: string; detail?: string } | null>(null);
  const [selected, setSelected] = useState<number | null>(null);
  const [fill, setFill] = useState('');
  const [order, setOrder] = useState<string[]>([]);
  const [code, setCode] = useState('');
  const [execution, setExecution] = useState<PythonRunResult | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ stars: number; xp: number; review: boolean } | null>(null);

  useEffect(() => {
    const saved = useAppStore.getState().levelProgress[level?.id ?? ''];
    setCurrent(saved?.passed ? 0 : saved?.taskIndex ?? 0);
    setCompleted(saved?.passed ? [0, 1, 2, 3, 4] : saved?.completed ?? []);
    setAttempts(saved?.attempts ?? 0);
    setHints(saved?.hints ?? 0);
    setView(saved?.passed ? 'result' : 'run');
    setResult(null);
  }, [level?.id]);

  const task = level && view === 'run' ? level.tasks[Math.min(current, level.tasks.length - 1)] : undefined;

  useEffect(() => {
    if (!task) return;
    setSelected(null);
    setFill('');
    setOrder(task.kind === 'order' ? seededShuffle(task.lines, task.id) : []);
    setCode(task.kind === 'challenge' ? task.starter : '');
    setExecution(null);
    setRunning(false);
    setFeedback(null);
    setCanContinue(false);
    setRevealed(false);
    setHintShown(false);
    setTaskAttempts(0);
    if (task.kind === 'challenge' && task.executable !== false) warmUpPython();
  }, [current, task?.id, task]);

  const nextLevel = useMemo(() => {
    if (!level || !chapter) return null;
    if (chapter.levels[level.index]) return { chapter, level: chapter.levels[level.index] };
    const nextChapter = CURRICULUM[chapter.index];
    if (nextChapter) return { chapter: nextChapter, level: nextChapter.levels[0] };
    return null;
  }, [chapter, level]);

  if (!level || !chapter) {
    return (
      <div className="page">
        <EmptyState
          icon="code"
          title="关卡不存在"
          description="回到章节列表重新选择一关。"
          action={<Button onClick={() => navigate('/grammar')}>返回语法闯关</Button>}
        />
      </div>
    );
  }

  const activeTask = level.tasks[current];

  function persist(nextIndex: number, nextCompleted: number[], nextHints = hints, nextAttempts = attempts) {
    setLevelProgress(level!.id, {
      taskIndex: nextIndex,
      completed: nextCompleted,
      attempts: nextAttempts,
      hints: nextHints,
    });
  }

  function finishLevel() {
    const stars = hints === 0 ? 3 : hints === 1 ? 2 : 1;
    const review = Boolean(progress?.passed);
    const xp = review ? 0 : level!.xp + (stars === 3 ? 10 : 0);
    if (!review) {
      passLevel(level!.id, stars, xp);
      pushToast(`通关「${level!.title}」· +${xp} XP`, 'success');
    } else {
      setLevelProgress(level!.id, { taskIndex: 5, completed: [0, 1, 2, 3, 4], attempts, hints });
      pushToast('复习完成，不重复发放 XP', 'info');
    }
    setResult({ stars, xp, review });
    setView('result');
  }

  function completeTask() {
    const nextCompleted = Array.from(new Set([...completed, current])).sort((a, b) => a - b);
    setCompleted(nextCompleted);
    if (current >= level!.tasks.length - 1) {
      finishLevel();
      return;
    }
    const nextIndex = current + 1;
    persist(nextIndex, nextCompleted);
    setCurrent(nextIndex);
  }

  function addAttempt() {
    const value = attempts + 1;
    setAttempts(value);
    setTaskAttempts((count) => count + 1);
    persist(current, completed, hints, value);
  }

  function showHint() {
    if (hintShown) return;
    setHintShown(true);
    const value = hints + 1;
    setHints(value);
    persist(current, completed, value);
  }

  function revealAnswer() {
    setRevealed(true);
    setCanContinue(true);
    if (!hintShown) {
      const value = hints + 1;
      setHints(value);
      persist(current, completed, value);
    }
  }

  function submitChoice() {
    if (selected === null || activeTask.kind !== 'choice') return;
    if (selected === activeTask.answer) {
      setFeedback({ tone: 'success', title: '答对了', detail: activeTask.explanation });
      setCanContinue(true);
    } else {
      addAttempt();
      setFeedback({ tone: 'error', title: '再想想', detail: '答案不对，注意区分赋值与比较、字符串与数字。' });
    }
  }

  function submitFill() {
    if (activeTask.kind !== 'fill') return;
    if (fill.trim() === activeTask.answer) {
      setFeedback({ tone: 'success', title: '答对了', detail: activeTask.explanation });
      setCanContinue(true);
    } else {
      addAttempt();
      setFeedback({ tone: 'error', title: '还差一点', detail: '检查引号、函数名和等号两边的内容。' });
    }
  }

  function submitOrder() {
    if (activeTask.kind !== 'order') return;
    if (order.join('\n') === activeTask.lines.join('\n')) {
      setFeedback({ tone: 'success', title: '顺序正确', detail: activeTask.explanation });
      setCanContinue(true);
    } else {
      addAttempt();
      setFeedback({ tone: 'error', title: '顺序还不对', detail: '先找“定义/导入”，再找“使用”，最后找“输出”。' });
    }
  }

  async function submitChallenge() {
    if (activeTask.kind !== 'challenge' || running) return;
    const judged = judgeChallenge(code, activeTask);
    const failed = judged.filter((item) => !item.ok);
    if (failed.length > 0) {
      addAttempt();
      setFeedback({
        tone: 'error',
        title: '还差一些关键代码',
        detail: failed.map((item) => item.message).join('；'),
      });
      return;
    }

    if (activeTask.executable !== false) {
      setRunning(true);
      const run = await runPython(code, 30000);
      setExecution(run);
      setRunning(false);
      if (run.error) {
        addAttempt();
        setFeedback({
          tone: 'error',
          title: run.error.includes('超时') ? '执行超时' : 'Python 运行失败',
          detail: run.error,
        });
        return;
      }
      const actual = normalizeOutput(run.stdout);
      const expected = normalizeOutput(activeTask.expected);
      if (actual !== expected) {
        addAttempt();
        setFeedback({
          tone: 'error',
          title: '输出与期望不一致',
          detail: `期望输出：${expected || '（空）'}\n实际输出：${actual || '（空）'}`,
        });
        return;
      }
    }

    setFeedback({ tone: 'success', title: '挑战通过', detail: activeTask.explanation });
    setCanContinue(true);
  }

  async function runCurrentCode() {
    if (running) return;
    setRunning(true);
    const run = await runPython(code, 30000);
    setExecution(run);
    setRunning(false);
  }

  function moveOrder(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= order.length) return;
    const next = order.slice();
    const temp = next[index];
    next[index] = next[target];
    next[target] = temp;
    setOrder(next);
  }

  function startReview() {
    setView('run');
    setCurrent(0);
    setCompleted([]);
    setAttempts(progress?.attempts ?? 0);
    setHints(progress?.hints ?? 0);
    setResult(null);
    setFeedback(null);
  }

  const correctAnswer =
    activeTask.kind === 'choice'
      ? activeTask.options[activeTask.answer]
      : activeTask.kind === 'fill'
        ? activeTask.answer
        : activeTask.kind === 'order'
          ? activeTask.lines.join('\n')
          : activeTask.kind === 'challenge'
            ? activeTask.solution
            : '';

  const steps = level.tasks.map((item, index) => ({
    index,
    label: TASK_LABEL[item.kind],
    done: completed.includes(index),
    active: view === 'run' && index === current,
  }));

  return (
    <div className="page level-page">
      <Breadcrumbs
        items={[
          { label: '工作台', to: '/', icon: 'home' },
          { label: '语法闯关', to: '/grammar' },
          { label: chapter.title, to: `/grammar/${chapter.id}` },
          { label: level.title },
        ]}
      />

      {view === 'result' ? (
        <div className="level-result-wrap">
          <Card className="level-result">
            <div className="result-glow" />
            <div className="result-stars">
              {[1, 2, 3].map((value) => (
                <Icon
                  key={value}
                  name="star"
                  size={28}
                  className={value <= (result?.stars ?? progress?.stars ?? 0) ? 'is-on' : ''}
                />
              ))}
            </div>
            <Badge tone="success" dot>
              {result?.review ? '复习完成' : '关卡通过'}
            </Badge>
            <h1>{result?.review ? '又巩固了一遍' : '漂亮，这一关拿下了'}</h1>
            <p>
              {level.title} · {level.summary}
            </p>
            <div className="result-metrics">
              <div>
                <span>获得 XP</span>
                <strong>+{result?.xp ?? 0}</strong>
              </div>
              <div>
                <span>使用提示</span>
                <strong>{hints}</strong>
              </div>
              <div>
                <span>尝试次数</span>
                <strong>{attempts}</strong>
              </div>
            </div>
            <div className="result-actions">
              {nextLevel ? (
                <Button variant="primary" icon="arrowRight" onClick={() => navigate(`/grammar/${nextLevel.chapter.id}/${nextLevel.level.id}`)}>
                  下一关：{nextLevel.level.title}
                </Button>
              ) : (
                <Button variant="primary" onClick={() => navigate('/grammar')}>
                  返回章节地图
                </Button>
              )}
              <Button icon="refresh" onClick={startReview}>
                再练一次
              </Button>
              <Button variant="ghost" onClick={() => navigate(`/grammar/${chapter.id}`)}>
                回到章节
              </Button>
            </div>
          </Card>
          <Card className="result-side">
            <div className="result-side-head">
              <Ring value={100} size={70} stroke={6} label="5/5" sub="任务完成" />
              <div>
                <strong>本关知识点</strong>
                <span>{chapter.title}</span>
              </div>
            </div>
            <div className="concept-bullets">
              {level.tasks[0].kind === 'concept' && level.tasks[0].bullets?.length ? (
                level.tasks[0].bullets.map((item) => <span key={item}>{item}</span>)
              ) : (
                <span>把这一关的代码再手写一遍，比看答案更有效。</span>
              )}
            </div>
            <Button icon="chart" onClick={() => navigate('/growth')}>
              查看成长档案
            </Button>
          </Card>
        </div>
      ) : (
        <div className="level-layout">
          <aside className="level-steps">
            <div className="level-steps-head">
              <span className="eyebrow">LEVEL {String(level.index).padStart(2, '0')}</span>
              <h2>{level.title}</h2>
              <p>{level.summary}</p>
            </div>
            <div className="step-list">
              {steps.map((step) => (
                <div
                  key={step.index}
                  className={clsx('step-item', step.done && 'is-done', step.active && 'is-active')}
                >
                  <span className="step-dot">
                    {step.done ? <Icon name="check" size={11} /> : step.index + 1}
                  </span>
                  <span>{step.label}</span>
                </div>
              ))}
            </div>
            <div className="level-steps-meta">
              <div className="row-between">
                <span>本关 XP</span>
                <strong>{level.xp}</strong>
              </div>
              <div className="row-between">
                <span>已用提示</span>
                <strong>{hints}</strong>
              </div>
              <Progress value={completed.length} max={level.tasks.length} />
            </div>
          </aside>

          <div className="level-main">
            <div className="level-task-head">
              <div>
                <Badge tone="accent">{TASK_LABEL[activeTask.kind]}</Badge>
                <h2>{activeTask.kind === 'concept' ? activeTask.title : `任务 ${current + 1} / ${level.tasks.length}`}</h2>
              </div>
              <span className="level-task-xp">
                <Icon name="bolt" size={13} /> {level.xp} XP
              </span>
            </div>

            <Card className="task-card">
              {activeTask.kind === 'concept' ? (
                <div className="concept-task">
                  <h2>{activeTask.title}</h2>
                  <p>{activeTask.body}</p>
                  {activeTask.code ? <CodeBlock code={activeTask.code} /> : null}
                  {activeTask.bullets?.length ? (
                    <div className="concept-bullets">
                      {activeTask.bullets.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  ) : null}
                  <Button variant="primary" icon="check" onClick={completeTask}>
                    我懂了，开始练习
                  </Button>
                </div>
              ) : null}

              {activeTask.kind === 'choice' ? (
                <div className="choice-task">
                  <p className="task-prompt">{activeTask.prompt}</p>
                  <div className="choice-list">
                    {activeTask.options.map((option, index) => (
                      <button
                        key={option}
                        type="button"
                        className={clsx(
                          'choice-item',
                          selected === index && 'is-selected',
                          revealed && index === activeTask.answer && 'is-correct',
                        )}
                        onClick={() => {
                          if (canContinue) return;
                          setSelected(index);
                          setFeedback(null);
                        }}
                      >
                        <span>{String.fromCharCode(65 + index)}</span>
                        <code>{option}</code>
                      </button>
                    ))}
                  </div>
                  <div className="task-actions">
                    <Button variant="primary" onClick={submitChoice} disabled={selected === null || canContinue}>
                      提交答案
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeTask.kind === 'fill' ? (
                <div className="fill-task">
                  <p className="task-prompt">{activeTask.prompt}</p>
                  <div className="fill-row">
                    <span className="fill-prompt">&gt;</span>
                    <input
                      className="input mono"
                      value={fill}
                      onChange={(event) => setFill(event.target.value)}
                      placeholder="输入缺失的内容"
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') submitFill();
                      }}
                      disabled={canContinue}
                    />
                    <Button variant="primary" onClick={submitFill} disabled={canContinue || fill.trim() === ''}>
                      检查
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeTask.kind === 'order' ? (
                <div className="order-task">
                  <p className="task-prompt">{activeTask.prompt}</p>
                  <div className="order-list">
                    {order.map((line, index) => (
                      <div className="order-item" key={`${line}-${index}`}>
                        <span className="order-index">{index + 1}</span>
                        <code>{line}</code>
                        <div className="order-actions">
                          <button type="button" aria-label="上移" onClick={() => moveOrder(index, -1)} disabled={index === 0 || canContinue}>
                            <Icon name="arrowUp" size={13} />
                          </button>
                          <button type="button" aria-label="下移" onClick={() => moveOrder(index, 1)} disabled={index === order.length - 1 || canContinue}>
                            <Icon name="arrowDown" size={13} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="task-actions">
                    <Button variant="primary" onClick={submitOrder} disabled={canContinue}>
                      提交顺序
                    </Button>
                  </div>
                </div>
              ) : null}

              {activeTask.kind === 'challenge' ? (
                <div className="challenge-task">
                  <p className="task-prompt">{activeTask.prompt}</p>
                  <div className="expected-row">
                    <span>期望输出</span>
                    <code>{activeTask.expected}</code>
                  </div>
                  <CodeEditor value={code} onChange={setCode} height={230} />
                  <div className="task-actions">
                    <Button icon="play" onClick={runCurrentCode} disabled={running || canContinue}>
                      {running ? '运行中…' : '运行代码'}
                    </Button>
                    <Button variant="primary" icon="check" onClick={submitChallenge} disabled={running || canContinue}>
                      {running ? '判定中…' : '运行检查'}
                    </Button>
                    <span className="task-hint">
                      {activeTask.executable === false
                        ? '本题含文件 / 随机数，按规则判定'
                        : 'Pyodide 真实执行 · 30 秒超时'}
                    </span>
                  </div>
                  {execution ? (
                    <div className="python-console">
                      <div className="python-console-head">
                        <span><Icon name="terminal" size={13} /> Python 运行结果</span>
                        <span>{execution.durationMs}ms · {execution.error ? '失败' : '完成'}</span>
                      </div>
                      {execution.error ? (
                        <pre className="python-error">{execution.error}</pre>
                      ) : (
                        <>
                          <pre>{execution.stdout || '（没有 stdout 输出）'}</pre>
                          {execution.result ? <pre className="python-result">表达式结果：{execution.result}</pre> : null}
                          {execution.stderr ? <pre className="python-stderr">{execution.stderr}</pre> : null}
                        </>
                      )}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {feedback ? <Feedback tone={feedback.tone} title={feedback.title} detail={feedback.detail} /> : null}

              {canContinue && activeTask.kind !== 'concept' ? (
                <div className="continue-bar">
                  <span>{revealed ? '已查看答案，本题按提示结算' : '本题完成，继续下一题'}</span>
                  <Button variant="primary" icon="arrowRight" onClick={completeTask}>
                    {current === level.tasks.length - 1 ? '完成本关' : '下一题'}
                  </Button>
                </div>
              ) : null}

              {revealed && correctAnswer ? (
                <div className="revealed-answer">
                  <div className="row-between">
                    <strong>参考答案</strong>
                    <Badge tone="warn">已用提示</Badge>
                  </div>
                  <CodeBlock code={correctAnswer} language="answer" showLineNumbers={false} />
                </div>
              ) : null}
            </Card>

            <div className="level-help-row">
              <Button size="sm" icon="info" onClick={showHint} disabled={hintShown || canContinue}>
                {hintShown ? '提示已显示' : '给我一个提示'}
              </Button>
              {taskAttempts >= 3 && !canContinue ? (
                <Button size="sm" variant="ghost" icon="eye" onClick={revealAnswer}>
                  查看答案
                </Button>
              ) : null}
              <span className="level-help-note">提示会影响星级；连续答错 3 次可查看答案。</span>
            </div>
          </div>

          <aside className="level-side">
            <Card className="level-side-card">
              <div className="row-between">
                <span className="field-label">关卡进度</span>
                <Badge tone="neutral">{completed.length}/5</Badge>
              </div>
              <Progress value={completed.length} max={5} />
              <div className="level-side-stats">
                <div>
                  <span>XP</span>
                  <strong>{level.xp}</strong>
                </div>
                <div>
                  <span>提示</span>
                  <strong>{hints}</strong>
                </div>
                <div>
                  <span>尝试</span>
                  <strong>{attempts}</strong>
                </div>
              </div>
            </Card>

            <Card className="hint-card">
              <div className="row">
                <Icon name="spark" size={16} />
                <strong>提示</strong>
              </div>
              <p>
                {hintShown
                  ? activeTask.kind === 'choice'
                    ? '把选项代回题目，逐个排除；注意 = 和 == 的区别。'
                    : activeTask.kind === 'fill'
                      ? '先确定要填的是函数、符号还是字符串，再检查引号。'
                      : activeTask.kind === 'order'
                        ? '先找定义/导入，再找使用，最后找输出。'
                        : '把任务拆成“输入 → 处理 → 输出”，先保证 print 的内容对。'
                  : '先自己试一次，再点“给我一个提示”。提示会记录在本关星级里。'}
              </p>
            </Card>

            <Card className="level-side-card">
              <span className="field-label">本关所属</span>
              <strong className="side-chapter">{chapter.title}</strong>
              <p className="side-summary">{chapter.summary}</p>
              <Link to={`/grammar/${chapter.id}`} className="text-link">
                查看章节全部关卡 <Icon name="arrowRight" size={13} />
              </Link>
            </Card>
          </aside>
        </div>
      )}
    </div>
  );
}
