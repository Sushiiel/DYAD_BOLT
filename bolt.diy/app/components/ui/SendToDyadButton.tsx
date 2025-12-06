// app/components/ui/SendToDyadButton.tsx
import React, { useState } from 'react';
import { workbenchStore } from '~/lib/stores/workbench';
import { useAuth } from '../auth/AuthProvider';
import { LoginModal } from '../auth/LoginModal';
import { CredentialSetupModal } from '../auth/CredentialSetupModal';

interface Props {
  defaultProjectName?: string;
  defaultFramework?: string;
  buttonId?: string;
  chatId?: string;
}

const VITE_DYAD_BACKEND_URL = import.meta.env.VITE_DYAD_BACKEND_URL || "http://localhost:9999";

export default function SendToDyadButton({
  defaultProjectName,
  defaultFramework = 'react',
  buttonId,
  chatId
}: Props) {
  const { isAuthenticated, token } = useAuth();
  const [running, setRunning] = useState(false);
  const [status, setStatus] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showCredentialModal, setShowCredentialModal] = useState(false);

  // Get current chat ID from URL if not provided
  const getCurrentChatId = () => {
    if (chatId) return chatId;

    if (typeof window !== 'undefined') {
      const match = window.location.pathname.match(/\/chat\/([^/]+)/);
      if (match && match[1]) {
        return match[1];
      }
    }
    return 'default';
  };

  async function handleClick() {
    // Check authentication first
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    // Check if user has credentials
    try {
      const credsResponse = await fetch(`${VITE_DYAD_BACKEND_URL}/api/credentials`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (credsResponse.ok) {
        const data: { credentials?: string[] } = await credsResponse.json();
        if (!data.credentials || !data.credentials.includes('github_token')) {
          // User doesn't have GitHub token, show credential setup
          setShowCredentialModal(true);
          return;
        }
      }
    } catch (err) {
      console.error('Error checking credentials:', err);
    }

    // Proceed with deployment
    setRunning(true);
    setStatus('Reading files from workspace...');

    try {
      console.log('\n\n=== SEND TO DYAD DEBUG START ===');
      console.log('Timestamp:', new Date().toISOString());

      const currentChatId = getCurrentChatId();
      console.log('Current Chat ID:', currentChatId);

      const chatFiles = workbenchStore.getFilesForChat(currentChatId);

      if (!chatFiles || Object.keys(chatFiles).length === 0) {
        console.error('\n❌ NO FILES FOUND FOR CHAT:', currentChatId);
        setStatus('No files found for this chat. Check console for details.');
        setRunning(false);
        return;
      }

      // Convert to the format expected by the API
      const files = Object.entries(chatFiles)
        .filter(([filePath, fileData]) => {
          if (fileData.isBinary) {
            console.log('Skipping binary file:', filePath);
            return false;
          }
          if (!fileData.content || fileData.content.trim().length === 0) {
            console.log('Skipping empty file:', filePath);
            return false;
          }
          return true;
        })
        .map(([path, fileData]) => ({
          path: path,
          content: fileData.content
        }));

      if (files.length === 0) {
        console.error('\n❌ NO TEXT FILES AFTER FILTERING!');
        setStatus('No text files found to upload.');
        setRunning(false);
        return;
      }

      console.log('Total files to upload:', files.length);

      setStatus('Persisting files for preview...');

      const persistResponse = await fetch('/api/persist-generated-app', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ files, chatId: currentChatId })
      });

      if (!persistResponse.ok) {
        const txt = await persistResponse.text().catch(() => '<no body>');
        console.error('Persist preview files failed', persistResponse.status, txt);
        setStatus('Failed to persist files for preview.');
        setRunning(false);
        return;
      }

      console.log('Files persisted successfully');

      setStatus('Starting preview server...');

      const startPreviewResponse = await fetch('/api/start-preview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectDirectory: `/Users/mymac/project/${currentChatId}` })
      });

      if (!startPreviewResponse.ok) {
        const txt = await startPreviewResponse.text().catch(() => '<no body>');
        console.error('Start preview server failed', startPreviewResponse.status, txt);
        setStatus('Failed to start preview server.');
        setRunning(false);
        return;
      }

      console.log('Preview server started');

      setStatus(`Uploading ${files.length} files to DYAD...`);

      const projectId = `bolt-${Math.random().toString(36).slice(2, 9)}`;
      const projectName = defaultProjectName || (document.title !== 'Bolt' ? document.title : `bolt-app-${currentChatId.slice(0, 8)}`);

      console.log('Uploading to DYAD:', { projectId, projectName, fileCount: files.length });

      const resp = await fetch(`${VITE_DYAD_BACKEND_URL}/api/sync/files`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // Include auth token
        },
        body: JSON.stringify({
          projectId,
          projectName,
          framework: defaultFramework,
          template: 'bolt-import',
          files
        }),
        credentials: 'include'
      });

      if (!resp.ok) {
        const txt = await resp.text().catch(() => '<no body>');
        console.error('Upload to DYAD failed', resp.status, txt);
        setStatus(`Upload failed: ${resp.status}`);
      } else {
        const result = await resp.json().catch(() => null);
        console.log('Upload to DYAD successful:', result);
        setStatus(`✅ Upload complete (${files.length} files sent to DYAD)`);
      }
    } catch (err) {
      console.error('SendToDyadButton error', err);
      setStatus('Error — check console');
    } finally {
      setRunning(false);
    }
  }

  const handleLoginSuccess = () => {
    // After login, show credential setup
    setShowLoginModal(false);
    setShowCredentialModal(true);
  };

  const handleCredentialComplete = () => {
    setShowCredentialModal(false);
    // Automatically trigger deployment after credentials are set
    handleClick();
  };

  return (
    <>
      <div>
        <button
          id={buttonId || undefined}
          onClick={handleClick}
          disabled={running}
          className="flex items-center gap-2 px-4 py-2 text-xs font-black uppercase tracking-wider bg-white text-black hover:bg-black hover:text-white border-2 border-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {running ? (
            <>
              <div className="i-ph:spinner animate-spin text-base" />
              <span>Sending...</span>
            </>
          ) : (
            <>
              <div className="i-ph:upload text-base" />
              <span>Send to Dyad</span>
            </>
          )}
        </button>
        {status && <div className="mt-2 text-xs text-white font-mono">{status}</div>}
      </div>

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onSuccess={handleLoginSuccess}
      />

      <CredentialSetupModal
        isOpen={showCredentialModal}
        onClose={() => setShowCredentialModal(false)}
        onComplete={handleCredentialComplete}
      />
    </>
  );
}
