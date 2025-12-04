/**
 * Generated App Preview Component
 * Displays the generated app preview directly in the workspace
 */

import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';

type DyadProject = {
  name: string;
  fullPath: string;
  hasPackageJson: boolean;
  updatedAt: number;
};

type DyadProjectsResponse = {
  projects?: DyadProject[];
};

const SELECTED_PROJECT_STORAGE_KEY = 'generated-preview-selected-project';

const formatTimestamp = (value?: number) => {
  if (!value) return 'Unknown';

  try {
    const date = new Date(value);
    return date.toLocaleString();
  } catch {
    return 'Unknown';
  }
};

export const GeneratedAppPreview = memo(() => {
  useStore(workbenchStore.previews);
  const currentView = useStore(workbenchStore.currentView);
  const [projects, setProjects] = useState<DyadProject[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(false);
  const [selectedProjectPath, setSelectedProjectPath] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY) || '' : '',
  );
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [startingPreview, setStartingPreview] = useState(false);

  const selectedProject = useMemo(
    () => projects.find((project) => project.fullPath === selectedProjectPath),
    [projects, selectedProjectPath],
  );

  useEffect(() => {
    if (selectedProjectPath || typeof window === 'undefined') {
      return;
    }

    const stored = localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY);
    if (stored) {
      setSelectedProjectPath(stored);
    }
  }, [selectedProjectPath]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    if (selectedProjectPath) {
      localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, selectedProjectPath);
    }
  }, [selectedProjectPath]);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    setErrorMessage('');

    try {
      const response = await fetch('/api/dyad-projects');

      if (!response.ok) {
        throw new Error(`Failed to load Dyad projects (${response.status})`);
      }

      const data = (await response.json()) as DyadProjectsResponse;
      const list = data?.projects || [];
      setProjects(list);

      if (!selectedProjectPath && list.length) {
        const storedPath =
          (typeof window !== 'undefined' && localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY)) || '';
        if (storedPath && list.some((project) => project.fullPath === storedPath)) {
          setSelectedProjectPath(storedPath);
        } else {
          setSelectedProjectPath(list[0].fullPath);
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to load Dyad projects';
      setErrorMessage(message);
    } finally {
      setLoadingProjects(false);
    }
  }, [selectedProjectPath]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const handleStartPreview = useCallback(
    async ({ silent = false }: { silent?: boolean } = {}) => {
      if (!selectedProjectPath) {
        if (!silent) {
          setStatusMessage('Select a project to preview.');
        }
        return;
      }

      if (startingPreview) {
        return;
      }

      setStartingPreview(true);
      setErrorMessage('');
      setStatusMessage(
        silent
          ? `Launching preview for ${selectedProject?.name || 'selected project'}...`
          : 'Starting preview server...',
      );

      try {
        const response = await fetch('/api/start-preview', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ projectDirectory: selectedProjectPath, forceRestart: true }),
        });

        if (!response.ok) {
          const text = await response.text().catch(() => '');
          throw new Error(text || `Preview failed with status ${response.status}`);
        }

        setStatusMessage('Preview server is starting. The preview panel will update when ready.');
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to start preview server';
        setErrorMessage(message);
        setStatusMessage('');
      } finally {
        setStartingPreview(false);
      }
    },
    [selectedProjectPath, selectedProject, startingPreview],
  );

  const isWorkbenchPreviewActive = currentView === 'preview';

  useEffect(() => {
    if (!isWorkbenchPreviewActive || !selectedProjectPath || startingPreview) {
      return;
    }

    handleStartPreview({ silent: true });
  }, [handleStartPreview, isWorkbenchPreviewActive, selectedProjectPath, startingPreview]);

  return (
    <div className="w-full h-full overflow-y-auto bg-bolt-elements-background-depth-1 p-6">
      <div className="max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-bolt-elements-textPrimary mb-2">Generated App Preview</h2>
          <p className="text-bolt-elements-textSecondary text-sm">
            Choose one of your Dyad projects (synced via <strong>Send to Dyad</strong>) and host it in the preview panel.
          </p>
        </div>

        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-5 border border-bolt-elements-border">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-bolt-elements-textPrimary">Available Dyad Projects</h3>
              <p className="text-xs text-bolt-elements-textSecondary">
                Projects stored in <code className="text-xs">~/dyad-apps</code>
              </p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-md border border-bolt-elements-border text-bolt-elements-textPrimary hover:bg-bolt-elements-background-depth-3"
              onClick={fetchProjects}
              disabled={loadingProjects}
            >
              {loadingProjects ? 'Refreshing...' : 'Refresh list'}
            </button>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-md bg-red-50 border border-red-200 p-3 text-xs text-red-700">
              {errorMessage}
            </div>
          )}

          {!projects.length && !loadingProjects ? (
            <div className="text-sm text-bolt-elements-textSecondary">
              No projects found. Click <strong>Send to Dyad</strong> in the chat panel to persist your generated files first.
            </div>
          ) : (
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase text-bolt-elements-textSecondary">Select project</label>
              <select
                className="w-full rounded-md border border-bolt-elements-border bg-bolt-elements-background-depth-1 p-2 text-sm text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-accent"
                value={selectedProjectPath}
                onChange={(event) => setSelectedProjectPath(event.target.value)}
                disabled={loadingProjects}
              >
                {projects.map((project) => (
                  <option key={project.fullPath} value={project.fullPath}>
                    {project.name} {project.hasPackageJson ? '' : '(missing package.json)'}
                  </option>
                ))}
              </select>

              {selectedProject && (
                <div className="text-xs text-bolt-elements-textSecondary">
                  <div className="truncate">
                    <span className="font-medium text-bolt-elements-textPrimary">Path:</span> {selectedProject.fullPath}
                  </div>
                  <div>
                    <span className="font-medium text-bolt-elements-textPrimary">Updated:</span> {formatTimestamp(selectedProject.updatedAt)}
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleStartPreview({ silent: false })}
                disabled={!selectedProjectPath || startingPreview}
                className="w-full mt-2 inline-flex items-center justify-center rounded-md bg-bolt-elements-primary text-white py-2 text-sm font-medium disabled:opacity-50"
              >
                {startingPreview ? 'Starting Preview...' : 'Host Selected Project'}
              </button>

              {statusMessage && (
                <p className="text-xs text-green-600">{statusMessage}</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-bolt-elements-background-depth-2 rounded-xl p-5 border border-bolt-elements-border text-sm text-bolt-elements-textSecondary space-y-2">
          <p>
            ✅ After hosting starts, the preview iframe will automatically connect once the dev server at{' '}
            <code>http://localhost:3000</code> is ready.
          </p>
          <p>
            ✅ Need new files? Regenerate, then click <strong>Send to Dyad</strong> to persist another project snapshot.
          </p>
        </div>
      </div>
    </div>
  );
});

GeneratedAppPreview.displayName = 'GeneratedAppPreview';
