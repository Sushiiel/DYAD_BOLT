/**
 * Generated App Preview Initializer
 * Automatically initializes the preview for generated apps in ~/project/
 */

import { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { workbenchStore } from '~/lib/stores/workbench';
import {
  generatedAppPreviewAtom,
  initializeGeneratedAppPreview,
  checkPreviewServerStatus,
} from '~/lib/stores/generatedAppPreview';

export function GeneratedAppPreviewInitializer() {
  useStore(workbenchStore.previews);
  const generatedAppPreview = useStore(generatedAppPreviewAtom);

  useEffect(() => {
    let cancel = false;

    const ensurePreviewRegistration = async () => {
      const isServerRunning = await checkPreviewServerStatus();

      if (cancel) return;

      if (isServerRunning && !generatedAppPreview) {
        const preview = initializeGeneratedAppPreview();
        const currentPreviews = workbenchStore.previews.get();
        const exists = currentPreviews.some((p) => p.baseUrl === preview.baseUrl);

        if (!exists) {
          workbenchStore.previews.set([...currentPreviews, preview]);
          workbenchStore.currentView.set('preview');
        }
      }
    };

    ensurePreviewRegistration();

    const interval = setInterval(ensurePreviewRegistration, 5000);

    return () => {
      cancel = true;
      clearInterval(interval);
    };
  }, [generatedAppPreview]);

  return null;
}
