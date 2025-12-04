import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { ensureProjectDirectory, startPreviewServer } from '~/lib/services/appGenerationService';

export async function loader({ request }: LoaderFunctionArgs) {
  return json(
    { error: `Method ${request.method} not allowed` },
    { status: 405 },
  );
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json(
      { error: `Method ${request.method} not allowed` },
      { status: 405 },
    );
  }

  let payload: { projectDirectory?: string; forceRestart?: boolean } | null = null;

  try {
    if (request.headers.get('content-type')?.includes('application/json')) {
      payload = await request.json();
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON payload';
    return json({ error: message }, { status: 400 });
  }

  const directoryReady = ensureProjectDirectory();

  if (!directoryReady) {
    return json({ error: 'Failed to prepare project directory' }, { status: 500 });
  }

  const result = await startPreviewServer({
    forceRestart: payload?.forceRestart ?? true,
    projectDirectory: payload?.projectDirectory,
  });

  if (!result.success) {
    return json({ error: result.error || 'Failed to start preview server' }, { status: 500 });
  }

  return json({ success: true });
}
