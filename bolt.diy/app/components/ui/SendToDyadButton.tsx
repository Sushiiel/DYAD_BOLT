// app/components/ui/SendToDyadButton.tsx
import React, { useState } from 'react';

/**
 * Robust SendToDyadButton
 * - Scans multiple IndexedDB stores and in-memory workbench store (if present)
 * - Prefers createdFilePaths provided by Artifact actions
 * - Polls briefly to wait for persistence
 */



interface Props {
  defaultProjectName?: string;
  defaultFramework?: string;
  buttonId?: string;
  createdFilePaths?: string[]; // exact paths from artifact actions (preferred)
  waitTimeoutMs?: number;
  waitIntervalMs?: number;
}

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
  'server/'
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
  'index.html'
];
const VITE_DYAD_BACKEND_URL = process.env.VITE_DYAD_BACKEND_URL || "http://localhost:9999"
const VITE_DYAD_API_URL = process.env.VITE_DYAD_API_URL || "http://localhost:9999/api"
const VITE_DYAD_WEBSOCKET_URL = process.env.VITE_DYAD_WEBSOCKET_URL || "ws://localhost:9999"
export default function SendToDyadButton({
  defaultProjectName,
  defaultFramework = 'react',
  buttonId,
  createdFilePaths = [],
  waitTimeoutMs = 8000,
  waitIntervalMs = 350
}: Props) {
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');

  const normalizeContent = (val: any) => {
    if (val == null) return '';
    if (typeof val === 'string') return val;
    if (val instanceof ArrayBuffer) return '__base64:' + btoa(String.fromCharCode(...new Uint8Array(val)));
    if (ArrayBuffer.isView(val))
      return '__base64:' + btoa(String.fromCharCode(...new Uint8Array((val as any).buffer || val)));
    if (typeof val === 'object') return val.content ?? val.text ?? val.data ?? JSON.stringify(val);
    return String(val);
  };

  // open an IndexedDB database (promise)
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

  // read snapshots store and return array of entries
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

  // read generic store by name if exists
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

  // Try to extract a filesMap object from a snapshot-like object
  function extractFilesMap(candidate: any): Record<string, any> | null {
    if (!candidate || typeof candidate !== 'object') return null;
    // common shapes
    if (candidate.files && typeof candidate.files === 'object' && !Array.isArray(candidate.files)) return candidate.files;
    if (candidate.snapshot && candidate.snapshot.files && typeof candidate.snapshot.files === 'object' && !Array.isArray(candidate.snapshot.files))
      return candidate.snapshot.files;
    // sometimes the whole object is a map with keys like '/home/project/...'
    const keys = Object.keys(candidate || {});
    if (keys.length && (keys[0].startsWith('/home/project') || keys[0].startsWith('home/project') || keys[0].startsWith('src') || keys[0].startsWith('public') || keys[0].includes('index.html')))
      return candidate;
    return null;
  }

  // Gather candidate files maps from multiple sources
  async function gatherFilesMaps(): Promise<Record<string, any>[]> {
    const maps: Record<string, any>[] = [];

    // 1) snapshots store
    const snaps = await getSnapshotsEntries();
    for (const s of snaps) {
      const cand = extractFilesMap(s) || extractFilesMap(s.snapshot) || extractFilesMap(s.data) || extractFilesMap(s.payload);
      if (cand) maps.push(cand);
    }

    // 2) try top-level stores that some versions may use
    const db = await openDB('boltHistory');
    if (db) {
      if (db.objectStoreNames.contains('files')) {
        const f = await readObjectStoreAll('boltHistory', 'files');
        // some 'files' stores are array of entries; convert to map if needed
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

    // 3) Other DBs that might hold files
    const other = await readObjectStoreAll('boltHistory', 'boltFiles').catch(() => []);
    if (other && other.length) {
      // convert array to map if needed
      if (Array.isArray(other) && other[0] && other[0].path) {
        const map: Record<string, any> = {};
        for (const it of other) map[it.path] = it.content ?? it.data ?? it;
        maps.push(map);
      } else {
        for (const it of other) {
          const m = extractFilesMap(it);
          if (m) maps.push(m);
        }
      }
    }

    // 4) Try to read from window workbench in-memory store for recent writes (best effort)
    try {
      // check common global names
      // @ts-ignore
      const wb = (window as any).__workbench__ || (window as any).workbenchStore || (window as any).window?.workbenchStore || (window as any).workbench || null;
      if (wb) {
        // many implementations store files under wb.files, wb.vfs, wb.fs, wb.snapshot
        const candidates = [wb.files, wb.vfs, wb.fs, wb.snapshot, wb.state, wb._internal];
        for (const c of candidates) {
          const m = extractFilesMap(c);
          if (m) maps.push(m);
          // some are arrays
          if (Array.isArray(c) && c.length && c[0].path) {
            const map: Record<string, any> = {};
            for (const it of c) map[it.path] = it.content ?? it.data ?? it;
            maps.push(map);
          }
        }
      }
    } catch (e) {
      // ignore
    }

    // dedupe by key sample (prefer later maps)
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

    // 1) Use createdPaths if present
    const normalizedCreated: string[] = [];
    for (const p of createdPaths || []) {
      for (const v of keyVariants(p)) {
        if (keys.includes(v) && !normalizedCreated.includes(v)) normalizedCreated.push(v);
      }
    }
    if (normalizedCreated.length) {
      return normalizedCreated.map(k => ({ path: k, content: normalizeContent(filesMap[k]) }));
    }

    // 2) Prefer PREFERRED_PREFIXES and root files
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
      return Array.from(chosen).map(k => ({ path: k, content: normalizeContent(filesMap[k]) }));
    }

    // 3) fallback: pick keys that look like project files: src/, public/, index.html, package.json
    const fallback = keys.filter(k => /src\/|public\/|index\.html|package\.json|vite\.config/.test(k));
    if (fallback.length) {
      return fallback.map(k => ({ path: k, content: normalizeContent(filesMap[k]) }));
    }

    // 4) last resort: return whole map (bounded)
    return keys.slice(0, 5000).map(k => ({ path: k, content: normalizeContent(filesMap[k]) }));
  }

  // poll until we find a filesMap containing any of createdPaths or preferred roots
  async function waitAndCollectFilesMap(createdPaths: string[], timeoutMs: number, intervalMs: number) {
    const targetKeys = (createdPaths || []).slice();
    for (const r of PREFERRED_ROOT_FILES) targetKeys.push(r);
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const maps = await gatherFilesMaps();
      // choose best map that contains any targetKey
      for (const m of maps) {
        const keys = Object.keys(m);
        const found = targetKeys.some(t => keys.includes(t) || keys.includes(t.replace(/^\//, '')));
        if (found) return m;
      }
      if (maps.length && targetKeys.length === 0) return maps[0];
      await new Promise(r => setTimeout(r, intervalMs));
    }
    // last chance: return first map available
    const maps = await gatherFilesMaps();
    return maps.length ? maps[0] : null;
  }

  async function handleClick() {
    setRunning(true);
    setStatus('Looking for generated files...');

    try {
      const created = (createdFilePaths || []).map(p => (p && p.startsWith('/') ? p : (p ? `/${p}` : p))).filter(Boolean) as string[];

      const filesMap = await waitAndCollectFilesMap(created, waitTimeoutMs, waitIntervalMs);
      if (!filesMap) {
        setStatus('No snapshot / workspace files found.');
        setRunning(false);
        return;
      }

      setStatus('Selecting generated files...');
      let files = chooseFilesFromMap(filesMap, created);

      // If initial selection yielded only template files, attempt merging with other maps to include additional files
      if (files.length < 5) {
        // merge other maps to pick more files
        const allMaps = await gatherFilesMaps();
        const merged: Record<string, any> = {};
        for (const m of allMaps) {
          Object.assign(merged, m);
        }
        files = chooseFilesFromMap(merged, created);
      }

      if (!files || files.length === 0) {
        setStatus('No files matched selection criteria.');
        setRunning(false);
        return;
      }

      // dedupe
      const out: { path: string; content: string }[] = [];
      const seen = new Set<string>();
      for (const f of files) {
        if (!seen.has(f.path)) {
          seen.add(f.path);
          out.push(f);
        }
      }

      setStatus(`Uploading ${out.length} files...`);
      const projectId = prompt('Project ID for Dyad (leave blank to auto-generate):', `bolt-${Math.random().toString(36).slice(2, 9)}`) || undefined;
      const projectName = prompt('Project name:', defaultProjectName || document.title || 'bolt-generated-app') || undefined;

      const resp = await fetch(`${VITE_DYAD_BACKEND_URL}/api/sync/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          projectName,
          framework: defaultFramework,
          template: 'bolt-import',
          files: out
        }),
        credentials: 'include'
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '<no body>');
        console.error('Upload failed', resp.status, txt);
        setStatus(`Upload failed: ${resp.status}`);
      } else {
        setStatus(`Upload complete (${out.length}).`);
        console.log('Upload response', await resp.json().catch(() => null));
      }
    } catch (err) {
      console.error('SendToDyadButton error', err);
      setStatus('Error — check console');
    } finally {
      setRunning(false);
    }
  }

  return (
    <div>
      <button
        id={buttonId || undefined}
        onClick={handleClick}
        disabled={running}
        style={{ padding: '6px 10px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: 6 }}
      >
        {running ? 'Sending to Dyad…' : 'Send to Dyad'}
      </button>
      {status && <div style={{ marginTop: 8, fontSize: 13 }}>{status}</div>}
    </div>
  );
}
