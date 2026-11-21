import type { IconName } from '@/components/ui/Icon';

export type GameTone = 'accent' | 'success' | 'warn' | 'blue' | 'violet';

export interface QuestContext {
  minutes: number;
  levels: number;
  sorts: number;
  aiMessages: number;
}

export interface QuestDef {
  id: string;
  title: string;
  hint: string;
  xp: number;
  icon: IconName;
  target: number;
  value: (ctx: QuestContext) => number;
}

export interface DailyQuest extends QuestDef {
  current: number;
  done: boolean;
}

/** 每日任务只读取「今天」的行为，第二天自动刷新。 */
export const DAILY_QUESTS: QuestDef[] = [
  {
    id: 'quest-study',
    title: '专注 15 分钟',
    hint: '累计学习满 15 分钟',
    xp: 10,
    icon: 'clock',
    target: 15,
    value: (ctx) => ctx.minutes,
  },
  {
    id: 'quest-level',
    title: '通关一关',
    hint: '通关任意 1 个语法关卡',
    xp: 15,
    icon: 'code',
    target: 1,
    value: (ctx) => ctx.levels,
  },
  {
    id: 'quest-sort',
    title: '跑通排序',
    hint: '跑通任意 1 种排序算法',
    xp: 10,
    icon: 'sort',
    target: 1,
    value: (ctx) => ctx.sorts,
  },
  {
    id: 'quest-ai',
    title: 'AI 对话',
    hint: '向 AI 搭档提问 1 次',
    xp: 10,
    icon: 'sparkles',
    target: 1,
    value: (ctx) => ctx.aiMessages,
  },
];

export function buildDailyQuests(ctx: QuestContext): DailyQuest[] {
  return DAILY_QUESTS.map((quest) => {
    const current = Math.max(0, quest.value(ctx));
    return { ...quest, current, done: current >= quest.target };
  });
}

export interface AchievementContext {
  xp: number;
  streak: number;
  passedLevels: number;
  totalStars: number;
  sorts: number;
  projectsStarted: number;
  projectsDone: number;
  aiMessages: number;
  workflowsDone: number;
  goals: number;
}

export interface AchievementDef {
  id: string;
  title: string;
  description: string;
  icon: IconName;
  tone: GameTone;
  target: number;
  value: (ctx: AchievementContext) => number;
}

export interface Achievement extends AchievementDef {
  current: number;
  unlocked: boolean;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  {
    id: 'first-level',
    title: '初出茅庐',
    description: '通关第一个语法关卡',
    icon: 'play',
    tone: 'success',
    target: 1,
    value: (ctx) => ctx.passedLevels,
  },
  {
    id: 'ten-levels',
    title: '十关达成',
    description: '累计通关 10 个关卡',
    icon: 'code',
    tone: 'accent',
    target: 10,
    value: (ctx) => ctx.passedLevels,
  },
  {
    id: 'xp-100',
    title: '百分经验',
    description: '累计获得 100 XP',
    icon: 'bolt',
    tone: 'warn',
    target: 100,
    value: (ctx) => ctx.xp,
  },
  {
    id: 'xp-1000',
    title: '千分经验',
    description: '累计获得 1000 XP',
    icon: 'bolt',
    tone: 'warn',
    target: 1000,
    value: (ctx) => ctx.xp,
  },
  {
    id: 'sort-first',
    title: '排序入门',
    description: '跑通任意一种排序算法',
    icon: 'sort',
    tone: 'blue',
    target: 1,
    value: (ctx) => ctx.sorts,
  },
  {
    id: 'sort-all',
    title: '算法全通',
    description: '跑通全部 8 种排序算法',
    icon: 'sort',
    tone: 'violet',
    target: 8,
    value: (ctx) => ctx.sorts,
  },
  {
    id: 'first-project',
    title: '项目启动',
    description: '从模板创建第一个项目',
    icon: 'layers',
    tone: 'blue',
    target: 1,
    value: (ctx) => ctx.projectsStarted,
  },
  {
    id: 'first-delivery',
    title: '首次交付',
    description: '完成并归档第一个项目',
    icon: 'check',
    tone: 'success',
    target: 1,
    value: (ctx) => ctx.projectsDone,
  },
  {
    id: 'ai-partner',
    title: 'AI 搭档',
    description: '和 AI 搭档完成一次对话',
    icon: 'sparkles',
    tone: 'violet',
    target: 1,
    value: (ctx) => ctx.aiMessages,
  },
  {
    id: 'workflow-master',
    title: '工作流达人',
    description: '完成一次六步工作流',
    icon: 'target',
    tone: 'accent',
    target: 1,
    value: (ctx) => ctx.workflowsDone,
  },
  {
    id: 'streak-3',
    title: '三日不断',
    description: '连续学习 3 天',
    icon: 'activity',
    tone: 'success',
    target: 3,
    value: (ctx) => ctx.streak,
  },
  {
    id: 'streak-7',
    title: '七日坚持',
    description: '连续学习 7 天',
    icon: 'chart',
    tone: 'warn',
    target: 7,
    value: (ctx) => ctx.streak,
  },
  {
    id: 'star-collector',
    title: '星光收藏家',
    description: '累计获得 15 颗星',
    icon: 'star',
    tone: 'warn',
    target: 15,
    value: (ctx) => ctx.totalStars,
  },
  {
    id: 'goal-setter',
    title: '目标感',
    description: '设定第一个阶段目标',
    icon: 'target',
    tone: 'blue',
    target: 1,
    value: (ctx) => ctx.goals,
  },
];

export function buildAchievements(ctx: AchievementContext): Achievement[] {
  return ACHIEVEMENTS.map((achievement) => {
    const current = Math.max(0, achievement.value(ctx));
    return { ...achievement, current, unlocked: current >= achievement.target };
  });
}
