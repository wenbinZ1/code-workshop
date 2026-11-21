import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useMemo } from 'react';
import clsx from 'clsx';
import { Icon, type IconName } from '@/components/ui/Icon';
import { Breadcrumbs, Progress, type CrumbItem } from '@/components/ui/primitives';
import { ToastHost } from '@/components/ui/ToastHost';
import { useAppStore, levelOfXp, xpIntoLevel } from '@/stores/appStore';
import { useUiStore } from '@/stores/uiStore';
import { useResolvedTheme } from '@/hooks/useResolvedTheme';
import { CURRICULUM, findChapter, findLevel } from '@/data/curriculum';

interface NavItem {
  to: string;
  label: string;
  icon: IconName;
  hint?: string;
}

const NAV_GROUPS: Array<{ title: string; items: NavItem[] }> = [
  {
    title: '学习',
    items: [
      { to: '/', label: '工作台', icon: 'home' },
      { to: '/grammar', label: '语法闯关', icon: 'code', hint: 'Python' },
      { to: '/sort', label: '排序实验室', icon: 'sort' },
    ],
  },
  {
    title: '创造',
    items: [
      { to: '/forge', label: '项目工坊', icon: 'layers' },
      { to: '/ai', label: 'AI 训练场', icon: 'sparkles' },
    ],
  },
  {
    title: '洞察',
    items: [
      { to: '/monitor', label: '监控台', icon: 'activity' },
      { to: '/growth', label: '成长档案', icon: 'chart' },
    ],
  },
];

const SECTIONS: Record<string, { title: string; to: string }> = {
  grammar: { title: '语法闯关', to: '/grammar' },
  sort: { title: '排序实验室', to: '/sort' },
  forge: { title: '项目工坊', to: '/forge' },
  ai: { title: 'AI 训练场', to: '/ai' },
  monitor: { title: '监控台', to: '/monitor' },
  growth: { title: '成长档案', to: '/growth' },
  settings: { title: '设置', to: '/settings' },
};

/** 把当前 hash 路由解析成可点击的面包屑，父级都指向真实页面。 */
function useCrumbs(): CrumbItem[] {
  const { pathname } = useLocation();
  const projects = useAppStore((state) => state.projects);

  return useMemo(() => {
    const parts = pathname.split('/').filter(Boolean);
    const crumbs: CrumbItem[] = [{ label: '工作台', to: '/', icon: 'home' }];
    const section = parts[0] ? SECTIONS[parts[0]] : null;
    if (!section) return crumbs;

    crumbs.push({ label: section.title, to: section.to });

    if (parts[0] === 'grammar' && parts[1]) {
      const chapter = findChapter(parts[1]);
      crumbs.push({ label: chapter?.title ?? '章节', to: `/grammar/${parts[1]}` });
      if (parts[2]) {
        const level = findLevel(parts[1], parts[2]);
        crumbs.push({ label: level?.title ?? '关卡' });
      }
    } else if (parts[0] === 'forge' && parts[1]) {
      const project = projects.find((item) => item.id === parts[1]);
      crumbs.push({ label: project?.title ?? '项目详情' });
    }

    // 顶栏只保留「工作台 + 当前页」，完整层级交给页面内面包屑，避免同一路径重复两次。
    return crumbs.length > 2 ? [crumbs[0], crumbs[crumbs.length - 1]] : crumbs;
  }, [pathname, projects]);
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <i />
      <i />
      <i />
      <svg viewBox="0 0 40 40">
        <path d="M7 27 15 20l7 4 11-13" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="33" cy="11" r="2.6" fill="currentColor" />
      </svg>
    </span>
  );
}

function Sidebar() {
  const location = useLocation();
  const xp = useAppStore((state) => state.xp);
  const nickname = useAppStore((state) => state.nickname);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const level = levelOfXp(xp);
  const levelProgress = useAppStore((state) => state.levelProgress);
  const nextLevel = useMemo(() => {
    for (const chapter of CURRICULUM) {
      for (const levelItem of chapter.levels) {
        if (!levelProgress[levelItem.id]?.passed) return { chapter, level: levelItem };
      }
    }
    return null;
  }, [levelProgress]);

  return (
    <>
      <aside className={clsx('sidebar', sidebarOpen && 'is-open')}>
        <div className="brand">
          <BrandMark />
          <div className="brand-copy">
            <strong>码上工坊</strong>
            <span>CODE WORKSHOP</span>
          </div>
        </div>

        <NavLink
          to={nextLevel ? `/grammar/${nextLevel.chapter.id}/${nextLevel.level.id}` : '/grammar'}
          className="sidebar-cta"
          viewTransition
          onClick={() => setSidebarOpen(false)}
        >
          <span className="sidebar-cta-icon">
            <Icon name="bolt" size={16} />
          </span>
          <span>
            <strong>{nextLevel ? '继续上次学习' : '全部关卡已通关'}</strong>
            <small>
              {nextLevel ? `${nextLevel.chapter.title} · ${nextLevel.level.title}` : '去项目工坊做点东西'}
            </small>
          </span>
          <Icon name="arrowRight" size={15} />
        </NavLink>

        <nav className="nav">
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.title}>
              <div className="nav-group-title">{group.title}</div>
              {group.items.map((item) => {
                const active = item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to);
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={clsx('nav-item', active && 'is-active')}
                    viewTransition
                    onClick={() => setSidebarOpen(false)}
                  >
                    <Icon name={item.icon} size={17} />
                    <span>{item.label}</span>
                    {item.hint ? <em>{item.hint}</em> : null}
                    {active ? <i className="nav-active-dot" /> : null}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="profile-card">
            <div className="avatar">{nickname.slice(0, 1)}</div>
            <div className="profile-copy">
              <strong>{nickname}</strong>
              <span>Lv.{level} · {xpIntoLevel(xp)}/100 XP</span>
            </div>
            <NavLink to="/settings" aria-label="设置" className="icon-btn">
              <Icon name="settings" size={16} />
            </NavLink>
          </div>
          <Progress value={xpIntoLevel(xp)} className="sidebar-progress" />
          <div className="sidebar-meta">
            <span>本地优先</span>
            <span>v0.1.0</span>
          </div>
        </div>
      </aside>
      {sidebarOpen ? <button type="button" className="sidebar-mask" aria-label="关闭导航" onClick={() => setSidebarOpen(false)} /> : null}
    </>
  );
}

function Topbar() {
  const setTheme = useAppStore((state) => state.actions.setTheme);
  const sidebarOpen = useUiStore((state) => state.sidebarOpen);
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);
  const resolved = useResolvedTheme();
  const xp = useAppStore((state) => state.xp);
  const nickname = useAppStore((state) => state.nickname);
  const crumbs = useCrumbs();
  const today = new Date().toLocaleDateString('zh-CN', {
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  });

  function toggleTheme() {
    setTheme(resolved === 'dark' ? 'light' : 'dark');
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        <button
          type="button"
          className="icon-btn topbar-menu"
          aria-label={sidebarOpen ? '隐藏导航' : '显示导航'}
          onClick={() => setSidebarOpen(!sidebarOpen)}
        >
          <Icon name="menu" size={18} />
        </button>
        <Breadcrumbs items={crumbs} className="topbar-breadcrumbs" />
      </div>
      <div className="topbar-right">
        <span className="topbar-date">{today}</span>
        <span className="topbar-divider" />
        <span className="topbar-xp">
          <Icon name="bolt" size={14} />
          {xp.toLocaleString('zh-CN')} XP
        </span>
        <button
          type="button"
          className="icon-btn"
          aria-label="切换主题"
          title={`切换到${resolved === 'dark' ? '亮色' : '暗色'}`}
          onClick={toggleTheme}
        >
          <Icon name={resolved === 'dark' ? 'sun' : 'moon'} size={17} />
        </button>
        <NavLink to="/settings" className="avatar avatar-sm" aria-label="打开设置">
          {nickname.slice(0, 1)}
        </NavLink>
      </div>
    </header>
  );
}

/**
 * 全局指针效果：
 * 1. 卡片柔光跟随鼠标；
 * 2. 按钮/导航点击时生成涟漪。
 * 两者都用 rAF 合帧，避免高频 pointermove 触发过多重排。
 */
function useSurfaceEffects() {
  useEffect(() => {
    const reduced = () => document.documentElement.dataset.reducedMotion === 'true';
    let frame = 0;
    let pointer: { x: number; y: number; target: Element } | null = null;

    const paint = () => {
      frame = 0;
      if (!pointer || reduced()) return;
      const card = pointer.target.closest('.card');
      if (!card) return;
      const rect = card.getBoundingClientRect();
      (card as HTMLElement).style.setProperty('--mx', `${pointer.x - rect.left}px`);
      (card as HTMLElement).style.setProperty('--my', `${pointer.y - rect.top}px`);
    };

    const onMove = (event: PointerEvent) => {
      const target = event.target;
      if (!(target instanceof Element)) return;
      pointer = { x: event.clientX, y: event.clientY, target };
      if (!frame) frame = requestAnimationFrame(paint);
    };

    const onDown = (event: PointerEvent) => {
      if (event.button !== 0 || reduced()) return;
      const target = event.target;
      if (!(target instanceof Element)) return;
      const host = target.closest('.btn, .icon-btn, .nav-item, .island-tile');
      if (!host) return;
      if (host instanceof HTMLButtonElement && host.disabled) return;
      const rect = host.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'click-ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      host.appendChild(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    };

    document.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerdown', onDown, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerdown', onDown);
    };
  }, []);
}

export function AppShell() {
  const theme = useAppStore((state) => state.theme);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const resolved = useResolvedTheme();
  const location = useLocation();
  const setSidebarOpen = useUiStore((state) => state.setSidebarOpen);

  useSurfaceEffects();

  useEffect(() => {
    document.documentElement.dataset.theme = resolved;
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false';
  }, [resolved, reducedMotion]);

  useEffect(() => {
    document.querySelector('.content')?.scrollTo({ top: 0 });
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }, [location.pathname, setSidebarOpen]);

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">跳到主要内容</a>
      <Sidebar />
      <main className="main">
        <Topbar />
        <div className="content" id="main-content" tabIndex={-1}>
          {/* 路径变化即重建页面：面包屑返回时，筛选、选中项、运行动画等页面瞬态数据全部归零。 */}
          <div className="route-view" key={location.pathname}>
            <Outlet />
          </div>
        </div>
      </main>
      <ToastHost />
    </div>
  );
}
