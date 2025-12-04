/**
 * Generated App Preview Store
 * Manages the preview for dynamically generated apps in ~/project/
 */

import { atom } from 'nanostores';

export interface GeneratedAppPreview {
  id: string;
  baseUrl: string;
  port: number;
  ready: boolean;
  name: string;
}

// Atom to store the generated app preview
export const generatedAppPreviewAtom = atom<GeneratedAppPreview | null>(null);

// Initialize the generated app preview
export function initializeGeneratedAppPreview() {
  // Use the workspace route that proxies to localhost:3000
  // This avoids iframe sandbox restrictions
  const baseUrl = '/generated-app-preview';
  
  const preview: GeneratedAppPreview = {
    id: 'generated-app',
    baseUrl: baseUrl,
    port: 3000,
    ready: true,
    name: 'Generated App Preview',
  };

  generatedAppPreviewAtom.set(preview);
  return preview;
}

// Function to check if the preview server is running
export async function checkPreviewServerStatus(): Promise<boolean> {
  try {
    const response = await fetch('http://localhost:3000/api/status', {
      method: 'GET',
      mode: 'cors',
    });
    return response.ok;
  } catch (error) {
    console.error('Preview server not available:', error);
    return false;
  }
}

// Function to refresh the generated app preview
export function refreshGeneratedAppPreview() {
  const current = generatedAppPreviewAtom.get();
  if (current) {
    generatedAppPreviewAtom.set({
      ...current,
      ready: false,
    });

    // Trigger a refresh
    setTimeout(() => {
      generatedAppPreviewAtom.set({
        ...current,
        ready: true,
      });
    }, 100);
  }
}
