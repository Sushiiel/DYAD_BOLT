import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { listDyadProjects } from '~/lib/services/appGenerationService';

export async function loader({ request }: LoaderFunctionArgs) {
  if (request.method !== 'GET') {
    return json({ error: `Method ${request.method} not allowed` }, { status: 405 });
  }

  const projects = listDyadProjects();

  return json({ projects });
}

export const action = loader;
