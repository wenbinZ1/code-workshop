import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, PageHeader, Progress, SectionTitle } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useAppStore } from '@/stores/appStore';
import { CURRICULUM } from '@/data/curriculum';
import { useUiStore } from '@/stores/uiStore';

export function GrammarPage() {
  const navigate = useNavigate();
  const pushToast = useUiStore((state) => state.pushToast);
  const progress = useAppStore((state) => state.levelProgress);
  const allLevels = CURRICULUM.flatMap((chapter) => chapter.levels);
  const passed = allLevels.filter((level) => progress[level.id]?.passed).length;
  const stars = allLevels.reduce((sum, level) => sum + (progress[level.id]?.stars ?? 0), 0);
  const started = allLevels.filter(
    (level) => progress[level.id] && !progress[level.id]?.passed && (progress[level.id]?.taskIndex ?? 0) > 0,
  ).length;

  return (
    <div className="page grammar-page">
      <PageHeader
        eyebrow="LEARN / PYTHON"
        title="Python 语法闯关"
        description="10 章 × 5 关，从变量到文件读写。每一关都是“概念 → 练习 → 挑战”的完整闭环。"
        actions={
          <>
            <Badge tone="accent" dot>
              Python 首发
            </Badge>
            <Badge tone="neutral">Go / Java 二期</Badge>
          </>
        }
      />

      <div className="grammar-stats">
        <Card className="grammar-stat">
          <span>已通关</span>
          <strong>{passed}<em>/ {allLevels.length}</em></strong>
          <Progress value={passed} max={allLevels.length} />
        </Card>
        <Card className="grammar-stat">
          <span>累计星级</span>
          <strong>{stars}<em>/ {allLevels.length * 3}</em></strong>
          <div className="star-row">
            {Array.from({ length: 5 }).map((_, index) => (
              <Icon key={index} name="star" size={13} className={index < Math.round((stars / (allLevels.length * 3)) * 5) ? 'is-on' : ''} />
            ))}
          </div>
        </Card>
        <Card className="grammar-stat">
          <span>正在学习</span>
          <strong>{started || 1}<em>关</em></strong>
          <span className="grammar-stat-hint">保持每天推进一关</span>
        </Card>
        <Card className="grammar-stat">
          <span>当前章节</span>
          <strong>{Math.min(10, CURRICULUM.find((chapter) => chapter.levels.some((level) => !progress[level.id]?.passed))?.index ?? 10)}<em>章</em></strong>
          <span className="grammar-stat-hint">按顺序解锁，复习不扣进度</span>
        </Card>
      </div>

      <SectionTitle
        title="章节地图"
        hint="完成上一章 3 关即可解锁下一章"
        actions={<span className="text-link">{passed} / {allLevels.length} 关</span>}
      />

      <div className="chapter-grid">
        {CURRICULUM.map((chapter, chapterIndex) => {
          const chapterPassed = chapter.levels.filter((level) => progress[level.id]?.passed).length;
          const prev = CURRICULUM[chapterIndex - 1];
          const prevPassed = prev
            ? prev.levels.filter((level) => progress[level.id]?.passed).length
            : 5;
          const unlocked = chapterIndex === 0 || prevPassed >= 3;
          return (
            <button
              key={chapter.id}
              type="button"
              className={`chapter-card${unlocked ? '' : ' is-locked'}`}
              onClick={() => {
                if (!unlocked) {
                  pushToast('先完成上一章至少 3 关，再解锁这一章', 'error');
                  return;
                }
                navigate(`/grammar/${chapter.id}`);
              }}
            >
              <div className="chapter-top">
                <span className="chapter-index" style={{ color: chapter.color }}>
                  CH.{String(chapter.index).padStart(2, '0')}
                </span>
                {unlocked ? (
                  <Badge tone={chapterPassed === 5 ? 'success' : chapterPassed > 0 ? 'accent' : 'neutral'}>
                    {chapterPassed === 5 ? '已通关' : chapterPassed > 0 ? '进行中' : '可开始'}
                  </Badge>
                ) : (
                  <Badge tone="neutral">未解锁</Badge>
                )}
              </div>
              <h3>{chapter.title}</h3>
              <p>{chapter.summary}</p>
              <div className="chapter-level-dots">
                {chapter.levels.map((level) => {
                  const state = progress[level.id];
                  return (
                    <i
                      key={level.id}
                      className={`chapter-dot${state?.passed ? ' is-passed' : state && state.taskIndex > 0 ? ' is-progress' : ''}`}
                      title={`${level.title} · ${state?.passed ? `${state.stars} 星` : '未通关'}`}
                    />
                  );
                })}
              </div>
              <div className="chapter-foot">
                <span>{chapterPassed} / 5 关</span>
                <div className="chapter-bar">
                  <span style={{ width: `${(chapterPassed / 5) * 100}%`, background: chapter.color }} />
                </div>
                <Icon name={unlocked ? 'arrowRight' : 'pin'} size={14} />
              </div>
            </button>
          );
        })}
      </div>

      <SectionTitle title="更多语言" hint="先把 Python 走完，再扩展第二语言" />
      <div className="grid grid-2">
        {[
          { name: 'Go 语法闯关', desc: '包、函数、并发原语 · 二期开放', icon: 'terminal' as const },
          { name: 'Java 语法闯关', desc: '类、对象、集合 · 二期开放', icon: 'book' as const },
        ].map((item) => (
          <Card className="language-locked" key={item.name}>
            <span className="language-icon">
              <Icon name={item.icon} size={20} />
            </span>
            <div>
              <strong>{item.name}</strong>
              <p>{item.desc}</p>
            </div>
            <Badge>锁定</Badge>
          </Card>
        ))}
      </div>

      <Card className="grammar-tip">
        <div className="grammar-tip-icon">
          <Icon name="sparkles" size={18} />
        </div>
        <div>
          <strong>学习节奏建议</strong>
          <p>每关 5–10 分钟。先读概念，再做题；卡住时先用提示，不建议直接看答案。通关后回到工作台，进度会立刻反映在雷达图和 XP 上。</p>
        </div>
        <Button variant="ghost" icon="arrowRight" onClick={() => navigate('/grammar/py-1/py-1-1')}>
          从第一关开始
        </Button>
      </Card>
    </div>
  );
}
