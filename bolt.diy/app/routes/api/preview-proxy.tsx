/**
 * Preview Proxy API Route
 * Proxies requests to localhost:3000 to bypass CORS and iframe restrictions
 */

import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    // Get the path from the request
    const url = new URL(request.url);
    const targetPath = url.searchParams.get('path') || '/';

    // Proxy the request to localhost:3000
    const response = await fetch(`http://localhost:3000${targetPath}`, {
      method: request.method,
      headers: {
        'Content-Type': 'text/html',
      },
    });

    const content = await response.text();

    return new Response(content, {
      status: response.status,
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('Preview proxy error:', error);
    return json(
      {
        error: 'Failed to load preview',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
