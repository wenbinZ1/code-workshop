import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createWorkshopStorage } from '@/lib/persistence';
import type {
  AiConfig,
  AiMessage,
  AppEvent,
  Goal,
  LevelProgress,
  Project,
  ProjectScore,
  ProjectSnapshot,
  ProjectTemplate,
  PromptTemplate,
  SkillScores,
  SortAlgorithmId,
  SortingRecord,
  StudySession,
  ThemeMode,
  WorkflowRun,
} from '@/types';
import { PROJECT_TEMPLATES } from '@/data/projects';
import { SEED_PROMPTS } from '@/data/prompts';
import { dateKey } from '@/lib/time';
import { uid } from '@/lib/id';

interface DataState {
  version: number;
  nickname: string;
  xp: number;
  theme: ThemeMode;
  reducedMotion: boolean;
  studyMinutes: Record<string, number>;
  xpHistory: Array<{ id: string; date: string; amount: number; reason: string }>;
  levelProgress: Record<string, LevelProgress>;
  sortingRecords: Record<string, SortingRecord>;
  projects: Project[];
  goals: Goal[];
  events: AppEvent[];
  sessions: StudySession[];
  prompts: PromptTemplate[];
  workflowRuns: WorkflowRun[];
  aiMessages: AiMessage[];
  aiConfig: AiConfig;
  skills: SkillScores;
  /** 每日任务领取记录：日期 → 已领取的任务 id，刷新后不会重复领奖。 */
  questClaims: Record<string, string[]>;
}

interface Actions {
  logEvent: (event: Omit<AppEvent, 'id' | 'at'>) => void;
  addXp: (amount: number, reason: string) => void;
  recordStudy: (minutes: number, module: string, label: string, xp?: number) => void;
  setLevelProgress: (levelId: string, patch: Partial<LevelProgress>) => void;
  passLevel: (levelId: string, stars: number, xp: number) => boolean;
  completeSort: (algorithm: SortAlgorithmId, comparisons: number, swaps: number) => void;
  startProject: (templateId: string) => string | undefined;
  toggleProjectTask: (projectId: string, taskId: string) => void;
  addProjectLog: (
    projectId: string,
    message: string,
    level?: 'info' | 'warn' | 'error' | 'success',
  ) => void;
  submitStageA: (projectId: string) => boolean;
  completeStageB: (projectId: string) => boolean;
  saveProjectScore: (projectId: string, score: ProjectScore) => void;
  createSnapshot: (projectId: string, label: string) => void;
  rollbackSnapshot: (projectId: string, snapshotId: string) => void;
  addGoal: (title: string, target: number, due: string) => void;
  updateGoal: (goalId: string, progress: number) => void;
  removeGoal: (goalId: string) => void;
  togglePromptFavorite: (promptId: string) => void;
  addPrompt: (prompt: PromptTemplate) => void;
  usePrompt: (promptId: string) => void;
  startWorkflow: (title: string, role: string) => string;
  toggleWorkflowCheck: (runId: string, stepId: string, checkId: string) => void;
  completeWorkflow: (runId: string) => boolean;
  setAiConfig: (config: Partial<AiConfig>) => void;
  appendAiMessage: (message: AiMessage) => void;
  clearAiMessages: () => void;
  setTheme: (theme: ThemeMode) => void;
  setReducedMotion: (value: boolean) => void;
  setNickname: (value: string) => void;
  claimQuest: (questId: string, xp: number, title: string) => void;
  resetUserData: () => void;
  importData: (raw: string) => boolean;
}

export type AppState = DataState & { actions: Actions };

const WORKFLOW_STEPS = [
  ['step-1', '需求拆解', '把目标拆成可验证的小问题', ['写清目标用户与场景', '列出 3 个必须解决的问题', '标出不做的事']],
  ['step-2', '技术选型', '为问题选择最小可行技术', ['列出 2 个候选方案', '写清取舍理由', '标出风险与回退']],
  ['step-3', '任务拆分', '让每一步都能独立验收', ['每个任务 <= 1 天', '写清输入输出', '标出依赖顺序']],
  ['step-4', '分步生成', '一次只让 AI 做一件事', ['先接口后实现', '每步都要求解释', '拒绝一次生成全部']],
  ['step-5', '人工审查', '把 AI 产出当成草稿', ['检查边界与安全', '运行测试', '记录修改点']],
  ['step-6', '集成验证', '用真实场景收尾', ['跑通主链路', '补回归用例', '写清已知限制']],
] as const;

function makeWorkflow(title: string, role: string): WorkflowRun {
  return {
    id: uid('wf'),
    title,
    role,
    status: 'active',
    startedAt: new Date().toISOString(),
    steps: WORKFLOW_STEPS.map(([id, stepTitle, description, checks]) => ({
      id,
      title: stepTitle,
      description,
      checks: checks.map((label, index) => ({
        id: `${id}-${index}`,
        label,
        done: false,
      })),
    })),
  };
}

function projectFromTemplate(template: ProjectTemplate): Project {
  const now = new Date().toISOString();
  return {
    id: uid('project'),
    title: template.title,
    level: template.level,
    summary: template.summary,
    skills: template.skills,
    status: 'running',
    stage: 'A',
    stageAApproved: false,
    tasks: [
      ...template.stageA.map((title, index) => ({
        id: `a-${index}`,
        title,
        stage: 'A' as const,
        done: false,
      })),
      ...template.stageB.map((title, index) => ({
        id: `b-${index}`,
        title,
        stage: 'B' as const,
        done: false,
      })),
    ],
    logs: [
      {
        id: uid('log'),
        at: now,
        level: 'info',
        message: `从模板「${template.title}」创建项目，阶段 A 已解锁。`,
      },
    ],
    snapshots: [],
    createdAt: now,
    updatedAt: now,
  };
}

function createInitialState(): DataState {
  const now = new Date();

  return {
    version: 2,
    nickname: '新手玩家',
    xp: 0,
    theme: 'dark',
    reducedMotion: false,
    studyMinutes: {},
    xpHistory: [],
    levelProgress: {},
    sortingRecords: {},
    projects: [],
    goals: [
      {
        id: uid('goal'),
        title: '完成 Python 第 1 章',
        target: 5,
        progress: 0,
        due: new Date(now.getTime() + 7 * 86400000).toISOString().slice(0, 10),
        createdAt: now.toISOString(),
      },
    ],
    events: [
      {
        id: uid('evt'),
        at: now.toISOString(),
        type: 'system.init',
        title: '工作台已初始化',
        detail: '从 0 XP 开始，完成第一个关卡后这里会出现学习记录。',
        level: 'info',
        module: 'system',
      },
    ],
    sessions: [],
    prompts: SEED_PROMPTS.map((prompt) => ({ ...prompt, favorite: false, uses: 0 })),
    workflowRuns: [],
    aiMessages: [
      {
        id: uid('msg'),
        role: 'assistant',
        content:
          '我是你的 AI 开发搭档。先告诉我目标、约束和验收标准，我会按“需求拆解 → 方案 → 任务 → 实现 → 审查”的顺序配合你。',
        at: now.toISOString(),
      },
    ],
    aiConfig: {
      baseUrl: 'https://api.deepseek.com',
      apiKey: '',
      model: 'deepseek-chat',
    },
    skills: {
      algorithm: 0,
      language: 0,
      engineering: 0,
      ai: 0,
      system: 0,
      product: 0,
    },
    questClaims: {},
  };
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      ...createInitialState(),
      actions: {
        logEvent: (event) =>
          set((state) => ({
            events: [
              {
                ...event,
                id: uid('evt'),
                at: new Date().toISOString(),
              },
              ...state.events,
            ].slice(0, 250),
          })),

        addXp: (amount, reason) =>
          set((state) => {
            const at = new Date().toISOString();
            return {
              xp: Math.max(0, state.xp + amount),
              xpHistory: [
                { id: uid('xp'), date: at, amount, reason },
                ...state.xpHistory,
              ].slice(0, 100),
            };
          }),

        recordStudy: (minutes, module, label, xp = 0) =>
          set((state) => {
            const key = dateKey();
            const at = new Date().toISOString();
            return {
              studyMinutes: {
                ...state.studyMinutes,
                [key]: (state.studyMinutes[key] ?? 0) + minutes,
              },
              sessions: [
                {
                  id: uid('session'),
                  module,
                  label,
                  date: key,
                  minutes,
                  xp,
                  at,
                },
                ...state.sessions,
              ].slice(0, 200),
              xp: state.xp + xp,
            };
          }),

        setLevelProgress: (levelId, patch) =>
          set((state) => {
            const existing = state.levelProgress[levelId];
            const base: LevelProgress = {
              levelId,
              taskIndex: 0,
              completed: [],
              attempts: 0,
              hints: 0,
              passed: false,
              stars: 0,
            };
            return {
              levelProgress: {
                ...state.levelProgress,
                [levelId]: Object.assign({}, base, existing, patch),
              },
            };
          }),

        passLevel: (levelId, stars, xp) => {
          const state = get();
          const existing = state.levelProgress[levelId];
          if (existing?.passed) {
            set((prev) => ({
              levelProgress: {
                ...prev.levelProgress,
                [levelId]: {
                  ...prev.levelProgress[levelId],
                  stars: Math.max(prev.levelProgress[levelId]?.stars ?? 0, stars),
                },
              },
            }));
            return false;
          }
          set((prev) => ({
            xp: prev.xp + xp,
            levelProgress: {
              ...prev.levelProgress,
              [levelId]: {
                levelId,
                taskIndex: 5,
                completed: [0, 1, 2, 3, 4],
                attempts: prev.levelProgress[levelId]?.attempts ?? 5,
                hints: prev.levelProgress[levelId]?.hints ?? 0,
                passed: true,
                stars,
                bestAt: new Date().toISOString(),
              },
            },
            skills: {
              ...prev.skills,
              language: clamp(prev.skills.language + 2, 0, 100),
            },
            xpHistory: [
              {
                id: uid('xp'),
                date: new Date().toISOString(),
                amount: xp,
                reason: `关卡 ${levelId} 通关`,
              },
              ...prev.xpHistory,
            ].slice(0, 100),
          }));
          get().actions.recordStudy(5, 'grammar', `通关 ${levelId}`, 0);
          get().actions.logEvent({
            type: 'level.completed',
            title: `通关 ${levelId}`,
            detail: `${stars} 星 · +${xp} XP`,
            level: 'success',
            module: 'grammar',
          });
          return true;
        },

        completeSort: (algorithm, comparisons, swaps) => {
          const state = get();
          const existing = state.sortingRecords[algorithm];
          const at = new Date().toISOString();
          if (existing?.completed) {
            set((prev) => ({
              sortingRecords: {
                ...prev.sortingRecords,
                [algorithm]: {
                  ...prev.sortingRecords[algorithm],
                  comparisons: Math.min(existing.comparisons, comparisons),
                  swaps: Math.min(existing.swaps, swaps),
                  at,
                },
              },
            }));
            return;
          }
          set((prev) => ({
            sortingRecords: {
              ...prev.sortingRecords,
              [algorithm]: {
                algorithm,
                completed: true,
                comparisons,
                swaps,
                at,
              },
            },
            xp: prev.xp + 15,
            skills: {
              ...prev.skills,
              algorithm: clamp(prev.skills.algorithm + 3, 0, 100),
            },
            xpHistory: [
              {
                id: uid('xp'),
                date: at,
                amount: 15,
                reason: `完成排序实验：${algorithm}`,
              },
              ...prev.xpHistory,
            ].slice(0, 100),
          }));
          get().actions.recordStudy(3, 'sort', `排序实验：${algorithm}`, 0);
          get().actions.logEvent({
            type: 'sort.completed',
            title: `排序实验：${algorithm} 跑通`,
            detail: `比较 ${comparisons} 次 · 交换 ${swaps} 次`,
            level: 'success',
            module: 'sort',
          });
        },

        startProject: (templateId) => {
          const template = PROJECT_TEMPLATES.find((item) => item.id === templateId);
          if (!template) return undefined;
          const state = get();
          const already = state.projects.some(
            (project) => project.title === template.title && project.status !== 'done',
          );
          if (already) {
            const found = state.projects.find(
              (project) => project.title === template.title && project.status !== 'done',
            );
            return found?.id;
          }
          const project = projectFromTemplate(template);
          set((prev) => ({
            projects: [project, ...prev.projects],
            xp: prev.xp + 10,
            skills: {
              ...prev.skills,
              engineering: clamp(prev.skills.engineering + 1, 0, 100),
            },
          }));
          get().actions.logEvent({
            type: 'project.created',
            title: `创建项目「${template.title}」`,
            detail: `${template.level} · 阶段 A 已解锁`,
            level: 'info',
            module: 'forge',
          });
          return project.id;
        },

        toggleProjectTask: (projectId, taskId) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              return {
                ...project,
                updatedAt: new Date().toISOString(),
                tasks: project.tasks.map((task) => {
                  if (task.id !== taskId) return task;
                  if (task.stage === 'B' && !project.stageAApproved) return task;
                  return { ...task, done: !task.done };
                }),
              };
            }),
          })),

        addProjectLog: (projectId, message, level = 'info') =>
          set((state) => ({
            projects: state.projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    updatedAt: new Date().toISOString(),
                    logs: [
                      {
                        id: uid('log'),
                        at: new Date().toISOString(),
                        level,
                        message,
                      },
                      ...project.logs,
                    ].slice(0, 80),
                  }
                : project,
            ),
          })),

        submitStageA: (projectId) => {
          const state = get();
          const project = state.projects.find((item) => item.id === projectId);
          if (!project) return false;
          if (project.stageAApproved) return true;
          if (project.tasks.some((task) => task.stage === 'A' && !task.done)) return false;
          const snapshot: ProjectSnapshot = {
            id: uid('snap'),
            label: '阶段 A · 提交',
            at: new Date().toISOString(),
            stage: 'A',
            tasks: project.tasks.map((task) => ({ ...task })),
          };
          set((prev) => ({
            projects: prev.projects.map((item) =>
              item.id === projectId
                ? {
                    ...item,
                    stage: 'B',
                    stageAApproved: true,
                    status: 'running',
                    snapshots: [snapshot, ...item.snapshots],
                    updatedAt: new Date().toISOString(),
                    logs: [
                      {
                        id: uid('log'),
                        at: new Date().toISOString(),
                        level: 'success',
                        message: '阶段 A 验收通过，阶段 B 已解锁，已生成基线快照。',
                      },
                      ...item.logs,
                    ],
                  }
                : item,
            ),
            xp: prev.xp + 20,
            skills: {
              ...prev.skills,
              engineering: clamp(prev.skills.engineering + 3, 0, 100),
            },
          }));
          get().actions.logEvent({
            type: 'project.stage',
            title: `「${project.title}」阶段 A 通过`,
            detail: '阶段 B 已解锁 · +20 XP',
            level: 'success',
            module: 'forge',
          });
          return true;
        },

        completeStageB: (projectId) => {
          const state = get();
          const project = state.projects.find((item) => item.id === projectId);
          if (!project || !project.stageAApproved) return false;
          if (project.tasks.some((task) => task.stage === 'B' && !task.done)) return false;
          const score: ProjectScore = project.score ?? {
            feature: 92,
            quality: 86,
            tests: 80,
            docs: 84,
            total: 86,
            comment: '阶段 A/B 全部完成，核心链路可跑通；建议补一组边界测试。',
            at: new Date().toISOString(),
          };
          set((prev) => ({
            projects: prev.projects.map((item) =>
              item.id === projectId
                ? {
                    ...item,
                    status: 'done',
                    stage: 'done',
                    score,
                    updatedAt: new Date().toISOString(),
                    logs: [
                      {
                        id: uid('log'),
                        at: new Date().toISOString(),
                        level: 'success',
                        message: `阶段 B 完成，项目评分 ${score.total}。`,
                      },
                      ...item.logs,
                    ],
                  }
                : item,
            ),
            xp: prev.xp + 50,
            skills: {
              ...prev.skills,
              engineering: clamp(prev.skills.engineering + 5, 0, 100),
              system: clamp(prev.skills.system + 3, 0, 100),
              product: clamp(prev.skills.product + 2, 0, 100),
            },
            goals: prev.goals.map((goal) =>
              goal.title.includes('项目')
                ? { ...goal, progress: Math.min(goal.target, goal.progress + 1) }
                : goal,
            ),
          }));
          get().actions.logEvent({
            type: 'project.completed',
            title: `「${project.title}」完成`,
            detail: `评分 ${score.total} · +50 XP`,
            level: 'success',
            module: 'forge',
          });
          return true;
        },

        saveProjectScore: (projectId, score) =>
          set((state) => ({
            projects: state.projects.map((project) =>
              project.id === projectId ? { ...project, score } : project,
            ),
          })),

        createSnapshot: (projectId, label) =>
          set((state) => ({
            projects: state.projects.map((project) =>
              project.id === projectId
                ? {
                    ...project,
                    snapshots: [
                      {
                        id: uid('snap'),
                        label,
                        at: new Date().toISOString(),
                        stage: project.stage,
                        tasks: project.tasks.map((task) => ({ ...task })),
                      },
                      ...project.snapshots,
                    ],
                  }
                : project,
            ),
          })),

        rollbackSnapshot: (projectId, snapshotId) =>
          set((state) => ({
            projects: state.projects.map((project) => {
              if (project.id !== projectId) return project;
              const snapshot = project.snapshots.find((item) => item.id === snapshotId);
              if (!snapshot) return project;
              return {
                ...project,
                stage: snapshot.stage,
                stageAApproved: snapshot.stage !== 'A',
                tasks: snapshot.tasks.map((task) => ({ ...task })),
                updatedAt: new Date().toISOString(),
                logs: [
                  {
                    id: uid('log'),
                    at: new Date().toISOString(),
                    level: 'warn',
                    message: `回滚到快照「${snapshot.label}」。`,
                  },
                  ...project.logs,
                ],
              };
            }),
          })),

        addGoal: (title, target, due) =>
          set((state) => ({
            goals: [
              ...state.goals,
              {
                id: uid('goal'),
                title,
                target,
                progress: 0,
                due,
                createdAt: new Date().toISOString(),
              },
            ],
          })),

        updateGoal: (goalId, progress) =>
          set((state) => ({
            goals: state.goals.map((goal) =>
              goal.id === goalId
                ? { ...goal, progress: Math.min(goal.target, Math.max(0, progress)) }
                : goal,
            ),
          })),

        removeGoal: (goalId) =>
          set((state) => ({
            goals: state.goals.filter((goal) => goal.id !== goalId),
          })),

        togglePromptFavorite: (promptId) =>
          set((state) => ({
            prompts: state.prompts.map((prompt) =>
              prompt.id === promptId ? { ...prompt, favorite: !prompt.favorite } : prompt,
            ),
          })),

        addPrompt: (prompt) =>
          set((state) => ({ prompts: [prompt, ...state.prompts] })),

        usePrompt: (promptId) =>
          set((state) => ({
            prompts: state.prompts.map((prompt) =>
              prompt.id === promptId ? { ...prompt, uses: prompt.uses + 1 } : prompt,
            ),
          })),

        startWorkflow: (title, role) => {
          const run = makeWorkflow(title, role);
          set((state) => ({ workflowRuns: [run, ...state.workflowRuns].slice(0, 20) }));
          get().actions.logEvent({
            type: 'ai.workflow',
            title: `启动六步工作流「${title}」`,
            detail: `角色：${role}`,
            level: 'info',
            module: 'ai',
          });
          return run.id;
        },

        toggleWorkflowCheck: (runId, stepId, checkId) =>
          set((state) => ({
            workflowRuns: state.workflowRuns.map((run) =>
              run.id === runId
                ? {
                    ...run,
                    steps: run.steps.map((step) =>
                      step.id === stepId
                        ? {
                            ...step,
                            checks: step.checks.map((check) =>
                              check.id === checkId ? { ...check, done: !check.done } : check,
                            ),
                          }
                        : step,
                    ),
                  }
                : run,
            ),
          })),

        completeWorkflow: (runId) => {
          const state = get();
          const run = state.workflowRuns.find((item) => item.id === runId);
          if (!run) return false;
          if (run.steps.some((step) => step.checks.some((check) => !check.done))) return false;
          set((prev) => ({
            workflowRuns: prev.workflowRuns.map((item) =>
              item.id === runId
                ? { ...item, status: 'done', completedAt: new Date().toISOString() }
                : item,
            ),
            xp: prev.xp + 30,
            skills: {
              ...prev.skills,
              ai: clamp(prev.skills.ai + 4, 0, 100),
              product: clamp(prev.skills.product + 1, 0, 100),
            },
            xpHistory: [
              {
                id: uid('xp'),
                date: new Date().toISOString(),
                amount: 30,
                reason: '完成六步工作流',
              },
              ...prev.xpHistory,
            ].slice(0, 100),
          }));
          get().actions.recordStudy(10, 'ai', '完成六步工作流', 0);
          get().actions.logEvent({
            type: 'ai.workflow.completed',
            title: '完成六步工作流',
            detail: run.title,
            level: 'success',
            module: 'ai',
          });
          return true;
        },

        setAiConfig: (config) =>
          set((state) => ({ aiConfig: { ...state.aiConfig, ...config } })),

        appendAiMessage: (message) =>
          set((state) => ({ aiMessages: [...state.aiMessages, message].slice(-80) })),

        clearAiMessages: () => set({ aiMessages: [] }),

        setTheme: (theme) => set({ theme }),

        setReducedMotion: (reducedMotion) => set({ reducedMotion }),

        setNickname: (nickname) =>
          set({ nickname: nickname.trim().slice(0, 12) || '新手玩家' }),

        claimQuest: (questId, xp, title) => {
          const key = dateKey();
          const claimed = get().questClaims[key] ?? [];
          if (claimed.includes(questId)) return;
          const at = new Date().toISOString();
          set((state) => ({
            xp: state.xp + xp,
            questClaims: { ...state.questClaims, [key]: [...claimed, questId] },
            xpHistory: [
              { id: uid('xp'), date: at, amount: xp, reason: `每日任务：${title}` },
              ...state.xpHistory,
            ].slice(0, 100),
          }));
          get().actions.logEvent({
            type: 'quest.claimed',
            title: `领取「${title}」`,
            detail: `+${xp} XP`,
            level: 'success',
            module: 'growth',
          });
        },

        resetUserData: () =>
          set((state) => ({
            ...createInitialState(),
            // 只重置成长档案，保留外观、昵称与 AI 配置等个人偏好。
            theme: state.theme,
            nickname: state.nickname,
            reducedMotion: state.reducedMotion,
            aiConfig: state.aiConfig,
          })),

        importData: (raw) => {
          try {
            const parsed = JSON.parse(raw) as Partial<DataState>;
            if (!parsed || typeof parsed !== 'object' || !parsed.levelProgress) return false;
            set({ ...createInitialState(), ...parsed, version: 2 });
            return true;
          } catch {
            return false;
          }
        },
      },
    }),
    {
      name: 'code-workshop:v1',
      version: 2,
      storage: createWorkshopStorage(),
      migrate: (persisted, version) => {
        // v1 存档是内置示例数据；升级到 v2 时初始化成长档案，但保留外观与 AI 配置。
        if (version < 2) {
          const old = (persisted ?? {}) as Partial<DataState>;
          const fresh = createInitialState();
          return {
            ...fresh,
            nickname: old.nickname ?? fresh.nickname,
            theme: old.theme ?? fresh.theme,
            reducedMotion: old.reducedMotion ?? fresh.reducedMotion,
            aiConfig: old.aiConfig ?? fresh.aiConfig,
          } as unknown as AppState;
        }
        return persisted as AppState;
      },
      partialize: (state) => {
        const { actions: _actions, ...data } = state;
        return data as Partial<AppState>;
      },
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<AppState>),
        actions: current.actions,
      }),
    },
  ),
);

export function useActions() {
  return useAppStore((state) => state.actions);
}

export function levelOfXp(xp: number): number {
  return Math.floor(xp / 100) + 1;
}

export function xpIntoLevel(xp: number): number {
  return xp % 100;
}
