import { auth } from '~/lib/firebase';

interface DyadFile {
  path: string;
  content: string;
}

interface SyncPayload {
  projectId: string;
  files: DyadFile[];
  projectName: string;
  framework?: string;
  template?: string;
}

export async function sendToDyad(payload: SyncPayload) {
  try {
    // Get current user
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Please log in with Firebase first');
    }

    // Get ID token
    const idToken = await user.getIdToken();

    // Send to Dyad
    const response = await fetch(
      `${process.env.REACT_APP_DYAD_BACKEND_URL}/api/sync/files`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Failed to sync files');
    }

    const result = await response.json();
    return result;
  } catch (error) {
    console.error('Dyad sync error:', error);
    throw error;
  }
}

export async function getProjectFromDyad(projectId: string) {
  try {
    const user = auth.currentUser;
    if (!user) {
      throw new Error('Not authenticated');
    }

    const idToken = await user.getIdToken();

    const response = await fetch(
      `${process.env.REACT_APP_DYAD_BACKEND_URL}/api/projects/${projectId}`,
      {
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error('Failed to fetch project');
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching from Dyad:', error);
    throw error;
  }
}