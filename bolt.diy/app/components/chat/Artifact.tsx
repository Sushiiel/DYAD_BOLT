import { useStore } from '@nanostores/react';
import { AnimatePresence, motion } from 'framer-motion';
import { computed } from 'nanostores';
import { memo, useEffect, useRef, useState } from 'react';
import { createHighlighter, type BundledLanguage, type BundledTheme, type HighlighterGeneric } from 'shiki';
import type { ActionState } from '~/lib/runtime/action-runner';
import { workbenchStore } from '~/lib/stores/workbench';
import { classNames } from '~/utils/classNames';
import { cubicEasingFn } from '~/utils/easings';
import { WORK_DIR } from '~/utils/constants';
import SendToDyadButton from '../ui/SendToDyadButton';

const highlighterOptions = {
  langs: ['shell'],
  themes: ['light-plus', 'dark-plus'],
};
const VITE_DYAD_BACKEND_URL = process.env.VITE_DYAD_BACKEND_URL || "http://localhost:9999"
const VITE_DYAD_API_URL = process.env.VITE_DYAD_API_URL || "http://localhost:9999/api"
const VITE_DYAD_WEBSOCKET_URL = process.env.VITE_DYAD_WEBSOCKET_URL || "ws://localhost:9999"

const shellHighlighter: HighlighterGeneric<BundledLanguage, BundledTheme> =
  import.meta.hot?.data.shellHighlighter ?? (await createHighlighter(highlighterOptions));

if (import.meta.hot) {
  import.meta.hot.data.shellHighlighter = shellHighlighter;
}

interface ArtifactProps {
  messageId: string;
}

export const Artifact = memo(({ messageId }: ArtifactProps) => {
  const userToggledActions = useRef(false);
  const [showActions, setShowActions] = useState(false);
  const [allActionFinished, setAllActionFinished] = useState(false);

  const artifacts = useStore(workbenchStore.artifacts);
  const artifact = artifacts[messageId];

  const actions = useStore(
    computed(artifact.runner.actions, (actions) => {
      // Filter out Supabase actions except for migrations
      return Object.values(actions).filter((action) => {
        // Exclude actions with type 'supabase' or actions that contain 'supabase' in their content
        return action.type !== 'supabase' && !(action.type === 'shell' && action.content?.includes('supabase'));
      });
    }),
  );

  const toggleActions = () => {
    userToggledActions.current = true;
    setShowActions(!showActions);
  };

  useEffect(() => {
    if (actions.length && !showActions && !userToggledActions.current) {
      setShowActions(true);
    }

    if (actions.length !== 0 && artifact.type === 'bundled') {
      const finished = !actions.find(
        (action) => action.status !== 'complete' && !(action.type === 'start' && action.status === 'running'),
      );

      if (allActionFinished !== finished) {
        setAllActionFinished(finished);
      }
    }
  }, [actions, artifact.type, allActionFinished]);

  // Compute exact file paths created by this artifact (from actions)
  // Normalize to leading-slash form for consistency (e.g. '/home/project/src/App.tsx')
  const createdFilesFromActions = (actions || [])
    .filter((a: any) => a.type === 'file' && (a.filePath || a.path))
    .map((a: any) => {
      const raw = a.filePath ?? a.path;
      if (!raw) return null;
      return raw.startsWith('/') ? raw : `/${raw}`;
    })
    .filter(Boolean) as string[];

  // Auto-send when all actions finished (optional)
  // This effect tries to click the SendToDyadButton automatically when the project creation completes.
  // It waits a short delay to allow the snapshot to be persisted to IndexedDB before uploading.
  useEffect(() => {
    if (!allActionFinished) return;
    const t = setTimeout(() => {
      try {
        // Look for the button we render below using the id pattern
        const btnSelector = `button[id^="send-to-dyad-btn-${artifact?.id}"], button[id^="send-to-dyad-btn-"]`;
        const btn = document.querySelector(btnSelector) as HTMLButtonElement | null;
        if (btn) {
          console.log('Auto-clicking SendToDyadButton for artifact', artifact?.id);
          btn.click();
        } else {
          // fallback: search within this artifact element for the button
          const artifactNodes = document.querySelectorAll('.artifact');
          if (artifactNodes.length) {
            for (const node of Array.from(artifactNodes)) {
              const inside = node.querySelector('button[id^="send-to-dyad-btn-"]') as HTMLButtonElement | null;
              if (inside) {
                inside.click();
                break;
              }
            }
          }
        }
      } catch (e) {
        console.warn('Auto-send to Dyad failed to find button', e);
      }
    }, 600); // adjust delay if you need more time for persistence
    return () => clearTimeout(t);
  }, [allActionFinished, artifact?.id]);

  // Minimal helper: read latest snapshot files map (from IndexedDB)
  async function readLatestFilesMap(): Promise<Record<string, any> | null> {
    try {
      const openDB = (name: string) =>
        new Promise<IDBDatabase>((res, rej) => {
          const r = indexedDB.open(name);
          r.onerror = () => rej(r.error);
          r.onsuccess = () => res(r.result);
          r.onupgradeneeded = () => res(r.result);
        });
      const db = await openDB('boltHistory').catch(() => null);
      if (!db || !db.objectStoreNames.contains('snapshots')) return null;
      const tx = db.transaction('snapshots', 'readonly');
      const store = tx.objectStore('snapshots');
      const all: any[] = await new Promise((r) => {
        const q = store.getAll();
        q.onsuccess = () => r(q.result || []);
        q.onerror = () => r([]);
      });
      for (let i = all.length - 1; i >= 0; --i) {
        const e = all[i];
        const cands = [e, e && e.snapshot, e && e.data, e && e.payload];
        for (const c of cands) {
          if (!c || typeof c !== 'object') continue;
          const m =
            c.files && !Array.isArray(c.files)
              ? c.files
              : c.snapshot && c.snapshot.files && !Array.isArray(c.snapshot.files)
              ? c.snapshot.files
              : typeof c === 'object' && Object.keys(c).length && Object.keys(c)[0].startsWith('/home/project')
              ? c
              : null;
          if (m) return m;
        }
      }
      return null;
    } catch (err) {
      console.warn('readLatestFilesMap error', err);
      return null;
    }
  }

  // Minimal helper: POST files map to Dyad - now accepts preferredPaths that will be used to filter which files to upload
  async function postFilesToDyad(
    filesMap: Record<string, any>,
    projectId?: string,
    projectName?: string,
    preferredPaths: string[] = [],
  ) {
    // helper to normalize a single entry into content string
    const normalize = (raw: any) => {
      if (raw == null) return '';
      if (typeof raw === 'string') return raw;
      if (raw?.content) return raw.content;
      if (raw?.text) return raw.text;
      if (raw?.data) return raw.data;
      try {
        return JSON.stringify(raw);
      } catch {
        return String(raw);
      }
    };

    // prepare list: prefer preferredPaths (if present), otherwise include /home/project*
    const allKeys = Object.keys(filesMap || {});
    const chosen: string[] = [];

    // include preferredPaths if they exist
    for (const p of preferredPaths || []) {
      if (!p) continue;
      const withSlash = p.startsWith('/') ? p : `/${p}`;
      const variants = [withSlash, withSlash.replace(/^\//, '')];
      for (const v of variants) {
        if (allKeys.includes(v) && !chosen.includes(v)) {
          chosen.push(v);
        }
      }
    }

    // If no preferred found, fallback to keys under /home/project or src/public etc.
    if (!chosen.length) {
      for (const k of allKeys) {
        if (
          k.startsWith('/home/project') ||
          k.startsWith('home/project') ||
          k.startsWith('/project') ||
          k.startsWith('src/') ||
          k.startsWith('/src') ||
          k.startsWith('public/') ||
          k.startsWith('/public') ||
          k.endsWith('package.json') ||
          k.endsWith('index.html')
        ) {
          if (!chosen.includes(k)) chosen.push(k);
        }
      }
    }

    // Build final files payload
    const files = chosen.map((p) => {
      const raw = filesMap[p];
      return { path: p, content: normalize(raw) };
    });

    const payload = {
      projectId: projectId || undefined,
      projectName: projectName || artifact?.title || document.title || 'bolt-generated-app',
      framework: 'react',
      template: 'bolt-import',
      files,
    };

    const resp = await fetch(`${VITE_DYAD_BACKEND_URL}/api/sync/files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      credentials: 'include',
    });

    return resp;
  }

  return (
    <>
      <div className="artifact border border-bolt-elements-borderColor flex flex-col overflow-hidden rounded-lg w-full transition-border duration-150">
        <div className="flex items-center">
          <button
            className="flex items-stretch bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover w-full overflow-hidden"
            onClick={() => {
              const showWorkbench = workbenchStore.showWorkbench.get();
              workbenchStore.showWorkbench.set(!showWorkbench);
            }}
          >
            <div className="px-5 p-3.5 w-full text-left">
              <div className="w-full text-bolt-elements-textPrimary font-medium leading-5 text-sm">
                {/* Use the dynamic title here */}
                {artifact?.type === 'bundled'
                  ? allActionFinished
                    ? artifact.id === 'restored-project-setup'
                      ? 'Project Restored'
                      : 'Project Created'
                    : artifact.id === 'restored-project-setup'
                    ? 'Restoring Project...'
                    : 'Creating Project...'
                  : artifact?.title}
              </div>
              <div className="w-full w-full text-bolt-elements-textSecondary text-xs mt-0.5">
                Click to open Workbench
              </div>
            </div>
          </button>

          {/* ALWAYS-VISIBLE: small Send-to-Dyad button in header (visible for all artifacts) */}
          <div style={{ marginLeft: 8 }}>
            <button
              id={`send-to-dyad-btn-header-${artifact?.id ?? Math.random().toString(36).slice(2, 6)}`}
              className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover px-3 py-2 rounded"
              onClick={async () => {
                try {
                  const confirmProceed = confirm('Send current generated project files from IndexedDB to Dyad?');
                  if (!confirmProceed) return;

                  // read latest snapshot files map
                  const filesMap = await readLatestFilesMap();
                  if (!filesMap) {
                    alert('No /home/project files found in boltHistory snapshots.');
                    return;
                  }

                  const projectId = prompt('Project ID for Dyad (leave blank to auto-generate):', `bolt-${Math.random().toString(36).slice(2, 9)}`) || undefined;
                  const projectName = prompt('Project name:', artifact?.title ?? document.title ?? 'bolt-generated-app') || undefined;

                  // prefer created file paths from actions when posting
                  const resp = await postFilesToDyad(filesMap, projectId, projectName, createdFilesFromActions);
                  if (!resp.ok) {
                    const txt = await resp.text().catch(() => '<no body>');
                    console.error('Dyad upload failed', resp.status, txt);
                    alert(`Upload failed: ${resp.status} — check console`);
                  } else {
                    const json = await resp.json().catch(() => null);
                    console.log('Dyad upload response', json);
                    alert('Upload complete — check Dyad UI');
                  }
                } catch (err) {
                  console.error('Send-to-Dyad error', err);
                  alert('Error sending to Dyad — see console');
                }
              }}
              title="Send generated files to Dyad server"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}
            >
              <span style={{ fontSize: 12, color: '#fff' }}>Send to Dyad</span>
            </button>
          </div>

          {artifact.type !== 'bundled' && <div className="bg-bolt-elements-artifacts-borderColor w-[1px]" />}
          <AnimatePresence>
            {actions.length && artifact.type !== 'bundled' && (
              <motion.button
                initial={{ width: 0 }}
                animate={{ width: 'auto' }}
                exit={{ width: 0 }}
                transition={{ duration: 0.15, ease: cubicEasingFn }}
                className="bg-bolt-elements-artifacts-background hover:bg-bolt-elements-artifacts-backgroundHover"
                onClick={toggleActions}
              >
                <div className="p-4">
                  <div className={showActions ? 'i-ph:caret-up-bold' : 'i-ph:caret-down-bold'}></div>
                </div>
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        {artifact.type === 'bundled' && (
          <div className="flex flex-col gap-1 p-5 bg-bolt-elements-actions-background border-t border-bolt-elements-artifacts-borderColor">
            <div className="flex items-center gap-1.5">
              <div className={classNames('text-lg', getIconColor(allActionFinished ? 'complete' : 'running'))}>
                {allActionFinished ? (
                  <div className="i-ph:check"></div>
                ) : (
                  <div className="i-svg-spinners:90-ring-with-bg"></div>
                )}
              </div>

              <div className="text-bolt-elements-textPrimary font-medium leading-5 text-sm">
                {allActionFinished ? (artifact.id === 'restored-project-setup' ? 'Restore files from snapshot' : 'Initial files created') : 'Creating initial files'}
              </div>
            </div>

            {/* Pass exact created file paths into the SendToDyadButton */}
            <div className="mt-3">
              <SendToDyadButton
                defaultProjectName={artifact?.title ?? 'bolt-generated-app'}
                defaultFramework="react"
                buttonId={`send-to-dyad-btn-${artifact?.id ?? Math.random().toString(36).slice(2, 6)}`}
                createdFilePaths={createdFilesFromActions}
              />
            </div>
          </div>
        )}

        <AnimatePresence>
          {artifact.type !== 'bundled' && showActions && actions.length > 0 && (
            <motion.div
              className="actions"
              initial={{ height: 0 }}
              animate={{ height: 'auto' }}
              exit={{ height: '0px' }}
              transition={{ duration: 0.15 }}
            >
              <div className="bg-bolt-elements-artifacts-borderColor h-[1px]" />

              <div className="p-5 text-left bg-bolt-elements-actions-background">
                <ActionList actions={actions} />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
});

interface ShellCodeBlockProps {
  classsName?: string;
  code: string;
}

function ShellCodeBlock({ classsName, code }: ShellCodeBlockProps) {
  return (
    <div
      className={classNames('text-xs', classsName)}
      dangerouslySetInnerHTML={{
        __html: shellHighlighter.codeToHtml(code, {
          lang: 'shell',
          theme: 'dark-plus',
        }),
      }}
    ></div>
  );
}

interface ActionListProps {
  actions: ActionState[];
}

const actionVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function openArtifactInWorkbench(filePath: any) {
  if (workbenchStore.currentView.get() !== 'code') {
    workbenchStore.currentView.set('code');
  }

  workbenchStore.setSelectedFile(`${WORK_DIR}/${filePath}`);
}

const ActionList = memo(({ actions }: ActionListProps) => {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
      <ul className="list-none space-y-2.5">
        {actions.map((action, index) => {
          const { status, type, content } = action;
          const isLast = index === actions.length - 1;

          return (
            <motion.li
              key={index}
              variants={actionVariants}
              initial="hidden"
              animate="visible"
              transition={{
                duration: 0.2,
                ease: cubicEasingFn,
              }}
            >
              <div className="flex items-center gap-1.5 text-sm">
                <div className={classNames('text-lg', getIconColor(action.status))}>
                  {status === 'running' ? (
                    <>
                      {type !== 'start' ? (
                        <div className="i-svg-spinners:90-ring-with-bg"></div>
                      ) : (
                        <div className="i-ph:terminal-window-duotone"></div>
                      )}
                    </>
                  ) : status === 'pending' ? (
                    <div className="i-ph:circle-duotone"></div>
                  ) : status === 'complete' ? (
                    <div className="i-ph:check"></div>
                  ) : status === 'failed' || status === 'aborted' ? (
                    <div className="i-ph:x"></div>
                  ) : null}
                </div>
                {type === 'file' ? (
                  <div>
                    Create{' '}
                    <code
                      className="bg-bolt-elements-artifacts-inlineCode-background text-bolt-elements-artifacts-inlineCode-text px-1.5 py-1 rounded-md text-bolt-elements-item-contentAccent hover:underline cursor-pointer"
                      onClick={() => openArtifactInWorkbench(action.filePath)}
                    >
                      {action.filePath}
                    </code>
                  </div>
                ) : type === 'shell' ? (
                  <div className="flex items-center w-full min-h-[28px]">
                    <span className="flex-1">Run command</span>
                  </div>
                ) : type === 'start' ? (
                  <a
                    onClick={(e) => {
                      e.preventDefault();
                      workbenchStore.currentView.set('preview');
                    }}
                    className="flex items-center w-full min-h-[28px]"
                  >
                    <span className="flex-1">Start Application</span>
                  </a>
                ) : null}
              </div>
              {(type === 'shell' || type === 'start') && (
                <ShellCodeBlock
                  classsName={classNames('mt-1', {
                    'mb-3.5': !isLast,
                  })}
                  code={content}
                />
              )}
            </motion.li>
          );
        })}
      </ul>
    </motion.div>
  );
});

function getIconColor(status: ActionState['status']) {
  switch (status) {
    case 'pending': {
      return 'text-bolt-elements-textTertiary';
    }
    case 'running': {
      return 'text-bolt-elements-loader-progress';
    }
    case 'complete': {
      return 'text-bolt-elements-icon-success';
    }
    case 'aborted': {
      return 'text-bolt-elements-textSecondary';
    }
    case 'failed': {
      return 'text-bolt-elements-icon-error';
    }
    default: {
      return undefined;
    }
  }
}
