import { createJSONStorage, type PersistStorage, type StorageValue } from 'zustand/middleware';
import type { AppState } from '@/stores/appStore';

const DB_URL = 'sqlite:code-workshop.db';
const STATE_ID = 1;
const MIRROR_THROTTLE_MS = 2500;

export const isTauriRuntime =
  typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export function storageBackend(): 'SQLite' | 'localStorage' {
  return isTauriRuntime ? 'SQLite' : 'localStorage';
}

type WorkshopDatabase = {
  select: (sql: string, params?: unknown[]) => Promise<Array<Record<string, unknown>>>;
  execute: (sql: string, params?: unknown[]) => Promise<unknown>;
};

let databasePromise: Promise<WorkshopDatabase> | null = null;

async function database(): Promise<WorkshopDatabase> {
  if (!databasePromise) {
    databasePromise = (async () => {
      const { default: Database } = await import('@tauri-apps/plugin-sql');
      return (await Database.load(DB_URL)) as unknown as WorkshopDatabase;
    })().catch((error) => {
      // 失败后允许下次重试，避免一次临时错误把适配器永久锁死。
      databasePromise = null;
      throw error;
    });
  }
  return databasePromise;
}

function readLocal(name: string): string | null {
  try {
    return window.localStorage.getItem(name);
  } catch {
    return null;
  }
}

function stateOf(value: string): AppState | null {
  try {
    const parsed = JSON.parse(value) as StorageValue<AppState> | AppState;
    const state = 'state' in parsed ? parsed.state : parsed;
    return state && typeof state === 'object' ? (state as AppState) : null;
  } catch {
    return null;
  }
}

/**
 * 把整份存档里的派生数据写入镜像表，供 SQL 查询/统计使用。
 * 主数据始终以 workshop_state.payload 为准，镜像表写失败不影响主数据。
 */
async function writeMirrors(db: WorkshopDatabase, value: string): Promise<void> {
  const state = stateOf(value);
  if (!state) return;
  try {
    await db.execute('DELETE FROM workshop_events');
    for (const event of state.events.slice(0, 120)) {
      await db.execute(
        'INSERT OR REPLACE INTO workshop_events (id, at, type, title, detail, level, module) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [event.id, event.at, event.type, event.title, event.detail ?? null, event.level, event.module ?? null],
      );
    }
    await db.execute('DELETE FROM workshop_sessions');
    for (const session of state.sessions.slice(0, 120)) {
      await db.execute(
        'INSERT OR REPLACE INTO workshop_sessions (id, module, label, date, minutes, xp, at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [session.id, session.module, session.label, session.date, session.minutes, session.xp, session.at],
      );
    }
    await db.execute('DELETE FROM workshop_projects');
    for (const project of state.projects) {
      await db.execute(
        'INSERT OR REPLACE INTO workshop_projects (id, title, level, status, stage, score, updated_at) VALUES ($1,$2,$3,$4,$5,$6,$7)',
        [project.id, project.title, project.level, project.status, project.stage, project.score?.total ?? null, project.updatedAt],
      );
    }
    await db.execute(
      'INSERT OR REPLACE INTO workshop_meta (key, value) VALUES ($1,$2)',
      ['last_saved_at', new Date().toISOString()],
    );
    await db.execute(
      'INSERT OR REPLACE INTO workshop_meta (key, value) VALUES ($1,$2)',
      ['schema_version', '1'],
    );
  } catch (error) {
    console.warn('[code-workshop] SQLite mirror sync failed', error);
  }
}

let lastMirrorAt = 0;
let mirrorTimer: ReturnType<typeof setTimeout> | null = null;
let pendingMirror: { db: WorkshopDatabase; value: string } | null = null;

/**
 * 镜像同步带 2.5 秒节流，但使用「尾部调度」：
 * 节流窗口内的最后一次写入会在窗口结束后补写，不会像旧实现那样被直接丢弃。
 */
function scheduleMirrors(db: WorkshopDatabase, value: string): void {
  pendingMirror = { db, value };
  if (mirrorTimer) return;
  const wait = Math.max(0, MIRROR_THROTTLE_MS - (Date.now() - lastMirrorAt));
  mirrorTimer = setTimeout(() => {
    mirrorTimer = null;
    void flushMirrors();
  }, wait);
}

/**
 * 立即把待写入的镜像表落库。
 * 在页面隐藏、窗口关闭、beforeunload 时调用，避免退出前最后 2.5 秒的镜像丢失。
 */
export async function flushMirrors(): Promise<void> {
  if (mirrorTimer) {
    clearTimeout(mirrorTimer);
    mirrorTimer = null;
  }
  const job = pendingMirror;
  pendingMirror = null;
  if (!job) return;
  lastMirrorAt = Date.now();
  await writeMirrors(job.db, job.value);
}

/** 供退出流程使用：等待镜像 flush 完成，但不阻塞太久。 */
export async function flushStorage(timeoutMs = 1500): Promise<void> {
  await Promise.race([
    flushMirrors(),
    new Promise<void>((resolve) => setTimeout(resolve, timeoutMs)),
  ]);
}

let migrationPromise: Promise<void> | null = null;

/**
 * 一次性迁移：桌面端首次启动、SQLite 里还没有存档时，
 * 把浏览器 localStorage 里的旧档案导入 SQLite，并同步镜像表。
 * 保留 localStorage 作为备份，不删除。
 */
async function migrateLocalStorage(db: WorkshopDatabase, name: string): Promise<void> {
  const rows = await db.select('SELECT payload FROM workshop_state WHERE id = $1', [STATE_ID]);
  if (rows.length > 0) return;
  const legacy = readLocal(name);
  if (!legacy) return;
  try {
    JSON.parse(legacy);
  } catch {
    return;
  }
  await db.execute(
    'INSERT INTO workshop_state (id, payload, updated_at) VALUES ($1, $2, $3) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at',
    [STATE_ID, legacy, new Date().toISOString()],
  );
  await writeMirrors(db, legacy);
  await db.execute(
    'INSERT OR REPLACE INTO workshop_meta (key, value) VALUES ($1,$2)',
    ['migrated_from', 'localStorage'],
  );
  console.info('[code-workshop] 已把 localStorage 档案迁移到 SQLite');
}

function ensureMigrated(db: WorkshopDatabase, name: string): Promise<void> {
  if (!migrationPromise) {
    migrationPromise = migrateLocalStorage(db, name).catch((error) => {
      console.warn('[code-workshop] localStorage → SQLite migration failed', error);
    });
  }
  return migrationPromise;
}

async function getItem(name: string): Promise<string | null> {
  if (isTauriRuntime) {
    try {
      const db = await database();
      await ensureMigrated(db, name);
      const rows = await db.select('SELECT payload FROM workshop_state WHERE id = $1', [STATE_ID]);
      const payload = rows[0]?.payload;
      if (typeof payload === 'string' && payload.length > 0) return payload;
    } catch (error) {
      console.warn('[code-workshop] SQLite read failed; falling back to localStorage', error);
    }
  }
  return readLocal(name);
}

async function setItem(name: string, value: string): Promise<void> {
  if (isTauriRuntime) {
    try {
      const db = await database();
      await db.execute(
        'INSERT INTO workshop_state (id, payload, updated_at) VALUES ($1, $2, $3) ON CONFLICT(id) DO UPDATE SET payload = excluded.payload, updated_at = excluded.updated_at',
        [STATE_ID, value, new Date().toISOString()],
      );
      scheduleMirrors(db, value);
      return;
    } catch (error) {
      console.warn('[code-workshop] SQLite write failed; falling back to localStorage', error);
    }
  }
  try {
    window.localStorage.setItem(name, value);
  } catch (error) {
    console.warn('[code-workshop] localStorage write failed', error);
  }
}

async function removeItem(name: string): Promise<void> {
  if (isTauriRuntime) {
    try {
      const db = await database();
      pendingMirror = null;
      if (mirrorTimer) {
        clearTimeout(mirrorTimer);
        mirrorTimer = null;
      }
      await db.execute('DELETE FROM workshop_state WHERE id = $1', [STATE_ID]);
      await db.execute('DELETE FROM workshop_events');
      await db.execute('DELETE FROM workshop_sessions');
      await db.execute('DELETE FROM workshop_projects');
    } catch (error) {
      console.warn('[code-workshop] SQLite clear failed', error);
    }
  }
  try {
    window.localStorage.removeItem(name);
  } catch {
    /* ignore */
  }
}

export function createWorkshopStorage(): PersistStorage<Partial<AppState>> | undefined {
  return createJSONStorage<Partial<AppState>>(() => ({ getItem, setItem, removeItem }));
}
