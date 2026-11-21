import { useMemo, useState } from 'react';
import clsx from 'clsx';
import { Badge, Button, Card, PageHeader, Progress, Ring, SectionTitle, Tabs } from '@/components/ui/primitives';
import { Icon } from '@/components/ui/Icon';
import { useAppStore } from '@/stores/appStore';
import { useUiStore } from '@/stores/uiStore';
import { PROMPT_CATEGORIES } from '@/data/prompts';
import { relativeTime } from '@/lib/time';
import type { AiMessage, PromptTemplate } from '@/types';

type AiTab = 'chat' | 'prompts' | 'workflow' | 'roles';

const ROLES = [
  { id: 'engineer', name: '工程师视角', icon: 'terminal' as const, focus: '实现质量、性能、可维护性', color: 'var(--green)' },
  { id: 'architect', name: '架构师视角', icon: 'layers' as const, focus: '模块划分、扩展性、技术选型', color: 'var(--blue)' },
  { id: 'product', name: '产品经理视角', icon: 'target' as const, focus: '需求合理性、用户价值、优先级', color: 'var(--amber)' },
];

function demoReply(input: string): string {
  const text = input.trim() || '这个需求';
  return [
    `先把你说的「${text.slice(0, 32)}」拆成可验证的小问题：`,
    '',
    '1. 目标用户是谁？他在什么场景下会用它？',
    '2. 最小可用闭环是什么？只保留一个必须完成的任务。',
    '3. 输入、输出、失败态分别是什么？',
    '',
    '建议的下一步：',
    '- 先写 3 条验收标准（Given / When / Then）',
    '- 用一张表列出“必须做 / 可以后做 / 不做”',
    '- 再让 AI 生成代码，并要求它先复述接口',
    '',
    '如果你愿意，我可以继续把这三点展开成任务清单。',
  ].join('\n');
}

function roleDemo(role: string, requirement: string): string {
  if (role === 'engineer') {
    return [
      '实现路径',
      `1. 把「${requirement.slice(0, 24)}」拆成输入解析、核心逻辑、持久化三层。`,
      '2. 先定义接口与数据结构，再写最小实现。',
      '3. 边界：空输入、重复项、超长文本、存储失败。',
      '4. 验收：主链路可跑 + 3 条回归用例。',
      '',
      '最先做：一个能跑通的最小版本，而不是完整框架。',
    ].join('\n');
  }
  if (role === 'architect') {
    return [
      '架构视角',
      '模块：CLI / 应用服务 / 存储适配器 / 展示层。',
      '接口：TaskRepository（list/add/toggle/remove），应用服务只依赖接口。',
      '取舍：先本地 JSON，后续可替换 SQLite；不要在 MVP 引入消息队列。',
      '风险：数据迁移与并发写入，先用单进程 + 文件锁规避。',
      '',
      '结论：先做可替换的存储边界，再谈扩展。',
    ].join('\n');
  }
  return [
    '产品视角',
    '用户故事：作为一个想坚持学习的人，我希望快速记录今天的任务，以便不靠记忆。',
    'MVP：新增、查看、完成、删除 + 本地保存。',
    '不做：账号、云同步、协作、复杂标签体系。',
    '成功指标：首次使用 3 分钟内完成第一条任务；7 日留存 > 25%。',
    '',
    '优先级：可用 > 好看 > 可扩展。',
  ].join('\n');
}

export function AiPage() {
  const [tab, setTab] = useState<AiTab>('chat');
  const [configOpen, setConfigOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [promptCategory, setPromptCategory] = useState('全部');
  const [promptSearch, setPromptSearch] = useState('');
  const [selectedPrompt, setSelectedPrompt] = useState<PromptTemplate | null>(null);
  const [workflowTitle, setWorkflowTitle] = useState('把命令行待办清单做成可交付项目');
  const [workflowRole, setWorkflowRole] = useState('工程师');
  const [roleRequirement, setRoleRequirement] = useState('做一个命令行待办清单，支持优先级和标签。');
  const [roleOutputs, setRoleOutputs] = useState<Record<string, string>>({});
  const [draftConfig, setDraftConfig] = useState({ baseUrl: '', apiKey: '', model: '' });
  const [showKey, setShowKey] = useState(false);

  const messages = useAppStore((state) => state.aiMessages);
  const config = useAppStore((state) => state.aiConfig);
  const prompts = useAppStore((state) => state.prompts);
  const workflowRuns = useAppStore((state) => state.workflowRuns);
  const appendMessage = useAppStore((state) => state.actions.appendAiMessage);
  const clearMessages = useAppStore((state) => state.actions.clearAiMessages);
  const setAiConfig = useAppStore((state) => state.actions.setAiConfig);
  const toggleFavorite = useAppStore((state) => state.actions.togglePromptFavorite);
  const usePrompt = useAppStore((state) => state.actions.usePrompt);
  const startWorkflow = useAppStore((state) => state.actions.startWorkflow);
  const toggleCheck = useAppStore((state) => state.actions.toggleWorkflowCheck);
  const completeWorkflow = useAppStore((state) => state.actions.completeWorkflow);
  const pushToast = useUiStore((state) => state.pushToast);

  const filteredPrompts = useMemo(
    () =>
      prompts.filter((prompt) => {
        const cat = promptCategory === '全部' || prompt.category === promptCategory;
        const key = promptSearch.trim().toLowerCase();
        return cat && (!key || `${prompt.title} ${prompt.body} ${prompt.tags.join(' ')}`.toLowerCase().includes(key));
      }),
    [promptCategory, promptSearch, prompts],
  );

  const activeRun = workflowRuns.find((run) => run.status === 'active');
  const activeProgress = activeRun
    ? activeRun.steps.reduce((sum, step) => sum + step.checks.filter((check) => check.done).length, 0) /
      activeRun.steps.reduce((sum, step) => sum + step.checks.length, 0)
    : 0;

  async function send() {
    const text = input.trim();
    if (!text || sending) return;
    const userMessage: AiMessage = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: text,
      at: new Date().toISOString(),
    };
    appendMessage(userMessage);
    setInput('');
    setSending(true);
    try {
      let reply = '';
      if (config.apiKey.trim()) {
        const base = config.baseUrl.replace(/\/+$/, '');
        const response = await fetch(`${base}/chat/completions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${config.apiKey}`,
          },
          body: JSON.stringify({
            model: config.model || 'deepseek-chat',
            temperature: 0.4,
            messages: [
              {
                role: 'system',
                content:
                  '你是码上工坊的 AI 开发搭档。回答要分步骤、给可执行动作，不要一次塞满。',
              },
              ...messages.slice(-8).map((message) => ({ role: message.role, content: message.content })),
              { role: 'user', content: text },
            ],
          }),
        });
        if (!response.ok) {
          throw new Error(`请求失败：${response.status} ${response.statusText}`);
        }
        const data = (await response.json()) as {
          choices?: Array<{ message?: { content?: string } }>;
        };
        reply = data.choices?.[0]?.message?.content?.trim() ?? '';
        if (!reply) throw new Error('模型返回为空');
      } else {
        await new Promise((resolve) => window.setTimeout(resolve, 450));
        reply = demoReply(text);
      }
      appendMessage({
        id: `msg-${Date.now()}-a`,
        role: 'assistant',
        content: reply,
        at: new Date().toISOString(),
      });
    } catch (error) {
      pushToast(error instanceof Error ? error.message : '请求失败', 'error');
      appendMessage({
        id: `msg-${Date.now()}-e`,
        role: 'assistant',
        content: `请求失败：${error instanceof Error ? error.message : '未知错误'}。可以在右上角配置模型，或先使用内置演示回复。`,
        at: new Date().toISOString(),
      });
    } finally {
      setSending(false);
    }
  }

  function openConfig() {
    setDraftConfig(config);
    setConfigOpen(true);
  }

  function applyPrompt(prompt: PromptTemplate) {
    setInput(prompt.body);
    usePrompt(prompt.id);
    setTab('chat');
    setSelectedPrompt(null);
    pushToast('提示词已放入输入框', 'success');
  }

  return (
    <div className="page ai-page">
      <PageHeader
        eyebrow="BUILD / COLLABORATION"
        title="AI 开发训练场"
        description="不是让 AI 替你写代码，而是训练“说清需求 → 拆任务 → 审结果 → 让 AI 改”的协作能力。"
        actions={
          <>
            <Badge tone={config.apiKey ? 'success' : 'warn'} dot>
              {config.apiKey ? `已配置 · ${config.model}` : '演示模式'}
            </Badge>
            <Button icon="settings" onClick={openConfig}>
              模型配置
            </Button>
          </>
        }
      />

      <Tabs<AiTab>
        items={[
          { id: 'chat', label: '对话' },
          { id: 'prompts', label: '提示词库', count: prompts.length },
          { id: 'workflow', label: '六步工作流', count: workflowRuns.length },
          { id: 'roles', label: '角色训练' },
        ]}
        value={tab}
        onChange={setTab}
      />

      {tab === 'chat' ? (
        <div className="ai-chat-layout">
          <Card className="chat-panel">
            <div className="chat-head">
              <div>
                <strong>AI 搭档</strong>
                <span>{config.apiKey ? '已连接自定义模型' : '演示模式 · 配置 API Key 后可接真实模型'}</span>
              </div>
              <Button size="sm" variant="ghost" icon="trash" onClick={clearMessages}>
                清空
              </Button>
            </div>
            <div className="chat-messages">
              {messages.map((message) => (
                <div className={clsx('chat-message', `is-${message.role}`)} key={message.id}>
                  <div className="chat-avatar">
                    {message.role === 'assistant' ? <Icon name="sparkles" size={15} /> : '我'}
                  </div>
                  <div className="chat-bubble">
                    <p>{message.content}</p>
                    <span>{relativeTime(message.at)}</span>
                  </div>
                </div>
              ))}
              {sending ? (
                <div className="chat-message is-assistant">
                  <div className="chat-avatar"><Icon name="sparkles" size={15} /></div>
                  <div className="chat-bubble chat-typing"><i /><i /><i /></div>
                </div>
              ) : null}
            </div>
            <div className="chat-composer">
              <textarea
                className="textarea"
                value={input}
                onChange={(event) => setInput(event.target.value)}
                placeholder="描述目标、约束和验收标准…"
                onKeyDown={(event) => {
                  if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) send();
                }}
              />
              <div className="chat-composer-foot">
                <span>⌘/Ctrl + Enter 发送 · 不发送代码到公网时请用本地模型</span>
                <Button variant="primary" icon="send" onClick={send} disabled={sending || !input.trim()}>
                  发送
                </Button>
              </div>
            </div>
          </Card>
          <aside className="chat-side">
            <Card>
              <SectionTitle title="快捷提示" hint="先问清楚，再写代码" />
              <div className="quick-prompts">
                {prompts.slice(0, 4).map((prompt) => (
                  <button
                    key={prompt.id}
                    type="button"
                    onClick={() => {
                      setInput(prompt.body);
                      usePrompt(prompt.id);
                    }}
                  >
                    <span>{prompt.category}</span>
                    <strong>{prompt.title}</strong>
                    <Icon name="arrowRight" size={13} />
                  </button>
                ))}
              </div>
            </Card>
            <Card className="config-summary">
              <div className="row-between">
                <span className="field-label">当前模型</span>
                <Badge tone={config.apiKey ? 'success' : 'neutral'}>{config.apiKey ? '在线' : '演示'}</Badge>
              </div>
              <strong>{config.model || 'deepseek-chat'}</strong>
              <span>{config.baseUrl}</span>
              <Button size="sm" icon="settings" onClick={openConfig}>修改配置</Button>
            </Card>
            <Card className="ai-warning">
              <Icon name="alert" size={15} />
              <p>API Key 只保存在本机 localStorage。公共电脑上请用完清除，或改用本地模型网关。</p>
            </Card>
          </aside>
        </div>
      ) : null}

      {tab === 'prompts' ? (
        <div className="prompt-layout">
          <aside className="prompt-cats">
            {['全部', ...PROMPT_CATEGORIES].map((category) => (
              <button
                key={category}
                type="button"
                className={promptCategory === category ? 'is-active' : ''}
                onClick={() => setPromptCategory(category)}
              >
                {category}
                <span>{category === '全部' ? prompts.length : prompts.filter((prompt) => prompt.category === category).length}</span>
              </button>
            ))}
          </aside>
          <div>
            <div className="prompt-toolbar">
              <div className="search-input">
                <Icon name="search" size={15} />
                <input
                  value={promptSearch}
                  onChange={(event) => setPromptSearch(event.target.value)}
                  placeholder="搜索标题、正文或标签…"
                />
              </div>
              <span className="faint">{filteredPrompts.length} 个模板</span>
            </div>
            <div className="prompt-grid">
              {filteredPrompts.map((prompt) => (
                <Card className="prompt-card" key={prompt.id}>
                  <div className="prompt-card-head">
                    <Badge tone="neutral">{prompt.category}</Badge>
                    <button
                      type="button"
                      className={clsx('star-btn', prompt.favorite && 'is-on')}
                      aria-label={prompt.favorite ? '取消收藏' : '收藏'}
                      onClick={() => toggleFavorite(prompt.id)}
                    >
                      <Icon name="star" size={14} />
                    </button>
                  </div>
                  <h3>{prompt.title}</h3>
                  <p>{prompt.body.slice(0, 96)}…</p>
                  <div className="prompt-tags">
                    {prompt.tags.map((tag) => <span key={tag}>{tag}</span>)}
                  </div>
                  <div className="prompt-card-foot">
                    <span>使用 {prompt.uses} 次</span>
                    <div className="row">
                      <Button size="sm" variant="ghost" onClick={() => setSelectedPrompt(prompt)}>查看</Button>
                      <Button size="sm" variant="primary" icon="arrowRight" onClick={() => applyPrompt(prompt)}>使用</Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {tab === 'workflow' ? (
        <div className="workflow-layout">
          <div className="stack">
            <Card>
              <SectionTitle title="启动一次六步工作流" hint="每一步都有检查清单，未完成不能进入下一步" />
              <div className="workflow-start">
                <div className="field">
                  <label htmlFor="wf-title">本次任务</label>
                  <input
                    id="wf-title"
                    className="input"
                    value={workflowTitle}
                    onChange={(event) => setWorkflowTitle(event.target.value)}
                  />
                </div>
                <div className="field">
                  <label htmlFor="wf-role">角色</label>
                  <select id="wf-role" className="select" value={workflowRole} onChange={(event) => setWorkflowRole(event.target.value)}>
                    <option>工程师</option>
                    <option>架构师</option>
                    <option>产品经理</option>
                  </select>
                </div>
                <Button
                  variant="primary"
                  icon="play"
                  onClick={() => {
                    const id = startWorkflow(workflowTitle || '未命名任务', workflowRole);
                    if (id) pushToast('工作流已启动', 'success');
                  }}
                >
                  启动工作流
                </Button>
              </div>
            </Card>

            {activeRun ? (
              <Card className="workflow-run">
                <div className="workflow-run-head">
                  <div>
                    <Badge tone="accent" dot>进行中</Badge>
                    <h2>{activeRun.title}</h2>
                    <span>角色：{activeRun.role} · 启动于 {relativeTime(activeRun.startedAt)}</span>
                  </div>
                  <Ring value={activeProgress * 100} size={64} stroke={6} label={`${Math.round(activeProgress * 100)}%`} sub="完成度" />
                </div>
                <div className="workflow-steps">
                  {activeRun.steps.map((step, index) => {
                    const stepDone = step.checks.every((check) => check.done);
                    const priorDone = activeRun.steps.slice(0, index).every((item) => item.checks.every((check) => check.done));
                    return (
                      <div className={clsx('workflow-step', stepDone && 'is-done', !priorDone && 'is-locked')} key={step.id}>
                        <div className="workflow-step-head">
                          <span className="workflow-step-index">{stepDone ? <Icon name="check" size={13} /> : index + 1}</span>
                          <div>
                            <strong>{step.title}</strong>
                            <p>{step.description}</p>
                          </div>
                        </div>
                        <div className="workflow-checks">
                          {step.checks.map((check) => (
                            <label key={check.id} className={clsx('workflow-check', check.done && 'is-done')}>
                              <input
                                type="checkbox"
                                checked={check.done}
                                disabled={!priorDone && !stepDone}
                                onChange={() => toggleCheck(activeRun.id, step.id, check.id)}
                              />
                              <span>{check.label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Button
                  variant="primary"
                  icon="check"
                  onClick={() => {
                    if (completeWorkflow(activeRun.id)) pushToast('工作流完成 · +30 XP', 'success');
                    else pushToast('还有检查项未完成', 'error');
                  }}
                >
                  完成工作流
                </Button>
              </Card>
            ) : (
              <Card className="workflow-empty">
                <Icon name="gitBranch" size={26} />
                <strong>没有进行中的工作流</strong>
                <p>用一个真实需求走完六步，比看十篇提示词教程更有用。</p>
              </Card>
            )}
          </div>

          <aside className="stack">
            <Card>
              <SectionTitle title="历史工作流" hint="完成记录与角色" />
              <div className="workflow-history">
                {workflowRuns.length === 0 ? <span className="faint">还没有记录</span> : null}
                {workflowRuns.map((run) => (
                  <div className="workflow-history-item" key={run.id}>
                    <span className={`log-dot ${run.status === 'done' ? 'success' : 'info'}`} />
                    <div>
                      <strong>{run.title}</strong>
                      <span>{run.role} · {relativeTime(run.completedAt ?? run.startedAt)}</span>
                    </div>
                    <Badge tone={run.status === 'done' ? 'success' : 'accent'}>{run.status === 'done' ? '完成' : '进行中'}</Badge>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="ai-warning">
              <Icon name="info" size={15} />
              <p>六步工作流的目标不是“走完”，而是每一步都留下可检查的证据。</p>
            </Card>
          </aside>
        </div>
      ) : null}

      {tab === 'roles' ? (
        <div className="roles-layout">
          <Card>
            <SectionTitle title="同一需求，三种视角" hint="对比差异，训练角色切换" />
            <div className="field">
              <label htmlFor="role-req">需求</label>
              <textarea
                id="role-req"
                className="textarea"
                value={roleRequirement}
                onChange={(event) => setRoleRequirement(event.target.value)}
              />
            </div>
            <Button
              variant="primary"
              icon="sparkles"
              onClick={() => {
                const outputs: Record<string, string> = {};
                for (const role of ROLES) outputs[role.id] = roleDemo(role.id, roleRequirement);
                setRoleOutputs(outputs);
                pushToast('已生成三种视角的演示方案', 'success');
              }}
            >
              生成三种视角
            </Button>
          </Card>
          <div className="role-grid">
            {ROLES.map((role) => (
              <Card className="role-card" key={role.id}>
                <div className="role-head" style={{ color: role.color }}>
                  <span><Icon name={role.icon} size={17} /></span>
                  <div>
                    <strong>{role.name}</strong>
                    <small>{role.focus}</small>
                  </div>
                </div>
                <div className="role-output">
                  {roleOutputs[role.id] ? (
                    roleOutputs[role.id].split('\n').map((line, index) => (
                      <p key={index}>{line || '\u00a0'}</p>
                    ))
                  ) : (
                    <span className="faint">点击“生成三种视角”查看这一角色的输出。</span>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      {configOpen ? (
        <div className="modal-mask" onMouseDown={(event) => event.target === event.currentTarget && setConfigOpen(false)}>
          <div className="modal" style={{ width: 520 }} role="dialog" aria-modal="true" aria-label="模型配置">
            <div className="modal-head">
              <h3>模型配置</h3>
              <button type="button" className="icon-btn" onClick={() => setConfigOpen(false)} aria-label="关闭">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="modal-body stack">
              <div className="field">
                <label htmlFor="base-url">Base URL</label>
                <input
                  id="base-url"
                  className="input"
                  value={draftConfig.baseUrl}
                  onChange={(event) => setDraftConfig((prev) => ({ ...prev, baseUrl: event.target.value }))}
                  placeholder="https://api.deepseek.com"
                />
              </div>
              <div className="field">
                <label htmlFor="model-name">模型</label>
                <input
                  id="model-name"
                  className="input"
                  value={draftConfig.model}
                  onChange={(event) => setDraftConfig((prev) => ({ ...prev, model: event.target.value }))}
                  placeholder="deepseek-chat"
                />
              </div>
              <div className="field">
                <label htmlFor="api-key">API Key</label>
                <div className="row">
                  <input
                    id="api-key"
                    className="input"
                    type={showKey ? 'text' : 'password'}
                    value={draftConfig.apiKey}
                    onChange={(event) => setDraftConfig((prev) => ({ ...prev, apiKey: event.target.value }))}
                    placeholder="sk-…（留空则使用演示模式）"
                  />
                  <button type="button" className="icon-btn" aria-label={showKey ? '隐藏' : '显示'} onClick={() => setShowKey((value) => !value)}>
                    <Icon name="eye" size={16} />
                  </button>
                </div>
              </div>
              <div className="ai-warning">
                <Icon name="alert" size={15} />
                <p>Key 保存在本机 localStorage，不会上传到码上工坊服务器；公共电脑请用完清除。</p>
              </div>
            </div>
            <div className="modal-foot">
              <Button
                variant="ghost"
                onClick={() => {
                  setDraftConfig({ baseUrl: 'https://api.deepseek.com', apiKey: '', model: 'deepseek-chat' });
                }}
              >
                重置
              </Button>
              <Button variant="primary" onClick={() => {
                setAiConfig(draftConfig);
                setConfigOpen(false);
                pushToast('模型配置已保存', 'success');
              }}>
                保存配置
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {selectedPrompt ? (
        <div className="modal-mask" onMouseDown={(event) => event.target === event.currentTarget && setSelectedPrompt(null)}>
          <div className="modal" style={{ width: 720 }} role="dialog" aria-modal="true" aria-label={selectedPrompt.title}>
            <div className="modal-head">
              <div>
                <h3>{selectedPrompt.title}</h3>
                <span className="faint">{selectedPrompt.category} · 使用 {selectedPrompt.uses} 次</span>
              </div>
              <button type="button" className="icon-btn" onClick={() => setSelectedPrompt(null)} aria-label="关闭">
                <Icon name="close" size={16} />
              </button>
            </div>
            <div className="modal-body">
              <pre className="prompt-body">{selectedPrompt.body}</pre>
            </div>
            <div className="modal-foot">
              <Button variant="ghost" onClick={() => toggleFavorite(selectedPrompt.id)}>
                {selectedPrompt.favorite ? '取消收藏' : '收藏'}
              </Button>
              <Button variant="primary" icon="arrowRight" onClick={() => applyPrompt(selectedPrompt)}>
                放入输入框
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
