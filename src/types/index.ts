export type ThemeMode = 'dark' | 'light' | 'system';
export type IslandId = 'sorting' | 'python' | 'go' | 'java';
export type SortAlgorithmId =
  | 'bubble'
  | 'selection'
  | 'insertion'
  | 'shell'
  | 'merge'
  | 'quick'
  | 'heap'
  | 'radix';

export type TaskKind = 'concept' | 'choice' | 'fill' | 'order' | 'challenge';

export interface ConceptTask {
  id: string;
  kind: 'concept';
  title: string;
  body: string;
  code?: string;
  bullets?: string[];
}

export interface ChoiceTask {
  id: string;
  kind: 'choice';
  prompt: string;
  options: string[];
  answer: number;
  explanation: string;
  hint?: string;
}

export interface FillTask {
  id: string;
  kind: 'fill';
  prompt: string;
  before?: string;
  after?: string;
  answer: string;
  explanation: string;
  hint?: string;
}

export interface OrderTask {
  id: string;
  kind: 'order';
  prompt: string;
  lines: string[];
  explanation: string;
  hint?: string;
}

export interface ChallengeCheck {
  type: 'contains' | 'notContains' | 'regex';
  value: string;
  message: string;
}

export interface ChallengeTask {
  id: string;
  kind: 'challenge';
  prompt: string;
  starter: string;
  expected: string;
  checks: ChallengeCheck[];
  solution: string;
  explanation: string;
  hint?: string;
  executable?: boolean;
}

export type LevelTask = ConceptTask | ChoiceTask | FillTask | OrderTask | ChallengeTask;

export interface Level {
  id: string;
  chapterId: string;
  index: number;
  title: string;
  summary: string;
  xp: number;
  tasks: LevelTask[];
}

export interface Chapter {
  id: string;
  index: number;
  title: string;
  summary: string;
  color: string;
  levels: Level[];
}

export interface LevelProgress {
  levelId: string;
  taskIndex: number;
  completed: number[];
  attempts: number;
  hints: number;
  passed: boolean;
  stars: number;
  bestAt?: string;
}

export interface SortingRecord {
  algorithm: SortAlgorithmId;
  completed: boolean;
  comparisons: number;
  swaps: number;
  at: string;
}

export type ProjectStatus = 'not-started' | 'running' | 'paused' | 'done' | 'error';
export type ProjectStage = 'A' | 'B' | 'done';

export interface ProjectTask {
  id: string;
  title: string;
  stage: 'A' | 'B';
  done: boolean;
}

export interface ProjectLog {
  id: string;
  at: string;
  level: 'info' | 'warn' | 'error' | 'success';
  message: string;
}

export interface ProjectSnapshot {
  id: string;
  label: string;
  at: string;
  stage: ProjectStage;
  tasks: ProjectTask[];
}

export interface ProjectScore {
  feature: number;
  quality: number;
  tests: number;
  docs: number;
  total: number;
  comment: string;
  at: string;
}

export interface Project {
  id: string;
  title: string;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  summary: string;
  skills: string[];
  status: ProjectStatus;
  stage: ProjectStage;
  stageAApproved: boolean;
  tasks: ProjectTask[];
  logs: ProjectLog[];
  snapshots: ProjectSnapshot[];
  score?: ProjectScore;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectTemplate {
  id: string;
  title: string;
  level: 'L1' | 'L2' | 'L3' | 'L4';
  summary: string;
  skills: string[];
  stageA: string[];
  stageB: string[];
}

export interface AppEvent {
  id: string;
  at: string;
  type: string;
  title: string;
  detail?: string;
  level: 'info' | 'warn' | 'error' | 'success';
  module?: string;
}

export interface StudySession {
  id: string;
  module: string;
  label: string;
  date: string;
  minutes: number;
  xp: number;
  at: string;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  progress: number;
  due: string;
  createdAt: string;
}

export interface PromptTemplate {
  id: string;
  category: string;
  title: string;
  body: string;
  tags: string[];
  favorite: boolean;
  uses: number;
}

export interface WorkflowCheck {
  id: string;
  label: string;
  done: boolean;
}

export interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  checks: WorkflowCheck[];
}

export interface WorkflowRun {
  id: string;
  title: string;
  role: string;
  steps: WorkflowStep[];
  status: 'active' | 'done';
  startedAt: string;
  completedAt?: string;
}

export interface AiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  at: string;
}

export interface AiConfig {
  baseUrl: string;
  apiKey: string;
  model: string;
}

export interface ToastItem {
  id: string;
  message: string;
  tone: 'info' | 'success' | 'error';
}

export interface SkillScores {
  algorithm: number;
  language: number;
  engineering: number;
  ai: number;
  system: number;
  product: number;
}
