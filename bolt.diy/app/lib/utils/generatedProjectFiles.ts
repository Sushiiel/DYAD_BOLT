const PREFERRED_PREFIXES = [
  '/home/project',
  'home/project',
  '/project',
  'project',
  'src/',
  'public/',
  '/client',
  '/server',
  'client/',
  'server/',
];

const PREFERRED_ROOT_FILES = [
  'package.json',
  '/home/project/package.json',
  'vite.config.ts',
  'vite.config.js',
  'tsconfig.json',
  'tsconfig.node.json',
  'postcss.config.js',
  'tailwind.config.js',
  'index.html',
];

const DEFAULT_WAIT_TIMEOUT_MS = 8000;
const DEFAULT_WAIT_INTERVAL_MS = 350;

const normalizeContent = (val: any) => {
  if (val == null) return '';
  if (typeof val === 'string') return val;
  if (val instanceof ArrayBuffer)
    return '__base64:' + btoa(String.fromCharCode(...new Uint8Array(val)));
  if (ArrayBuffer.isView(val))
    return '__base64:' + btoa(String.fromCharCode(...new Uint8Array((val as any).buffer || val)));
  if (typeof val === 'object') return val.content ?? val.text ?? val.data ?? JSON.stringify(val);
  return String(val);
};

function openDB(name: string): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(name);
      req.onerror = () => resolve(null);
      req.onupgradeneeded = () => resolve(req.result);
      req.onsuccess = () => resolve(req.result);
    } catch {
      resolve(null);
    }
  });
}

async function getSnapshotsEntries(): Promise<any[]> {
  const db = await openDB('boltHistory');
  if (!db || !db.objectStoreNames.contains('snapshots')) return [];
  return new Promise((res) => {
    const tx = db.transaction('snapshots', 'readonly');
    const store = tx.objectStore('snapshots');
    const q = store.getAll();
    q.onsuccess = () => res(q.result || []);
    q.onerror = () => res([]);
  });
}

async function readObjectStoreAll(dbName: string, storeName: string): Promise<any[]> {
  const db = await openDB(dbName);
  if (!db || !db.objectStoreNames.contains(storeName)) return [];
  return new Promise((res) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const q = store.getAll();
    q.onsuccess = () => res(q.result || []);
    q.onerror = () => res([]);
  });
}

function extractFilesMap(candidate: any): Record<string, any> | null {
  if (!candidate || typeof candidate !== 'object') return null;
  if (candidate.files && typeof candidate.files === 'object' && !Array.isArray(candidate.files)) return candidate.files;
  if (
    candidate.snapshot &&
    candidate.snapshot.files &&
    typeof candidate.snapshot.files === 'object' &&
    !Array.isArray(candidate.snapshot.files)
  ) {
    return candidate.snapshot.files;
  }
  const keys = Object.keys(candidate || {});
  if (
    keys.length &&
    (keys[0].startsWith('/home/project') ||
      keys[0].startsWith('home/project') ||
      keys[0].startsWith('src') ||
      keys[0].startsWith('public') ||
      keys[0].includes('index.html'))
  ) {
    return candidate;
  }
  return null;
}

async function gatherFilesMaps(): Promise<Record<string, any>[]> {
  const maps: Record<string, any>[] = [];

  const snaps = await getSnapshotsEntries();
  for (const s of snaps) {
    const cand = extractFilesMap(s) || extractFilesMap(s.snapshot) || extractFilesMap(s.data) || extractFilesMap(s.payload);
    if (cand) maps.push(cand);
  }

  const db = await openDB('boltHistory');
  if (db) {
    if (db.objectStoreNames.contains('files')) {
      const f = await readObjectStoreAll('boltHistory', 'files');
      if (Array.isArray(f) && f.length && f[0].path) {
        const map: Record<string, any> = {};
        for (const item of f) map[item.path] = item.content ?? item.data ?? item;
        maps.push(map);
      } else if (f && typeof f === 'object' && !Array.isArray(f)) {
        const mapCandidate = extractFilesMap(f);
        if (mapCandidate) maps.push(mapCandidate);
      }
    }
    if (db.objectStoreNames.contains('workspace')) {
      const w = await readObjectStoreAll('boltHistory', 'workspace');
      for (const item of w) {
        const mapCandidate = extractFilesMap(item);
        if (mapCandidate) maps.push(mapCandidate);
      }
    }
  }

  const other = await readObjectStoreAll('boltHistory', 'boltFiles').catch(() => []);
  if (other && other.length) {
    if (Array.isArray(other) && other[0] && other[0].path) {
      const map: Record<string, any> = {};
      for (const it of other) map[it.path] = it.content ?? it.data ?? it;
      maps.push(map);
    } else {
      for (const it of other as any[]) {
        const m = extractFilesMap(it);
        if (m) maps.push(m);
      }
    }
  }

  try {
    // @ts-ignore
    const wb = (window as any).__workbench__ || (window as any).workbenchStore || (window as any).workbench;
    if (wb) {
      const candidates = [wb.files, wb.vfs, wb.fs, wb.snapshot, wb.state, wb._internal];
      for (const c of candidates) {
        const m = extractFilesMap(c);
        if (m) maps.push(m);
        if (Array.isArray(c) && c.length && c[0].path) {
          const map: Record<string, any> = {};
          for (const it of c) map[it.path] = it.content ?? it.data ?? it;
          maps.push(map);
        }
      }
    }
  } catch {
    // ignore
  }

  const unique: Record<string, any>[] = [];
  const seenSignatures = new Set<string>();
  for (const m of maps) {
    const keys = Object.keys(m).slice(0, 10).join(',');
    if (!seenSignatures.has(keys)) {
      seenSignatures.add(keys);
      unique.push(m);
    }
  }

  return unique;
}

function keyVariants(p: string) {
  if (!p) return [p];
  if (p.startsWith('/')) return [p, p.replace(/^\//, '')];
  return [p, `/${p}`];
}

function chooseFilesFromMap(filesMap: Record<string, any>, createdPaths: string[]) {
  if (!filesMap) return [];
  const keys = Object.keys(filesMap);

  const normalizedCreated: string[] = [];
  for (const p of createdPaths || []) {
    for (const v of keyVariants(p)) {
      if (keys.includes(v) && !normalizedCreated.includes(v)) normalizedCreated.push(v);
    }
  }
  if (normalizedCreated.length) {
    return normalizedCreated.map((k) => ({ path: k, content: normalizeContent(filesMap[k]) }));
  }

  const chosen = new Set<string>();
  for (const k of keys) {
    for (const pref of PREFERRED_PREFIXES) {
      if (k.startsWith(pref) || k.startsWith(pref.replace(/^\//, ''))) chosen.add(k);
    }
    for (const root of PREFERRED_ROOT_FILES) {
      if (k.endsWith(root) || k === root || k === '/' + root) chosen.add(k);
    }
  }
  if (chosen.size) {
    return Array.from(chosen).map((k) => ({ path: k, content: normalizeContent(filesMap[k]) }));
  }

  const fallback = keys.filter((k) => /src\/|public\/|index\.html|package\.json|vite\.config/.test(k));
  if (fallback.length) {
    return fallback.map((k) => ({ path: k, content: normalizeContent(filesMap[k]) }));
  }

  return keys.slice(0, 5000).map((k) => ({ path: k, content: normalizeContent(filesMap[k]) }));
}

async function waitAndCollectFilesMap(createdPaths: string[], timeoutMs: number, intervalMs: number) {
  const targetKeys = createdPaths.slice();
  for (const r of PREFERRED_ROOT_FILES) targetKeys.push(r);
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    const maps = await gatherFilesMaps();
    for (const m of maps) {
      const keys = Object.keys(m);
      const found = targetKeys.some((t) => keys.includes(t) || keys.includes(t.replace(/^\//, '')));
      if (found) return m;
    }
    if (maps.length && targetKeys.length === 0) return maps[0];
    await new Promise((r) => setTimeout(r, intervalMs));
  }

  const maps = await gatherFilesMaps();
  return maps.length ? maps[0] : null;
}

export interface CollectGeneratedFilesOptions {
  createdFilePaths?: string[];
  waitTimeoutMs?: number;
  waitIntervalMs?: number;
}

export async function collectGeneratedProjectFiles(
  options: CollectGeneratedFilesOptions = {},
): Promise<{ path: string; content: string }[] | null> {
  if (typeof indexedDB === 'undefined') {
    return null;
  }

  const waitTimeoutMs = options.waitTimeoutMs ?? DEFAULT_WAIT_TIMEOUT_MS;
  const waitIntervalMs = options.waitIntervalMs ?? DEFAULT_WAIT_INTERVAL_MS;
  const created = (options.createdFilePaths || []).filter(Boolean);
  const filesMap = await waitAndCollectFilesMap(created, waitTimeoutMs, waitIntervalMs);

  if (!filesMap) {
    return null;
  }

  let files = chooseFilesFromMap(filesMap, created);

  if (files.length < 5) {
    const allMaps = await gatherFilesMaps();
    const merged: Record<string, any> = {};
    for (const m of allMaps) {
      Object.assign(merged, m);
    }
    files = chooseFilesFromMap(merged, created);
  }

  if (!files.length) {
    return null;
  }

  const out: { path: string; content: string }[] = [];
  const seen = new Set<string>();
  for (const f of files) {
    if (!seen.has(f.path)) {
      seen.add(f.path);
      out.push(f);
    }
  }

  return out;
}
