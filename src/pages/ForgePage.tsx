import { useNavigate } from 'react-router-dom';
import { Badge, Button, Card, PageHeader, Progress, SectionTitle } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useAppStore } from '@/stores/appStore';
import { PROJECT_LEVEL_LABEL, PROJECT_TEMPLATES } from '@/data/projects';
import { useUiStore } from '@/stores/uiStore';
import type { Project } from '@/types';

function projectProgress(project: Project) {
  const tasks = project.tasks.filter((task) =>
    project.stageAApproved ? task.stage === 'B' : task.stage === 'A',
  );
  const done = tasks.filter((task) => task.done).length;
  return { done, total: tasks.length, pct: tasks.length ? (done / tasks.length) * 100 : 0 };
}

function statusLabel(status: Project['status']) {
  if (status === 'running') return '运行中';
  if (status === 'done') return '已完成';
  if (status === 'error') return '异常';
  if (status === 'paused') return '已暂停';
  return '未启动';
}

export function ForgePage() {
  const navigate = useNavigate();
  const projects = useAppStore((state) => state.projects);
  const startProject = useAppStore((state) => state.actions.startProject);
  const pushToast = useUiStore((state) => state.pushToast);

  const done = projects.filter((project) => project.status === 'done').length;
  const running = projects.filter((project) => project.status === 'running').length;
  const average = done
    ? Math.round(
        projects
          .filter((project) => project.status === 'done' && project.score)
          .reduce((sum, project) => sum + (project.score?.total ?? 0), 0) / done,
      )
    : 0;

  function create(templateId: string) {
    const id = startProject(templateId);
    if (!id) {
      pushToast('这个模板暂时无法创建', 'error');
      return;
    }
    pushToast('项目已创建，阶段 A 已解锁', 'success');
    navigate(`/forge/${id}`);
  }

  return (
    <div className="page forge-page">
      <PageHeader
        eyebrow="BUILD / DELIVERY"
        title="进阶练手项目工坊"
        description="用两阶段交付法把语法变成作品：先做能跑的基础功能，验收通过后再做核心功能。"
        actions={
          <>
            <Badge tone="accent" dot>{running} 个进行中</Badge>
            <Badge tone="neutral">{PROJECT_TEMPLATES.length} 个项目模板</Badge>
          </>
        }
      />

      <div className="forge-stats">
        <Card className="forge-stat">
          <span>我的项目</span>
          <strong>{projects.length}<em>个</em></strong>
          <Progress value={done} max={Math.max(1, projects.length)} />
        </Card>
        <Card className="forge-stat">
          <span>已完成</span>
          <strong>{done}<em>个</em></strong>
          <span className="grammar-stat-hint">阶段 B 验收后归档</span>
        </Card>
        <Card className="forge-stat">
          <span>平均评分</span>
          <strong>{average || '—'}<em>{average ? '分' : ''}</em></strong>
          <span className="grammar-stat-hint">功能 / 质量 / 测试 / 文档</span>
        </Card>
        <Card className="forge-stat">
          <span>快照</span>
          <strong>{projects.reduce((sum, project) => sum + project.snapshots.length, 0)}<em>个</em></strong>
          <span className="grammar-stat-hint">随时可回滚到历史提交</span>
        </Card>
      </div>

      <SectionTitle
        title="我的项目"
        hint="阶段门禁开启后，阶段 B 才可执行"
        actions={<Button size="sm" icon="plus" onClick={() => create(PROJECT_TEMPLATES[0].id)}>快速开始 L1</Button>}
      />

      {projects.length === 0 ? (
        <Card className="forge-empty">
          <Icon name="layers" size={28} />
          <strong>还没有项目</strong>
          <p>从下面的模板库挑一个，先用 30 分钟把阶段 A 跑通。</p>
        </Card>
      ) : (
        <div className="project-grid">
          {projects.map((project) => {
            const progress = projectProgress(project);
            return (
              <button
                key={project.id}
                type="button"
                className="project-card"
                onClick={() => navigate(`/forge/${project.id}`)}
              >
                <div className="project-card-head">
                  <div className="row">
                    <Badge tone="neutral">{project.level}</Badge>
                    <Badge tone={project.status === 'done' ? 'success' : project.status === 'error' ? 'danger' : 'accent'} dot>
                      {statusLabel(project.status)}
                    </Badge>
                  </div>
                  <Icon name="chevronRight" size={15} />
                </div>
                <h3>{project.title}</h3>
                <p>{project.summary}</p>
                <div className="project-stage-line">
                  <span className={project.stageAApproved ? 'is-done' : 'is-active'}>A 基础功能</span>
                  <i />
                  <span className={project.stage === 'B' || project.stage === 'done' ? 'is-done' : ''}>B 核心功能</span>
                  <i />
                  <span className={project.stage === 'done' ? 'is-done' : ''}>归档</span>
                </div>
                <Progress value={progress.done} max={progress.total} tone={project.status === 'done' ? 'green' : 'blue'} />
                <div className="project-card-foot">
                  <span>{progress.done} / {progress.total} 任务</span>
                  <span>{project.score ? `${project.score.total} 分` : '待评分'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      <SectionTitle
        title="项目模板库"
        hint="按等级、技能与两阶段交付拆分"
        actions={<span className="text-link">共 {PROJECT_TEMPLATES.length} 个</span>}
      />

      <div className="template-grid">
        {PROJECT_TEMPLATES.map((template) => (
          <Card className="template-card" key={template.id}>
            <div className="template-head">
              <Badge tone={template.level === 'L1' ? 'accent' : template.level === 'L2' ? 'blue' : template.level === 'L3' ? 'violet' : 'warn'}>
                {template.level} · {PROJECT_LEVEL_LABEL[template.level]}
              </Badge>
              <span className="template-id">{template.id}</span>
            </div>
            <h3>{template.title}</h3>
            <p>{template.summary}</p>
            <div className="skill-chips">
              {template.skills.map((skill) => (
                <span key={skill}>{skill}</span>
              ))}
            </div>
            <div className="template-stages">
              <div>
                <strong>A</strong>
                <span>{template.stageA[0]}</span>
              </div>
              <div>
                <strong>B</strong>
                <span>{template.stageB[0]}</span>
              </div>
            </div>
            <Button
              variant={projects.some((project) => project.title === template.title && project.status !== 'done') ? 'default' : 'primary'}
              icon={projects.some((project) => project.title === template.title && project.status !== 'done') ? 'arrowRight' : 'plus'}
              onClick={() => {
                const existing = projects.find((project) => project.title === template.title && project.status !== 'done');
                if (existing) {
                  navigate(`/forge/${existing.id}`);
                  return;
                }
                create(template.id);
              }}
            >
              {projects.some((project) => project.title === template.title && project.status !== 'done')
                ? '继续项目'
                : '从模板创建'}
            </Button>
          </Card>
        ))}
      </div>

      <Card className="forge-tip">
        <div className="sort-tip-icon">
          <Icon name="gitBranch" size={18} />
        </div>
        <div>
          <strong>两阶段交付是什么？</strong>
          <p>阶段 A 只做“能跑”的基础功能，提交后生成基线快照；阶段 B 才做核心功能。这样每一步都有可回滚的交付点，避免一口气写到失控。</p>
        </div>
      </Card>
    </div>
  );
}
