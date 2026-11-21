import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes, Link } from 'react-router-dom';
import { AppShell } from '@/components/shell/AppShell';
import { useAppStore } from '@/stores/appStore';
import { flushStorage, isTauriRuntime } from '@/lib/persistence';
import { WorkbenchPage } from '@/pages/WorkbenchPage';
import { SortPage } from '@/pages/SortPage';
import { GrammarPage } from '@/pages/GrammarPage';
import { ChapterPage } from '@/pages/ChapterPage';
import { LevelPage } from '@/pages/LevelPage';
import { ForgePage } from '@/pages/ForgePage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { AiPage } from '@/pages/AiPage';
import { MonitorPage } from '@/pages/MonitorPage';
import { GrowthPage } from '@/pages/GrowthPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { EmptyState } from '@/components/ui/primitives';

const HYDRATION_TIMEOUT_MS = 5000;

export default function App() {
  const [hydrated, setHydrated] = useState(() => useAppStore.persist.hasHydrated());
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const unsubscribe = useAppStore.persist.onFinishHydration(() => setHydrated(true));
    setHydrated(useAppStore.persist.hasHydrated());
    const timer = window.setTimeout(() => {
      if (!useAppStore.persist.hasHydrated()) setTimedOut(true);
    }, HYDRATION_TIMEOUT_MS);
    return () => {
      unsubscribe();
      window.clearTimeout(timer);
    };
  }, []);

  // 页面隐藏 / 关闭 / 桌面端窗口关闭前，把待写入的镜像表立即落库。
  useEffect(() => {
    const flush = () => {
      void flushStorage();
    };
    const onVisibility = () => {
      if (document.visibilityState === 'hidden') flush();
    };
    window.addEventListener('pagehide', flush);
    window.addEventListener('beforeunload', flush);
    document.addEventListener('visibilitychange', onVisibility);

    let unlisten: (() => void) | undefined;
    let disposed = false;
    if (isTauriRuntime) {
      void import('@tauri-apps/api/window')
        .then(async ({ getCurrentWindow }) => {
          const appWindow = getCurrentWindow();
          const stop = await appWindow.onCloseRequested(async (event) => {
            event.preventDefault();
            await flushStorage();
            await appWindow.destroy();
          });
          if (disposed) stop();
          else unlisten = stop;
        })
        .catch((error) => console.warn('[code-workshop] 窗口关闭钩子不可用', error));
    }

    return () => {
      disposed = true;
      window.removeEventListener('pagehide', flush);
      window.removeEventListener('beforeunload', flush);
      document.removeEventListener('visibilitychange', onVisibility);
      unlisten?.();
    };
  }, []);

  if (!hydrated && !timedOut) {
    return (
      <div className="boot-screen">
        <div className="boot-mark">
          <i />
          <i />
          <i />
        </div>
        <strong>码上工坊</strong>
        <span>正在读取本地档案…</span>
      </div>
    );
  }

  if (!hydrated && timedOut) {
    return (
      <div className="boot-screen">
        <div className="boot-mark">
          <i />
          <i />
          <i />
        </div>
        <strong>本地档案读取较慢</strong>
        <span>SQLite 或 localStorage 在 5 秒内没有响应，可以先进入工作台继续使用。</span>
        <button
          type="button"
          className="btn btn-primary"
          style={{ marginTop: 10 }}
          onClick={() => setHydrated(true)}
        >
          先进入工作台
        </button>
      </div>
    );
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<WorkbenchPage />} />
          <Route path="/sort" element={<SortPage />} />
          <Route path="/grammar" element={<GrammarPage />} />
          <Route path="/grammar/:chapterId" element={<ChapterPage />} />
          <Route path="/grammar/:chapterId/:levelId" element={<LevelPage />} />
          <Route path="/forge" element={<ForgePage />} />
          <Route path="/forge/:projectId" element={<ProjectDetailPage />} />
          <Route path="/ai" element={<AiPage />} />
          <Route path="/monitor" element={<MonitorPage />} />
          <Route path="/growth" element={<GrowthPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route
            path="*"
            element={
              <div className="page">
                <EmptyState
                  icon="layers"
                  title="页面不存在"
                  description="这个地址没有对应的工作台页面。"
                  action={<Link className="btn btn-primary" to="/">回到工作台</Link>}
                />
              </div>
            }
          />
        </Route>
      </Routes>
    </HashRouter>
  );
}
