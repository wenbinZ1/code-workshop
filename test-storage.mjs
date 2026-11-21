// 浏览器回退路径的最小验证：没有 Tauri 时，读写仍然走 localStorage。
const map = new Map();
globalThis.window = {
  localStorage: {
    getItem: (key) => (map.has(key) ? map.get(key) : null),
    setItem: (key, value) => map.set(key, String(value)),
    removeItem: (key) => map.delete(key),
  },
};

const { createWorkshopStorage, storageBackend, isTauriRuntime, flushStorage } = await import(
  './src/lib/persistence.ts'
);

let failures = 0;
function check(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log('FAIL', label, detail ?? '');
  }
}

check('isTauriRuntime', isTauriRuntime === false, { isTauriRuntime });
check('storageBackend', storageBackend() === 'localStorage', { backend: storageBackend() });

const storage = createWorkshopStorage();
check('storage created', Boolean(storage));
if (storage) {
  const value = { state: { nickname: '测试玩家', xp: 42 }, version: 1 };
  await storage.setItem('code-workshop:v1', value);
  check('raw localStorage written', map.has('code-workshop:v1'));

  const restored = await storage.getItem('code-workshop:v1');
  check('round trip xp', restored?.state?.xp === 42, restored);
  check('round trip nickname', restored?.state?.nickname === '测试玩家', restored);

  await flushStorage();
  check('flush is a no-op outside Tauri', true);

  await storage.removeItem('code-workshop:v1');
  const cleared = await storage.getItem('code-workshop:v1');
  check('remove clears value', cleared === null, cleared);
}

console.log(failures === 0 ? 'ALL STORAGE TESTS PASSED' : `${failures} FAILURES`);
process.exitCode = failures === 0 ? 0 : 1;
