import { useRef, useState } from 'react';
import { Badge, Button, Card, PageHeader, SectionTitle } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useAppStore } from '@/stores/appStore';
import { useUiStore } from '@/stores/uiStore';
import { storageBackend } from '@/lib/persistence';
import type { ThemeMode } from '@/types';

export function SettingsPage() {
  const nickname = useAppStore((state) => state.nickname);
  const theme = useAppStore((state) => state.theme);
  const reducedMotion = useAppStore((state) => state.reducedMotion);
  const aiConfig = useAppStore((state) => state.aiConfig);
  const setNickname = useAppStore((state) => state.actions.setNickname);
  const setTheme = useAppStore((state) => state.actions.setTheme);
  const setReducedMotion = useAppStore((state) => state.actions.setReducedMotion);
  const setAiConfig = useAppStore((state) => state.actions.setAiConfig);
  const resetUserData = useAppStore((state) => state.actions.resetUserData);
  const importData = useAppStore((state) => state.actions.importData);
  const pushToast = useUiStore((state) => state.pushToast);

  const [draftNickname, setDraftNickname] = useState(nickname);
  const [draftConfig, setDraftConfig] = useState(aiConfig);
  const fileRef = useRef<HTMLInputElement>(null);

  function exportData() {
    const raw = JSON.stringify(useAppStore.getState(), (key, value) => (key === 'actions' ? undefined : value), 2);
    const blob = new Blob([raw], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `码上工坊-档案-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    pushToast('档案已导出', 'success');
  }

  async function importFile(file: File) {
    const text = await file.text();
    if (importData(text)) pushToast('档案已导入', 'success');
    else pushToast('导入失败：文件格式不正确', 'error');
  }

  return (
    <div className="page settings-page">
      <PageHeader
        eyebrow="WORKSPACE / SETTINGS"
        title="工作台设置"
        description="主题、档案与模型配置都保存在本机；换机时用导出 / 导入迁移。"
        actions={<Badge tone="success" dot>本地优先</Badge>}
      />

      <div className="settings-grid">
        <div className="stack">
          <Card>
            <SectionTitle title="外观" hint="主题与动效" />
            <div className="theme-options">
              {([
                ['dark', '暗色', 'moon'],
                ['light', '亮色', 'sun'],
                ['system', '跟随系统', 'monitor'],
              ] as Array<[ThemeMode, string, 'moon' | 'sun' | 'monitor']>).map(([id, label, icon]) => (
                <button
                  key={id}
                  type="button"
                  className={`theme-option${theme === id ? ' is-active' : ''}`}
                  onClick={() => setTheme(id)}
                >
                  <Icon name={icon} size={18} />
                  <span>{label}</span>
                  {theme === id ? <Icon name="check" size={14} /> : null}
                </button>
              ))}
            </div>
            <label className="setting-row">
              <div>
                <strong>减弱动效</strong>
                <span>关闭图表入场、悬停位移等非必要动画</span>
              </div>
              <button
                type="button"
                className={`toggle${reducedMotion ? ' is-on' : ''}`}
                aria-pressed={reducedMotion}
                onClick={() => setReducedMotion(!reducedMotion)}
              >
                <i />
              </button>
            </label>
          </Card>

          <Card>
            <SectionTitle title="档案" hint="只在本机保存" />
            <div className="field">
              <label htmlFor="nickname">昵称（1–12 个字符）</label>
              <div className="row">
                <input
                  id="nickname"
                  className="input"
                  value={draftNickname}
                  maxLength={12}
                  onChange={(event) => setDraftNickname(event.target.value)}
                />
                <Button
                  onClick={() => {
                    setNickname(draftNickname);
                    pushToast('昵称已更新', 'success');
                  }}
                >
                  保存
                </Button>
              </div>
            </div>
            <div className="settings-actions">
              <Button icon="download" onClick={exportData}>导出档案</Button>
              <Button icon="upload" onClick={() => fileRef.current?.click()}>导入档案</Button>
              <input
                ref={fileRef}
                type="file"
                accept="application/json"
                hidden
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) importFile(file);
                  event.target.value = '';
                }}
              />
              <Button
                variant="danger"
                icon="trash"
                onClick={() => {
                  if (window.confirm('初始化会清空等级、XP、学习记录、关卡进度、项目与目标，且不可恢复。确定继续？')) {
                    resetUserData();
                    pushToast('用户数据已初始化', 'success');
                  }
                }}
              >
                初始化数据
              </Button>
            </div>
          </Card>
        </div>

        <div className="stack">
          <Card>
            <SectionTitle title="AI 模型" hint="OpenAI 兼容接口" />
            <div className="stack">
              <div className="field">
                <label htmlFor="settings-base">Base URL</label>
                <input id="settings-base" className="input" value={draftConfig.baseUrl} onChange={(event) => setDraftConfig((prev) => ({ ...prev, baseUrl: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="settings-model">模型</label>
                <input id="settings-model" className="input" value={draftConfig.model} onChange={(event) => setDraftConfig((prev) => ({ ...prev, model: event.target.value }))} />
              </div>
              <div className="field">
                <label htmlFor="settings-key">API Key</label>
                <input
                  id="settings-key"
                  className="input"
                  type="password"
                  value={draftConfig.apiKey}
                  onChange={(event) => setDraftConfig((prev) => ({ ...prev, apiKey: event.target.value }))}
                  placeholder="留空使用演示模式"
                />
              </div>
              <Button
                variant="primary"
                onClick={() => {
                  setAiConfig(draftConfig);
                  pushToast('模型配置已保存', 'success');
                }}
              >
                保存模型配置
              </Button>
              <p className="settings-hint">
                Key 保存在本机档案中（桌面端 SQLite / 网页端 localStorage）。若使用公共电脑，请在使用后清空并重置档案。
              </p>
            </div>
          </Card>

          <Card>
            <SectionTitle title="关于" hint="码上工坊 v0.1.0" />
            <div className="about-list">
              <div><span>产品形态</span><strong>桌面端一体化工作台（Web 预览版）</strong></div>
              <div><span>技术栈</span><strong>React 18 · TypeScript · Vite · Zustand · ECharts</strong></div>
              <div><span>数据存储</span><strong>{storageBackend() === 'SQLite' ? 'SQLite · tauri-plugin-sql' : '浏览器 localStorage · 本地优先'}</strong></div>
              <div><span>文档</span><strong>项目文档 v1.1 · 2026-11-21</strong></div>
            </div>
            <div className="settings-actions">
              <Button variant="ghost" icon="external" onClick={() => window.open('https://vitejs.dev', '_blank')}>Vite</Button>
              <Button variant="ghost" icon="external" onClick={() => window.open('https://echarts.apache.org', '_blank')}>ECharts</Button>
            </div>
          </Card>

          <Card className="settings-note">
            <Icon name="info" size={15} />
            <p>这是码上工坊的 P0 完整流程预览：外壳、工作台、排序、语法、项目、AI、监控与成长八个模块已打通。真实进程采集与安装包是下一步。</p>
          </Card>
        </div>
      </div>
    </div>
  );
}
