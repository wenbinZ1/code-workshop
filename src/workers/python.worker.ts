/// <reference lib="webworker" />

type PyodideRuntime = {
  runPythonAsync: (code: string) => Promise<unknown>;
  setStdout: (options: { batched?: (line: string) => void }) => void;
  setStderr: (options: { batched?: (line: string) => void }) => void;
};

let runtime: Promise<PyodideRuntime> | null = null;

async function loadRuntime(): Promise<PyodideRuntime> {
  if (!runtime) {
    runtime = (async () => {
      const dynamicImport = new Function('url', 'return import(url);') as (
        url: string,
      ) => Promise<{ loadPyodide: (options: { indexURL: string }) => Promise<PyodideRuntime> }>;
      const module = await dynamicImport('/pyodide/pyodide.mjs');
      return module.loadPyodide({ indexURL: '/pyodide/' });
    })();
  }
  return runtime;
}

const scope = self as unknown as {
  onmessage: ((event: MessageEvent) => void) | null;
  postMessage: (message: unknown) => void;
};

scope.onmessage = async (event: MessageEvent) => {
  const { id, code } = event.data as { id: number; code: string };
  let stdout = '';
  let stderr = '';
  try {
    const pyodide = await loadRuntime();
    pyodide.setStdout({ batched: (line) => { stdout += `${line}\n`; } });
    pyodide.setStderr({ batched: (line) => { stderr += `${line}\n`; } });
    const result = await pyodide.runPythonAsync(code);
    const rendered =
      result === undefined || result === null
        ? ''
        : typeof result === 'string'
          ? result
          : String(result);
    scope.postMessage({ id, ok: true, stdout, stderr, result: rendered });
  } catch (error) {
    scope.postMessage({
      id,
      ok: false,
      stdout,
      stderr,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    });
  } finally {
    try {
      const pyodide = await loadRuntime();
      pyodide.setStdout({ batched: () => undefined });
      pyodide.setStderr({ batched: () => undefined });
    } catch {
      /* runtime may have failed to load */
    }
  }
};
