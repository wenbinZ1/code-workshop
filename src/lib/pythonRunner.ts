export interface PythonRunResult {
  stdout: string;
  stderr: string;
  result?: string;
  error?: string;
  durationMs: number;
  timedOut?: boolean;
}

interface PendingRun {
  resolve: (result: PythonRunResult) => void;
  timer: number;
  startedAt: number;
}

let worker: Worker | null = null;
let sequence = 0;
const pending = new Map<number, PendingRun>();

function resetWorker(reason: string) {
  worker?.terminate();
  worker = null;
  for (const [, item] of pending) {
    window.clearTimeout(item.timer);
    item.resolve({
      stdout: '',
      stderr: '',
      error: reason,
      durationMs: Date.now() - item.startedAt,
    });
  }
  pending.clear();
}

function ensureWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(new URL('../workers/python.worker.ts', import.meta.url), {
    type: 'module',
    name: 'code-workshop-python',
  });
  worker.onmessage = (event: MessageEvent) => {
    const data = event.data as {
      id: number;
      ok: boolean;
      stdout: string;
      stderr: string;
      result?: string;
      error?: string;
    };
    const item = pending.get(data.id);
    if (!item) return;
    pending.delete(data.id);
    window.clearTimeout(item.timer);
    item.resolve({
      stdout: data.stdout ?? '',
      stderr: data.stderr ?? '',
      result: data.result,
      error: data.error,
      durationMs: Date.now() - item.startedAt,
    });
  };
  worker.onerror = (event) => {
    resetWorker(event.message || 'Python 运行时加载失败');
  };
  return worker;
}

export function runPython(code: string, timeoutMs = 20000): Promise<PythonRunResult> {
  const id = ++sequence;
  const startedAt = Date.now();
  return new Promise((resolve) => {
    const timer = window.setTimeout(() => {
      resetWorker('执行超时：超过 20 秒，已终止 Python 运行时');
    }, timeoutMs);
    pending.set(id, { resolve, timer, startedAt });
    try {
      ensureWorker().postMessage({ id, code });
    } catch (error) {
      window.clearTimeout(timer);
      pending.delete(id);
      resolve({
        stdout: '',
        stderr: '',
        error: error instanceof Error ? error.message : String(error),
        durationMs: Date.now() - startedAt,
      });
    }
  });
}

export function warmUpPython(): void {
  try {
    ensureWorker().postMessage({
      id: ++sequence,
      code: 'print("pyodide-ready")',
    });
  } catch {
    /* lazy warmup is optional */
  }
}
