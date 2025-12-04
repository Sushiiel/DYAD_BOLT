/**
 * Generated App Preview Route
 * Displays the actual running application from localhost:3000
 */

import { json, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import { useEffect, useRef } from 'react';

export async function loader({ request }: LoaderFunctionArgs) {
  return json({ success: true });
}

export default function GeneratedAppPreviewRoute() {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    // Set the iframe to load the actual app from localhost:3000
    if (iframeRef.current) {
      iframeRef.current.src = 'http://localhost:3000';
    }
  }, []);

  return (
    <div className="w-full h-full bg-white overflow-hidden">
      <iframe
        ref={iframeRef}
        title="Generated App Preview"
        className="w-full h-full border-none"
        sandbox="allow-scripts allow-forms allow-popups allow-modals allow-storage-access-by-user-activation allow-same-origin allow-top-navigation allow-presentation"
        allow="cross-origin-isolated; geolocation; microphone; camera; payment"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
      />
    </div>
  );
}