import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { saveGeneratedAppFiles, type GeneratedFilePayload } from '~/lib/services/appGenerationService';

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ error: `Method ${request.method} not allowed` }, { status: 405 });
}

export async function action({ request }: ActionFunctionArgs) {
  if (request.method !== 'POST') {
    return json({ error: `Method ${request.method} not allowed` }, { status: 405 });
  }

  let payload: { files?: GeneratedFilePayload[]; chatId?: string };

  try {
    payload = await request.json();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Invalid JSON payload';
    return json({ error: message }, { status: 400 });
  }

  const filesInput = payload?.files;
  const chatId = payload?.chatId;

  if (!Array.isArray(filesInput) || filesInput.length === 0) {
    return json({ error: 'No files provided' }, { status: 400 });
  }

  const files: GeneratedFilePayload[] = filesInput
    .map((file) => {
      if (!file || typeof file.path !== 'string') {
        return null;
      }

      const content =
        typeof file.content === 'string' ? file.content : file.content == null ? '' : String(file.content);

      return { path: file.path, content };
    })
    .filter(Boolean) as GeneratedFilePayload[];

  if (!files.length) {
    return json({ error: 'No valid files to persist' }, { status: 400 });
  }

  const result = saveGeneratedAppFiles(files, chatId);

  if (!result.success) {
    return json({ error: result.error || 'Failed to persist files' }, { status: 500 });
  }

  return json({ success: true, writtenFiles: result.writtenFiles || [] });
}
