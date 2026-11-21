import { Link, useNavigate, useParams } from 'react-router-dom';
import { Badge, Breadcrumbs, Button, Card, EmptyState, Progress, Ring, SectionTitle } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useAppStore } from '@/stores/appStore';
import { findChapter, findLevel } from '@/data/curriculum';
import { useUiStore } from '@/stores/uiStore';

export function ChapterPage() {
  const { chapterId = '' } = useParams();
  const navigate = useNavigate();
  const chapter = findChapter(chapterId);
  const progress = useAppStore((state) => state.levelProgress);
  const pushToast = useUiStore((state) => state.pushToast);

  if (!chapter) {
    return (
      <div className="page">
        <EmptyState
          icon="book"
          title="章节不存在"
          description="这个章节可能已经被移动，回到语法闯关重新选择。"
          action={<Button onClick={() => navigate('/grammar')}>返回章节地图</Button>}
        />
      </div>
    );
  }

  const passed = chapter.levels.filter((level) => progress[level.id]?.passed).length;
  const stars = chapter.levels.reduce((sum, level) => sum + (progress[level.id]?.stars ?? 0), 0);

  return (
    <div className="page chapter-page">
      <Breadcrumbs
        items={[
          { label: '工作台', to: '/', icon: 'home' },
          { label: '语法闯关', to: '/grammar' },
          { label: `CH.${String(chapter.index).padStart(2, '0')} ${chapter.title}` },
        ]}
      />

      <section className="chapter-hero" style={{ borderColor: `color-mix(in srgb, ${chapter.color} 28%, var(--line))` }}>
        <div className="chapter-hero-mark" style={{ color: chapter.color }}>
          {String(chapter.index).padStart(2, '0')}
        </div>
        <div className="chapter-hero-copy">
          <div className="eyebrow" style={{ color: chapter.color }}>PYTHON / CHAPTER {chapter.index}</div>
          <h1>{chapter.title}</h1>
          <p>{chapter.summary}</p>
          <div className="chapter-hero-meta">
            <Badge tone="neutral">{chapter.levels.length} 关</Badge>
            <Badge tone="accent">{stars} 星</Badge>
            <span>{passed} / {chapter.levels.length} 已通关</span>
          </div>
        </div>
        <Ring value={(passed / chapter.levels.length) * 100} size={92} stroke={8} color={chapter.color} label={`${passed}/5`} sub="章节进度" />
      </section>

      <SectionTitle
        title="关卡列表"
        hint="按顺序推进，复习不扣进度"
        actions={<Link to="/grammar" className="text-link">返回地图 <Icon name="arrowRight" size={13} /></Link>}
      />

      <div className="level-list">
        {chapter.levels.map((level, index) => {
          const state = progress[level.id];
          const previous = index > 0 ? chapter.levels[index - 1] : null;
          const unlocked = index === 0 || (previous ? progress[previous.id]?.passed : true);
          const status = state?.passed ? 'passed' : state && state.taskIndex > 0 ? 'progress' : unlocked ? 'ready' : 'locked';
          return (
            <Card key={level.id} className={`level-row level-row-${status}`}>
              <div className="level-index">
                {status === 'passed' ? <Icon name="check" size={17} /> : String(index + 1).padStart(2, '0')}
              </div>
              <div className="level-main">
                <div className="level-title-row">
                  <h3>{level.title}</h3>
                  {status === 'passed' ? (
                    <div className="star-row">
                      {[1, 2, 3].map((value) => (
                        <Icon key={value} name="star" size={12} className={value <= (state?.stars ?? 0) ? 'is-on' : ''} />
                      ))}
                    </div>
                  ) : null}
                </div>
                <p>{level.summary}</p>
                <div className="level-meta">
                  <span><Icon name="book" size={12} /> 5 个任务</span>
                  <span><Icon name="bolt" size={12} /> {level.xp} XP</span>
                  <span><Icon name="clock" size={12} /> 5–10 分钟</span>
                </div>
                <Progress
                  value={state?.passed ? 5 : state?.taskIndex ?? 0}
                  max={5}
                  tone={status === 'passed' ? 'green' : 'accent'}
                />
              </div>
              <div className="level-action">
                {status === 'locked' ? (
                  <>
                    <Badge tone="neutral">未解锁</Badge>
                    <Button
                      size="sm"
                      onClick={() => pushToast('先通关上一关，才能进入这一关', 'error')}
                    >
                      如何解锁
                    </Button>
                  </>
                ) : (
                  <Button
                    variant={status === 'passed' ? 'default' : 'primary'}
                    size="sm"
                    icon={status === 'passed' ? 'refresh' : 'play'}
                    onClick={() => navigate(`/grammar/${chapter.id}/${level.id}`)}
                  >
                    {status === 'passed' ? '复习' : status === 'progress' ? '继续' : '开始'}
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="chapter-note">
        <Icon name="info" size={16} />
        <p>
          每关由 5 个任务组成：概念卡 → 单选 → 填空 → 拼装 → 迷你挑战。连续答错 3 次会出现“查看答案”，但会减少本关星级。
        </p>
      </Card>
    </div>
  );
}
