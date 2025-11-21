import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { db, initializeDatabase } from '../db';
import { eq, and } from 'drizzle-orm';
import crypto from 'crypto';
import { projects, files } from '../db/schema';
import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';
import dotenv from "dotenv";
import fs from 'fs';
import path from 'path';
import admin from 'firebase-admin';
import { URL } from 'url';
dotenv.config();

// -------------------- Firebase Admin init --------------------
const serviceAccountPath = '/Users/mymac/Desktop/DYAD_BOLT/dyad/config/firebase-admin.json';
let serviceAccount;

try {
  if (fs.existsSync(serviceAccountPath)) {
    serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
    console.log('✅ Firebase service account loaded from file');
  } else {
    console.error('❌ Firebase service account file not found:', serviceAccountPath);
    process.exit(1);
  }
} catch (err) {
  console.error('❌ Failed to parse Firebase service account:', err);
  process.exit(1);
}

try {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
  console.log('✅ Firebase Admin initialized');
} catch (err) {
  console.error('❌ Failed to initialize Firebase Admin:', err);
  process.exit(1);
}

type FileInsert = typeof files.$inferInsert;
type ProjectInsert = typeof projects.$inferInsert;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = Number(process.env.PORT || 9999);
const VITE_DYAD_BACKEND_URL = process.env.VITE_DYAD_BACKEND_URL || "http://localhost:9999";
const VITE_DYAD_API_URL = process.env.VITE_DYAD_API_URL || "http://localhost:9999/api";
const VITE_DYAD_WEBSOCKET_URL = process.env.VITE_DYAD_WEBSOCKET_URL || "ws://localhost:9999";

// GitHub Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "Sushiiel";
const GITHUB_DEFAULT_VISIBILITY = "private";

// Ollama Configuration
const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2";

const wsConnections = new Set<any>();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', '*', `${VITE_DYAD_BACKEND_URL}`,'http://62.72.59.219:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== AUTH MIDDLEWARE ====================
async function verifyFirebaseToken(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const header = (req.headers.authorization || '') as string;
    if (!header) {
      return res.status(401).json({ error: 'Missing Authorization header' });
    }
    const parts = header.split(' ');
    const token = parts.length === 2 ? parts[1] : parts[0];

    if (!token) {
      return res.status(401).json({ error: 'Missing token' });
    }

    const decoded = await admin.auth().verifyIdToken(token);
    // @ts-ignore
    req.user = decoded;
    next();
  } catch (err: any) {
    console.error('Token verification failed:', err?.message || err);
    return res.status(401).json({ error: 'Invalid or expired Firebase token' });
  }
}

// Protect all /api routes
app.use('/api', verifyFirebaseToken);

// ==================== AI File Editing Functions ====================
async function getProjectFiles(projectId: string, userId: string) {
  try {
    const projectFiles = await db.select().from(files)
      .where(and(eq(files.projectId, projectId), eq(files.userId, userId)));
    return projectFiles;
  } catch (error) {
    console.error('Error fetching project files:', error);
    throw error;
  }
}

async function saveFileChanges(projectId: string, filePath: string, content: string, userId: string) {
  try {
    console.log(`Saving file changes: ${filePath} for project: ${projectId} (user: ${userId})`);

    const existingFile = await db.select().from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, filePath), eq(files.userId, userId)))
      .limit(1);

    if (existingFile.length > 0) {
      await db.update(files).set({ content }).where(eq(files.id, existingFile[0].id));
      console.log(`File updated: ${filePath}`);
    } else {
      await db.insert(files).values({
        id: crypto.randomUUID(),
        userId,
        projectId,
        path: filePath,
        content,
        type: 'file'
      } as any);
      console.log(`File created: ${filePath}`);
    }

    broadcast({
      type: 'file_updated_by_ai',
      projectId,
      filePath,
      content,
      userId
    });

    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving file changes:', error);
    throw error;
  }
}

async function callOllamaAPI(prompt: string, context: string = ''): Promise<string> {
  try {
    console.log('Calling Ollama API with model:', OLLAMA_MODEL);
    
    const fullPrompt = context ? `${context}\n\nUser: ${prompt}` : prompt;

    const response = await fetch(OLLAMA_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: OLLAMA_MODEL,
        prompt: fullPrompt,
        stream: false,
        temperature: 0.7,
        num_predict: 2048
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Ollama error: ${response.status} - ${error}`);
    }

    const data = await response.json() as any;
    return data.response || '';
  } catch (error) {
    console.error('Ollama API Error:', error);
    throw error;
  }
}

// ==================== GitHub Deployment Functions ====================
async function createGitHubRepo(projectName: string, description: string = '', isPrivate: boolean = true) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });
  
  const repoName = projectName
    .toLowerCase()
    .replace(/[^a-z0-9-_.]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);

  try {
    console.log(`Creating GitHub repo: ${repoName}`);
    
    const { data: repo } = await octokit.repos.createForAuthenticatedUser({
      name: repoName,
      description: description || `Deployed from Dyad: ${projectName}`,
      auto_init: true,
      private: isPrivate,
    });

    console.log(`Repo created successfully: ${repo.html_url}`);
    return { repo, repoName };
  } catch (error: any) {
    console.error(`Repo creation failed:`, error.message);
    
    if (error.status === 422) {
      console.log(`Repository ${repoName} already exists, fetching existing...`);
      const { data: repo } = await octokit.repos.get({
        owner: GITHUB_OWNER,
        repo: repoName,
      });
      console.log(`Using existing repo: ${repo.html_url}`);
      return { repo, repoName };
    }
    throw error;
  }
}

async function pushFilesToGitHub(repoName: string, projectFiles: any[]) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  console.log(`Uploading ${projectFiles.length} files to ${repoName}...`);

  try {
    const { data: ref } = await octokit.git.getRef({
      owner: GITHUB_OWNER,
      repo: repoName,
      ref: 'heads/main',
    });
    
    const latestCommitSha = ref.object.sha;
    
    const { data: latestCommit } = await octokit.git.getCommit({
      owner: GITHUB_OWNER,
      repo: repoName,
      commit_sha: latestCommitSha,
    });

    const actualFiles = projectFiles.filter(file => {
      if (!file.content || file.content.trim().length === 0) {
        console.log(`Skipping empty file: ${file.path}`);
        return false;
      }

      const hasExtension = /\.[a-zA-Z0-9]+$/.test(file.path);
      const isDirectoryLike = file.path.endsWith('/') || !hasExtension;
      
      if (isDirectoryLike) {
        console.log(`Skipping directory path: ${file.path}`);
        return false;
      }

      return true;
    });

    const blobs = [];
    for (const file of actualFiles) {
      try {
        const content = file.content || '';
        
        let cleanPath = file.path;
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        if (cleanPath.startsWith('home/project/')) cleanPath = cleanPath.substring('home/project/'.length);
        
        const { data: blob } = await octokit.git.createBlob({
          owner: GITHUB_OWNER,
          repo: repoName,
          content: Buffer.from(content).toString('base64'),
          encoding: 'base64',
        });
        
        blobs.push({
          path: cleanPath,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        });
      } catch (error: any) {
        console.error(`Failed to create blob for ${file.path}:`, error.message);
        throw error;
      }
    }

    const { data: tree } = await octokit.git.createTree({
      owner: GITHUB_OWNER,
      repo: repoName,
      tree: blobs,
      base_tree: latestCommit.tree.sha,
    });

    const { data: commit } = await octokit.git.createCommit({
      owner: GITHUB_OWNER,
      repo: repoName,
      message: 'Deployed from Dyad',
      tree: tree.sha,
      parents: [latestCommitSha],
    });

    await octokit.git.updateRef({
      owner: GITHUB_OWNER,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
    });

    console.log(`Successfully uploaded ${actualFiles.length} files to ${repoName}`);
    return commit;
  } catch (error: any) {
    console.error('Error pushing files to GitHub:', error.message);
    throw error;
  }
}

async function deployToGitHub(projectId: string, projectName: string, description: string, userId: string) {
  try {
    console.log(`Starting GitHub deployment for project: ${projectName} (user ${userId})`);
    
    const projectFiles = await db.select().from(files)
      .where(and(eq(files.projectId, projectId), eq(files.userId, userId)));

    if (projectFiles.length === 0) {
      throw new Error('No files found in project. Cannot deploy empty project.');
    }

    console.log(`Found ${projectFiles.length} files in database`);

    const isPrivate = GITHUB_DEFAULT_VISIBILITY === 'private';

    console.log(`Creating GitHub repository...`);
    const { repo, repoName } = await createGitHubRepo(projectName, description, isPrivate);

    console.log(`Uploading files to repository...`);
    await pushFilesToGitHub(repoName, projectFiles);

    try {
      const updateData: any = {
        repositoryUrl: repo.html_url,
      };
      
      await db.update(projects)
        .set(updateData)
        .where(and(eq(projects.id, projectId), eq(projects.userId, userId)));
        
      console.log('Project updated in database');
    } catch (dbError: any) {
      console.warn('Database update failed, but deployment was successful:', dbError.message);
    }

    console.log(`Deployment complete!`);

    return {
      success: true,
      repositoryUrl: repo.html_url,
      repoName: repoName,
      filesDeployed: projectFiles.length,
      isPrivate: isPrivate,
      message: `Successfully pushed ${projectFiles.length} files to GitHub repository: ${repoName}` 
    };
  } catch (error: any) {
    console.error('Deployment failed:', error.message);
    throw error;
  }
}

// ==================== AI Chat API Route ====================
app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, projectId, selectedFiles } = req.body;
    // @ts-ignore
    const user = (req as any).user;
    const userId = user?.uid;

    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    console.log(`AI Chat request for project: ${projectId} (user ${userId})`);

    let projectContext = '';
    if (projectId) {
      try {
        const project = await db.select().from(projects)
          .where(and(eq(projects.id, projectId), eq(projects.userId, userId)))
          .limit(1);
        
        let projectFiles = await getProjectFiles(projectId, userId);
        
        if (selectedFiles && selectedFiles.length > 0) {
          projectFiles = projectFiles.filter((file: any) => selectedFiles.includes(file.path));
        }
        
        if (projectFiles.length > 0) {
          projectContext = `PROJECT CONTEXT:\nProject: ${project[0]?.name || 'Unknown'}\n\nPROJECT FILES:\n`;
          
          for (const file of projectFiles) {
            projectContext += `\nFILE: ${file.path}\n---\n${file.content}\n---\n`;
          }
        }
      } catch (error) {
        console.error('Error fetching project context:', error);
      }
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const lastMessage = messages[messages.length - 1];
      const userPrompt = lastMessage?.content || '';

      const fullResponse = await callOllamaAPI(userPrompt, projectContext);

      const chunkSize = 50;
      for (let i = 0; i < fullResponse.length; i += chunkSize) {
        const chunk = fullResponse.slice(i, i + chunkSize);
        res.write(`data: ${JSON.stringify({ chunk })}\n\n`);
      }

      res.write(`data: ${JSON.stringify({ chunk: '', done: true })}\n\n`);
      res.end();

    } catch (apiError: any) {
      console.error('API Error:', apiError);
      const errorMsg = `AI service error: ${apiError.message}`;
      res.write(`data: ${JSON.stringify({ chunk: errorMsg, done: true })}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({ 
      error: 'AI service error',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// ==================== WebSocket Handling ====================
wss.on('connection', async (ws: any, req) => {
  try {
    const urlObj = new URL(req.url || '', `http://${req.headers.host}`);
    const token = urlObj.searchParams.get('token');

    if (!token) {
      console.warn('WebSocket connection attempted without token');
      ws.close(4001, 'Missing token');
      return;
    }

    let decoded: any;
    try {
      decoded = await admin.auth().verifyIdToken(token);
      ws.userId = decoded.uid;
      ws.isAlive = true;
      wsConnections.add(ws);
      console.log(`New WebSocket connection from user ${ws.userId}`);
    } catch (err) {
      console.warn('WebSocket token verification failed', err);
      ws.close(4003, 'Invalid token');
      return;
    }

    ws.on('pong', () => { ws.isAlive = true; });

    ws.on('message', async (message: Buffer | string) => {
      try {
        const data = JSON.parse(message.toString());
        data.userId = ws.userId;

        switch (data.type) {
          case 'file_created':
          case 'file_updated':
            await handleFileSync(data);
            break;
          case 'project_created':
            await handleProjectSync(data);
            break;
          case 'bulk_files':
            await handleBulkFileSync(data);
            break;
        }
      } catch (error) {
        console.error('Error processing WebSocket message:', error);
      }
    });

    ws.on('close', () => {
      wsConnections.delete(ws);
    });

    ws.on('error', (error: any) => {
      console.error('WebSocket error:', error);
      wsConnections.delete(ws);
    });

  } catch (err) {
    console.error('WS connection handler error:', err);
  }
});

setInterval(() => {
  for (const ws of Array.from(wsConnections)) {
    try {
      if (ws.isAlive === false) {
        ws.terminate();
        wsConnections.delete(ws);
        continue;
      }
      ws.isAlive = false;
      ws.ping(() => {});
    } catch (err) {
      try { ws.terminate(); } catch {}
      wsConnections.delete(ws);
    }
  }
}, 30000);

function broadcast(data: any) {
  const message = JSON.stringify(data);
  for (const ws of Array.from(wsConnections)) {
    try {
      if (ws.readyState === ws.OPEN) {
        ws.send(message);
      } else {
        wsConnections.delete(ws);
      }
    } catch (err) {
      console.error('WebSocket send error', err);
      try { ws.terminate(); } catch {}
      wsConnections.delete(ws);
    }
  }
}

// ==================== Sync Handlers ====================
async function handleFileSync(data: any) {
  try {
    const { projectId, filePath, content, userId } = data;
    if (!userId) return;

    let project = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
    if (project.length === 0) {
      await db.insert(projects).values({
        id: projectId,
        userId,
        name: data.projectName || 'Project'
      });
    }

    const existingFile = await db.select().from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, filePath), eq(files.userId, userId)))
      .limit(1);

    if (existingFile.length > 0) {
      await db.update(files).set({ content }).where(eq(files.id, existingFile[0].id));
    } else {
      await db.insert(files).values({
        id: crypto.randomUUID(),
        userId,
        projectId,
        path: filePath,
        content: content ?? '',
        type: 'file'
      } as any);
    }

    broadcast({ type: 'file_synced', projectId, filePath, userId });
  } catch (error) {
    console.error('Error syncing file:', error);
  }
}

async function handleProjectSync(data: any) {
  try {
    const { projectId, name, description, framework, template, userId } = data;
    if (!userId) return;

    const existingProject = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
    if (existingProject.length === 0) {
      const projectData: any = { id: projectId, userId, name };
      if (description) projectData.description = description;
      if (framework) projectData.framework = framework;
      if (template) projectData.template = template;
      await db.insert(projects).values(projectData);
    }

    broadcast({ type: 'project_synced', projectId, name, userId });
  } catch (error) {
    console.error('Error syncing project:', error);
  }
}

async function handleBulkFileSync(data: any) {
  try {
    const { projectId, files: filesList, projectName, framework, template, userId } = data;
    if (!userId) return;

    let project = await db.select().from(projects).where(and(eq(projects.id, projectId), eq(projects.userId, userId))).limit(1);
    if (project.length === 0) {
      const projectData: any = { id: projectId, userId, name: projectName || 'Project' };
      if (framework) projectData.framework = framework;
      if (template) projectData.template = template;
      await db.insert(projects).values(projectData);
    }

    for (const file of filesList || []) {
      const { path: filePath, content } = file;
      const existingFile = await db.select().from(files)
        .where(and(eq(files.projectId, projectId), eq(files.path, filePath), eq(files.userId, userId)))
        .limit(1);

      if (existingFile.length > 0) {
        await db.update(files).set({ content }).where(eq(files.id, existingFile[0].id));
      } else {
        await db.insert(files).values({
          id: crypto.randomUUID(),
          userId,
          projectId,
          path: filePath,
          content,
          type: 'file'
        } as any);
      }
    }

    broadcast({ type: 'bulk_sync_completed', projectId, filesCount: filesList?.length || 0, userId });
  } catch (error) {
    console.error('Error in bulk file sync:', error);
  }
}

// ==================== API Routes ====================
app.get('/api/projects/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = (req as any).user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const projectFiles = await db.select().from(files)
      .where(and(eq(files.projectId, id), eq(files.userId, userId)));
    res.json(projectFiles);
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).json({ error: 'Failed to fetch project files' });
  }
});

app.post('/api/projects/:id/push', async (req, res) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = (req as any).user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const project = await db.select().from(projects).where(and(eq(projects.id, id), eq(projects.userId, userId))).limit(1);
    
    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await deployToGitHub(
      id,
      project[0].name,
      project[0].description || '',
      userId
    );

    broadcast({ 
      type: 'project_pushed', 
      projectId: id, 
      repositoryUrl: result.repositoryUrl,
      userId
    });

    res.json(result);
  } catch (error: any) {
    console.error('Push endpoint error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to push project to GitHub',
      message: error.message
    });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    // @ts-ignore
    const userId = (req as any).user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const allProjects = await db.select().from(projects).where(eq(projects.userId, userId));
    res.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, framework, template } = req.body;
    // @ts-ignore
    const userId = (req as any).user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const projectId = crypto.randomUUID();
    const projectData: any = { id: projectId, userId, name };
    if (description) projectData.description = description;
    if (framework) projectData.framework = framework;
    if (template) projectData.template = template;

    await db.insert(projects).values(projectData);
    broadcast({ type: 'project_created', projectId, name, userId });

    res.json({ id: projectId, name, description, framework, template });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // @ts-ignore
    const userId = (req as any).user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    await db.delete(files).where(and(eq(files.projectId, id), eq(files.userId, userId)));
    await db.delete(projects).where(and(eq(projects.id, id), eq(projects.userId, userId)));
    broadcast({ type: 'project_deleted', projectId: id, userId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const { projectId } = req.query;
    // @ts-ignore
    const userId = (req as any).user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const projectFiles = await db.select().from(files)
      .where(and(eq(files.projectId, projectId as string), eq(files.userId, userId)));

    res.json(projectFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.post('/api/files', async (req, res) => {
  try {
    const { projectId, path: filePath, content } = req.body;
    // @ts-ignore
    const userId = (req as any).user?.uid;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    if (!projectId || !filePath) {
      return res.status(400).json({ error: 'Project ID and file path are required' });
    }

    const existingFile = await db.select().from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, filePath), eq(files.userId, userId)))
      .limit(1);

    if (existingFile.length > 0) {
      await db.update(files).set({ content: content || '' }).where(eq(files.id, existingFile[0].id));
    } else {
      await db.insert(files).values({
        id: crypto.randomUUID(),
        userId,
        projectId,
        path: filePath,
        content: content || '',
        type: 'file'
      } as any);
    }

    broadcast({ type: 'file_updated', projectId, filePath, userId });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.get('/api/health', (req, res) => {
  // @ts-ignore
  const userId = (req as any).user?.uid;
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: wsConnections.size,
    aiProvider: 'ollama',
    aiModel: OLLAMA_MODEL,
    ollama_api: OLLAMA_API_URL,
    githubConfigured: !!(GITHUB_TOKEN && GITHUB_OWNER),
    githubOwner: GITHUB_OWNER || 'not configured',
    githubVisibility: GITHUB_DEFAULT_VISIBILITY,
    userId: userId || null
  });
});

// ==================== UI Route ====================
app.get('/dyad', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dyad - AI Code Editor with Firebase Auth</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.0/axios.min.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
    <script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
        .auth-container { display: flex; align-items: center; justify-content: center; min-height: 100vh; }
        .auth-card { background: white; border-radius: 8px; padding: 2rem; max-width: 400px; width: 90%; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .dashboard { display: flex; height: 100vh; overflow: hidden; }
        .sidebar { width: 300px; background: rgba(255,255,255,0.95); border-right: 1px solid #e0e0e0; display: flex; flex-direction: column; }
        .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .header { background: rgba(255,255,255,0.95); padding: 1rem 2rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #667eea; }
        .content { flex: 1; overflow-y: auto; background: rgba(255,255,255,0.1); padding: 2rem; }
        .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #667eea; color: white; }
        .btn-primary:hover { background: #5568d3; }
        .btn-secondary { background: #f0f0f0; color: #333; }
        .btn-danger { background: #ff6b6b; color: white; }
        .input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; margin-bottom: 1rem; }
        .card { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .user-info { display: flex; align-items: center; gap: 1rem; }
        .user-avatar { width: 32px; height: 32px; border-radius: 50%; }
        .loading { text-align: center; padding: 2rem; color: white; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;

        // Firebase configuration
        const firebaseConfig = {
          apiKey: "AIzaSyABIK_p5jfqyelt7UgjRCyYIFTQER7D6tk",
          authDomain: "sample1-84f94.firebaseapp.com",
          projectId: "sample1-84f94",
          storageBucket: "sample1-84f94.firebasestorage.app",
          messagingSenderId: "575895444640",
          appId: "1:575895444640:web:135f80d82559ee0ffbbdc5"
        };

        firebase.initializeApp(firebaseConfig);
        const auth = firebase.auth();

        function App() {
            const [user, setUser] = useState(null);
            const [loading, setLoading] = useState(true);
            const [projects, setProjects] = useState([]);
            const [idToken, setIdToken] = useState(null);

            useEffect(() => {
                const unsubscribe = auth.onAuthStateChanged(async (user) => {
                    if (user) {
                        const token = await user.getIdToken();
                        setIdToken(token);
                        setUser(user);
                        axios.defaults.headers.common['Authorization'] = \`Bearer \${token}\`;
                        loadProjects();
                    } else {
                        setUser(null);
                        setIdToken(null);
                        delete axios.defaults.headers.common['Authorization'];
                    }
                    setLoading(false);
                });

                return () => unsubscribe();
            }, []);

            const loadProjects = async () => {
                try {
                    const response = await axios.get('${VITE_DYAD_BACKEND_URL}/api/projects');
                    setProjects(response.data);
                } catch (error) {
                    console.error('Failed to load projects:', error);
                }
            };

            const signInWithGoogle = async () => {
                try {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    await auth.signInWithPopup(provider);
                } catch (error) {
                    console.error('Sign in failed:', error);
                }
            };

            const signOut = async () => {
                try {
                    await auth.signOut();
                } catch (error) {
                    console.error('Sign out failed:', error);
                }
            };

            const createProject = async (name, description = '', framework = 'react') => {
                try {
                    await axios.post('${VITE_DYAD_BACKEND_URL}/api/projects', {
                        name, description, framework
                    });
                    loadProjects();
                } catch (error) {
                    console.error('Failed to create project:', error);
                }
            };

            if (loading) {
                return <div className="loading">Loading...</div>;
            }

            if (!user) {
                return (
                    <div className="auth-container">
                        <div className="auth-card">
                            <h2 style={{ textAlign: 'center', marginBottom: '2rem', color: '#667eea' }}>
                                Welcome to Dyad
                            </h2>
                            <p style={{ textAlign: 'center', marginBottom: '2rem', color: '#666' }}>
                                Sign in to access your AI-powered code editor
                            </p>
                            <button 
                                className="btn btn-primary" 
                                onClick={signInWithGoogle}
                                style={{ width: '100%' }}
                            >
                                <i className="fab fa-google" style={{ marginRight: '0.5rem' }}></i>
                                Sign in with Google
                            </button>
                        </div>
                    </div>
                );
            }

            return (
                <div className="dashboard">
                    <div className="sidebar">
                        <div style={{ padding: '1.5rem' }}>
                            <h2 className="logo">Dyad AI</h2>
                            <div className="user-info" style={{ marginTop: '1rem' }}>
                                <img 
                                    src={user.photoURL || 'https://via.placeholder.com/32'} 
                                    alt="User" 
                                    className="user-avatar"
                                />
                                <div>
                                    <div style={{ fontWeight: 'bold', fontSize: '0.9rem' }}>
                                        {user.displayName}
                                    </div>
                                    <div style={{ fontSize: '0.8rem', color: '#666' }}>
                                        {user.email}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div style={{ padding: '0 1.5rem' }}>
                            <h3 style={{ fontSize: '0.9rem', color: '#999', marginBottom: '0.5rem' }}>
                                YOUR PROJECTS
                            </h3>
                            {projects.map(project => (
                                <div key={project.id} className="card" style={{ padding: '1rem' }}>
                                    <strong>{project.name}</strong>
                                    <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                                        {project.framework}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="main-content">
                        <div className="header">
                            <h1 className="logo">Dyad - Firebase Auth + Ollama AI</h1>
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <button 
                                    className="btn btn-primary"
                                    onClick={() => {
                                        const name = prompt('Project name:');
                                        if (name) createProject(name);
                                    }}
                                >
                                    Create Project
                                </button>
                                <button className="btn btn-secondary" onClick={signOut}>
                                    Sign Out
                                </button>
                            </div>
                        </div>

                        <div className="content">
                            <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                                <h2>🚀 Welcome to Dyad!</h2>
                                <p style={{ marginTop: '1rem', fontSize: '1.1rem' }}>
                                    Your authenticated AI-powered code editor is ready.
                                </p>
                                <div style={{ marginTop: '2rem' }}>
                                    <p>✅ Firebase Authentication: Active</p>
                                    <p>✅ Ollama AI: Ready</p>
                                    <p>✅ Multi-user Support: Enabled</p>
                                    <p>✅ GitHub Deployment: Available</p>
                                </div>
                                {projects.length === 0 && (
                                    <div style={{ marginTop: '2rem' }}>
                                        <p>No projects yet. Create your first project to get started!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<App />, document.getElementById('root'));
    </script>
</body>
</html>
  `);
});

async function startServer() {
  try {
    console.log('\n🚀 Dyad Backend Server Starting with Firebase Auth + Ollama AI\n');
    console.log('📍 HTTP API: http://localhost:' + PORT);
    console.log('🔌 WebSocket: ws://localhost:' + PORT);
    console.log('🎯 UI Dashboard: http://localhost:' + PORT + '/dyad\n');
    
    console.log('✅ Firebase Authentication: Enabled');
    console.log('✅ Ollama Configuration:');
    console.log(`   Model: ${OLLAMA_MODEL}`);
    console.log(`   API: ${OLLAMA_API_URL}\n`);
    
    console.log('✅ GitHub Configuration:');
    console.log(`   Owner: ${GITHUB_OWNER}`);
    console.log(`   Visibility: ${GITHUB_DEFAULT_VISIBILITY}\n`);
    
    console.log('✨ Features:');
    console.log('   ✅ Firebase Authentication (all routes protected)');
    console.log('   ✅ Local Ollama AI integration');
    console.log('   ✅ Multi-user project management');
    console.log('   ✅ AI chat with project context');
    console.log('   ✅ GitHub deployment');
    console.log('   ✅ Real-time WebSocket updates\n');
    
    console.log('📦 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized\n');

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🎯 Open http://localhost:${PORT}/dyad in your browser\n`);
      console.log('🔐 Authentication Required:');
      console.log('- All API routes require Firebase ID token');
      console.log('- WebSocket connections require token in query param');
      console.log('- Users can only access their own projects/files\n');
      console.log('Make sure Ollama is running:');
      console.log('ollama serve\n');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();
