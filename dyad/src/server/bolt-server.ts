
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
import dotenv from "dotenv"
dotenv.config();

type FileInsert = typeof files.$inferInsert;
type ProjectInsert = typeof projects.$inferInsert;

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });
const PORT = Number(process.env.PORT || 9999);
const VITE_DYAD_BACKEND_URL = process.env.VITE_DYAD_BACKEND_URL || "http://localhost:9999"
const VITE_DYAD_API_URL = process.env.VITE_DYAD_API_URL || "http://localhost:9999/api"
const VITE_DYAD_WEBSOCKET_URL = process.env.VITE_DYAD_WEBSOCKET_URL || "ws://localhost:9999"
// GitHub Configuration
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_OWNER = process.env.GITHUB_OWNER || "Sushiiel";
const GITHUB_DEFAULT_VISIBILITY = "private";

// Ollama Configuration - Local Models
const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2"; // Can be: qwen3:4b, llama3, llama3.2

const wsConnections = new Set<any>();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', '*', `${VITE_DYAD_BACKEND_URL}`,'http://62.72.59.219:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// ==================== AI File Editing Functions ====================

async function getProjectFiles(projectId: string) {
  try {
    const projectFiles = await db.select().from(files)
      .where(eq(files.projectId, projectId));
    return projectFiles;
  } catch (error) {
    console.error('Error fetching project files:', error);
    throw error;
  }
}

async function saveFileChanges(projectId: string, filePath: string, content: string) {
  try {
    console.log(`Saving file changes: ${filePath} for project: ${projectId}`);

    const existingFile = await db.select().from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, filePath)))
      .limit(1);

    if (existingFile.length > 0) {
      await db.update(files).set({ content }).where(eq(files.id, existingFile[0].id));
      console.log(`File updated: ${filePath}`);
    } else {
      await db.insert(files).values({
        id: crypto.randomUUID(),
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
      content
    });

    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving file changes:', error);
    throw error;
  }
}

async function createNewFile(projectId: string, filePath: string, content: string) {
  try {
    console.log(`Creating new file: ${filePath} for project: ${projectId}`);

    await db.insert(files).values({
      id: crypto.randomUUID(),
      projectId,
      path: filePath,
      content,
      type: 'file'
    } as any);

    console.log(`New file created: ${filePath}`);

    broadcast({
      type: 'file_created_by_ai',
      projectId,
      filePath,
      content
    });

    return { success: true, filePath };
  } catch (error) {
    console.error('Error creating new file:', error);
    throw error;
  }
}

async function deleteFile(projectId: string, filePath: string) {
  try {
    console.log(`Deleting file: ${filePath} for project: ${projectId}`);

    await db.delete(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, filePath)));

    console.log(`File deleted: ${filePath}`);

    broadcast({
      type: 'file_deleted_by_ai',
      projectId,
      filePath
    });

    return { success: true, filePath };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
}

// ==================== Ollama AI Chat Integration ====================

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

app.post('/api/ai/chat', async (req, res) => {
  try {
    const { messages, projectId, selectedFiles } = req.body;
    
    console.log(`AI Chat request for project: ${projectId}`);
    console.log(`Messages count: ${messages.length}`);
    console.log(`Selected files: ${selectedFiles ? selectedFiles.length : 'all'}`);

    let projectContext = '';
    if (projectId) {
      try {
        const project = await db.select().from(projects)
          .where(eq(projects.id, projectId))
          .limit(1);
        
        let projectFiles = await getProjectFiles(projectId);
        
        // Filter files if specific files are selected
        if (selectedFiles && selectedFiles.length > 0) {
          projectFiles = projectFiles.filter(file => selectedFiles.includes(file.path));
          console.log(`Filtered to ${projectFiles.length} selected files`);
        }
        
        if (projectFiles.length > 0) {
          projectContext = `PROJECT CONTEXT:\nProject: ${project[0]?.name || 'Unknown'}\nFramework: ${project[0]?.framework || 'Not specified'}\n\nPROJECT FILES:\n`;
          
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

      console.log('Calling Ollama with context...');
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

async function enableGitHubPages(repoName: string, isPrivate: boolean) {
  const octokit = new Octokit({ auth: GITHUB_TOKEN });

  try {
    console.log(`Enabling GitHub Pages for ${repoName}...`);
    
    await octokit.repos.createPagesSite({
      owner: GITHUB_OWNER,
      repo: repoName,
      source: {
        branch: 'main',
        path: '/',
      },
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    const pagesUrl = `https://${GITHUB_OWNER}.github.io/${repoName}/`;
    console.log(`GitHub Pages enabled: ${pagesUrl}`);
    return pagesUrl;
  } catch (error: any) {
    if (error.status === 409) {
      console.log(`GitHub Pages already enabled for ${repoName}`);
      return `https://${GITHUB_OWNER}.github.io/${repoName}/`;
    }
    
    if (error.status === 404) {
      console.warn('GitHub Pages not available');
      return `https://${GITHUB_OWNER}.github.io/${repoName}/`;
    }
    
    throw error;
  }
}

async function deployToGitHub(projectId: string, projectName: string, description: string) {
  try {
    console.log(`Starting GitHub deployment for project: ${projectName}`);
    
    const projectFiles = await db.select().from(files)
      .where(eq(files.projectId, projectId));

    if (projectFiles.length === 0) {
      throw new Error('No files found in project. Cannot deploy empty project.');
    }

    console.log(`Found ${projectFiles.length} files in database`);

    const isPrivate = GITHUB_DEFAULT_VISIBILITY === 'private';

    console.log(`Creating GitHub repository...`);
    const { repo, repoName } = await createGitHubRepo(projectName, description, isPrivate);

    console.log(`Uploading files to repository...`);
    await pushFilesToGitHub(repoName, projectFiles);

    let pagesUrl = null;
    try {
      console.log(`Enabling GitHub Pages...`);
      pagesUrl = await enableGitHubPages(repoName, isPrivate);
    } catch (error) {
      console.log('GitHub Pages not enabled (optional)');
    }

    try {
      const updateData: any = {
        repositoryUrl: repo.html_url,
      };
      if (pagesUrl) {
        updateData.deploymentUrl = pagesUrl;
      }
      
      await db.update(projects)
        .set(updateData)
        .where(eq(projects.id, projectId));
        
      console.log('Project updated in database');
    } catch (dbError: any) {
      console.warn('Database update failed, but deployment was successful:', dbError.message);
    }

    console.log(`Deployment complete!`);

    return {
      success: true,
      repositoryUrl: repo.html_url,
      pagesUrl: pagesUrl,
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

// ==================== WebSocket Handling ====================

wss.on('connection', (ws, req) => {
  const clientIp = req.socket.remoteAddress;
  console.log(`New WebSocket connection from: ${clientIp}`);

  (ws as any).isAlive = true;
  ws.on('pong', () => { (ws as any).isAlive = true; });

  wsConnections.add(ws);

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log('WebSocket message received:', data.type);

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
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    wsConnections.delete(ws);
  });
});

setInterval(() => {
  for (const ws of Array.from(wsConnections)) {
    try {
      if ((ws as any).isAlive === false) {
        ws.terminate();
        wsConnections.delete(ws);
        continue;
      }
      (ws as any).isAlive = false;
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

// ==================== File/Project Sync Handlers ====================

async function handleFileSync(data: any) {
  try {
    const { projectId, filePath, content, operation } = data;

    console.log(`Syncing file: ${filePath} for project: ${projectId}`);

    let project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (project.length === 0) {
      const projectData: any = {
        id: projectId,
        name: data.projectName || 'Project'
      };
      if (data.projectDescription) projectData.description = data.projectDescription;
      if (data.framework) projectData.framework = data.framework;
      if (data.template) projectData.template = data.template;
      await db.insert(projects).values(projectData);
      console.log(`Created project: ${projectId}`);
    }

    const existingFile = await db.select().from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, filePath)))
      .limit(1);

    if (existingFile.length > 0) {
      await db.update(files).set({ content: content }).where(eq(files.id, existingFile[0].id));
      console.log(`Updated file: ${filePath}`);
    } else {
      await db.insert(files).values({
        id: crypto.randomUUID(),
        projectId,
        path: filePath,
        content: content ?? '',
        type: 'file'
      } as any);
      console.log(`Created file: ${filePath}`);
    }

    broadcast({ type: 'file_synced', projectId, filePath, operation });
  } catch (error) {
    console.error('Error syncing file:', error);
  }
}

async function handleProjectSync(data: any) {
  try {
    const { projectId, name, description, framework, template } = data;
    console.log(`Syncing project: ${name}`);

    const existingProject = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (existingProject.length === 0) {
      const projectData: any = { id: projectId, name };
      if (description) projectData.description = description;
      if (framework) projectData.framework = framework;
      if (template) projectData.template = template;
      await db.insert(projects).values(projectData);
      console.log(`Project synced: ${projectId}`);
    }

    broadcast({ type: 'project_synced', projectId, name });
  } catch (error) {
    console.error('Error syncing project:', error);
  }
}

async function handleBulkFileSync(data: any) {
  try {
    const { projectId, files: filesList, projectName, framework, template } = data;
    console.log(`Bulk syncing ${filesList?.length || 0} files for project: ${projectId}`);

    let project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);
    if (project.length === 0) {
      const projectData: any = { id: projectId, name: projectName || 'Project' };
      if (framework) projectData.framework = framework;
      if (template) projectData.template = template;
      projectData.description = 'Project created from bolt.diy';
      await db.insert(projects).values(projectData);
      console.log(`Created project during bulk sync: ${projectId}`);
    }

    for (const file of filesList || []) {
      const { path: filePath, content } = file;
      const existingFile = await db.select().from(files)
        .where(and(eq(files.projectId, projectId), eq(files.path, filePath)))
        .limit(1);

      if (existingFile.length > 0) {
        await db.update(files).set({ content }).where(eq(files.id, existingFile[0].id));
      } else {
        await db.insert(files).values({
          id: crypto.randomUUID(),
          projectId,
          path: filePath,
          content,
          type: 'file'
        } as any);
      }
    }

    console.log(`Bulk sync completed for project: ${projectId}`);
    broadcast({ type: 'bulk_sync_completed', projectId, filesCount: filesList?.length || 0 });
  } catch (error) {
    console.error('Error in bulk file sync:', error);
  }
}

// ==================== API Routes ====================

app.get('/api/projects/:id/files', async (req, res) => {
  try {
    const { id } = req.params;
    const projectFiles = await db.select().from(files)
      .where(eq(files.projectId, id));
    res.json(projectFiles);
  } catch (error) {
    console.error('Error fetching project files:', error);
    res.status(500).json({ error: 'Failed to fetch project files' });
  }
});

app.post('/api/projects/:id/push', async (req, res) => {
  try {
    const { id } = req.params;
    console.log(`Push to GitHub request for project: ${id}`);

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    
    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const result = await deployToGitHub(
      id,
      project[0].name,
      project[0].description || ''
    );

    broadcast({ 
      type: 'project_pushed', 
      projectId: id, 
      repositoryUrl: result.repositoryUrl,
      pagesUrl: result.pagesUrl 
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
    const allProjects = await db.select().from(projects);
    res.json(allProjects);
  } catch (error) {
    console.error('Error fetching projects:', error);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, framework, template } = req.body;

    const projectId = crypto.randomUUID();
    const projectData: any = { id: projectId, name };
    if (description) projectData.description = description;
    if (framework) projectData.framework = framework;
    if (template) projectData.template = template;

    await db.insert(projects).values(projectData);
    broadcast({ type: 'project_created', projectId, name });

    res.json({ id: projectId, name, description, framework, template });
  } catch (error) {
    console.error('Error creating project:', error);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(files).where(eq(files.projectId, id));
    await db.delete(projects).where(eq(projects.id, id));
    broadcast({ type: 'project_deleted', projectId: id });
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting project:', error);
    res.status(500).json({ error: 'Failed to delete project' });
  }
});

app.get('/api/files', async (req, res) => {
  try {
    const { projectId } = req.query;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    const projectFiles = await db.select().from(files)
      .where(eq(files.projectId, projectId as string));

    res.json(projectFiles);
  } catch (error) {
    console.error('Error fetching files:', error);
    res.status(500).json({ error: 'Failed to fetch files' });
  }
});

app.post('/api/files', async (req, res) => {
  try {
    const { projectId, path: filePath, content } = req.body;

    if (!projectId || !filePath) {
      return res.status(400).json({ error: 'Project ID and file path are required' });
    }

    const existingFile = await db.select().from(files)
      .where(and(eq(files.projectId, projectId), eq(files.path, filePath)))
      .limit(1);

    if (existingFile.length > 0) {
      await db.update(files).set({ content: content || '' }).where(eq(files.id, existingFile[0].id));
    } else {
      await db.insert(files).values({
        id: crypto.randomUUID(),
        projectId,
        path: filePath,
        content: content || '',
        type: 'file'
      } as any);
    }

    broadcast({ type: 'file_updated', projectId, filePath });
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving file:', error);
    res.status(500).json({ error: 'Failed to save file' });
  }
});

app.delete('/api/files/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await db.delete(files).where(eq(files.id, id));
    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectFiles = await db.select().from(files)
      .where(eq(files.projectId, id));

    res.json({
      ...project[0],
      files: projectFiles
    });
  } catch (error) {
    console.error('Error fetching project:', error);
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

app.get('/api/projects/:id/export', async (req, res) => {
  try {
    const { id } = req.params;

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const projectFiles = await db.select().from(files)
      .where(eq(files.projectId, id));

    res.json({
      project: project[0],
      files: projectFiles,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error exporting project:', error);
    res.status(500).json({ error: 'Failed to export project' });
  }
});

app.post('/api/sync/files', async (req, res) => {
  try {
    const { projectId, files: filesList, projectName, framework, template } = req.body;

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    await handleBulkFileSync({
      projectId,
      files: filesList || [],
      projectName,
      framework,
      template
    });

    res.json({
      success: true,
      message: `Synced ${filesList?.length || 0} files for project ${projectId}`
    });
  } catch (error) {
    console.error('Error in manual sync:', error);
    res.status(500).json({ error: 'Sync failed' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    connections: wsConnections.size,
    aiProvider: 'ollama',
    aiModel: OLLAMA_MODEL,
    ollama_api: OLLAMA_API_URL,
    githubConfigured: !!(GITHUB_TOKEN && GITHUB_OWNER),
    githubOwner: GITHUB_OWNER || 'not configured',
    githubVisibility: GITHUB_DEFAULT_VISIBILITY
  });
});

app.get('/api/ai/health', (req, res) => {
  res.json({
    status: 'healthy',
    aiProvider: 'ollama',
    aiModel: OLLAMA_MODEL,
    capabilities: ['chat', 'code_analysis', 'project_context_awareness'],
    availableModels: ['qwen3:4b', 'llama3', 'llama3.2'],
    timestamp: new Date().toISOString()
  });
});

app.post('/api/ai/process-changes', async (req, res) => {
  try {
    const { projectId, changes } = req.body;
    
    console.log(`Processing AI changes for project: ${projectId}`);
    console.log(`Number of files to update: ${changes.length}`);

    const results = [];
    
    for (const change of changes) {
      try {
        let result;
        
        if (change.type === 'update') {
          result = await saveFileChanges(projectId, change.filePath, change.content);
          results.push({
            filePath: change.filePath,
            status: 'success',
            type: 'update'
          });
        }
      } catch (error: any) {
        results.push({
          filePath: change.filePath,
          status: 'error',
          type: 'update',
          error: error.message
        });
      }
    }

    broadcast({
      type: 'ai_changes_applied',
      projectId,
      changesCount: results.length
    });

    res.json({
      success: true,
      message: `Applied ${results.filter(r => r.status === 'success').length} changes`,
      results
    });

  } catch (error: any) {
    console.error('Error processing AI changes:', error);
    res.status(500).json({ 
      error: 'Failed to process changes',
      message: error.message 
    });
  }
});

app.get('/dyad', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Dyad - AI Code Editor with Ollama</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.0/axios.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', system-ui, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; color: #333; }
        .dashboard { display: flex; height: 100vh; overflow: hidden; }
        .sidebar { width: 300px; background: rgba(255,255,255,0.95); border-right: 1px solid #e0e0e0; display: flex; flex-direction: column; box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .main-content { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
        .header { background: rgba(255,255,255,0.95); padding: 1rem 2rem; border-bottom: 1px solid #e0e0e0; display: flex; justify-content: space-between; align-items: center; }
        .logo { font-size: 1.5rem; font-weight: bold; color: #667eea; }
        .content { flex: 1; overflow-y: auto; background: rgba(255,255,255,0.1); padding: 2rem; }
        .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 1.5rem; }
        .card { background: white; border-radius: 8px; padding: 1.5rem; box-shadow: 0 4px 12px rgba(0,0,0,0.1); transition: transform 0.2s; }
        .card:hover { transform: translateY(-4px); }
        .btn { padding: 0.75rem 1.5rem; border: none; border-radius: 6px; cursor: pointer; font-weight: 500; transition: all 0.2s; }
        .btn-primary { background: #667eea; color: white; }
        .btn-primary:hover { background: #5568d3; }
        .btn-secondary { background: #f0f0f0; color: #333; border: 1px solid #e0e0e0; }
        .btn-success { background: #4CAF50; color: white; }
        .btn-danger { background: #ff6b6b; color: white; }
        .btn-github { background: #333; color: white; }
        .btn-sm { padding: 0.5rem 1rem; font-size: 0.875rem; }
        .input { width: 100%; padding: 0.75rem; border: 1px solid #ddd; border-radius: 6px; font-size: 1rem; }
        .modal { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; z-index: 1000; }
        .modal-content { background: white; border-radius: 8px; padding: 2rem; max-width: 500px; width: 90%; max-height: 80vh; overflow-y: auto; }
        .tab { padding: 1rem; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .tab.active { border-bottom-color: #667eea; color: #667eea; }
        .file-list { max-height: 300px; overflow-y: auto; }
        .file-item { padding: 0.5rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; }
        .file-item:hover { background: #f5f5f5; }
        .file-item.active { background: #e8eaf6; color: #667eea; }
        .editor { width: 100%; height: 400px; border: 1px solid #ddd; border-radius: 6px; padding: 1rem; font-family: monospace; }
        .chat-container { height: 400px; border: 1px solid #ddd; border-radius: 6px; overflow-y: auto; padding: 1rem; background: #fafafa; }
        .message { padding: 1rem; margin-bottom: 0.5rem; border-radius: 6px; }
        .message-user { background: #667eea; color: white; margin-left: 2rem; }
        .message-ai { background: white; border: 1px solid #ddd; margin-right: 2rem; }
        .notification { position: fixed; top: 20px; right: 20px; background: white; padding: 1rem 1.5rem; border-radius: 6px; box-shadow: 0 4px 12px rgba(0,0,0,0.2); max-width: 400px; }
        .notification.success { border-left: 4px solid #4CAF50; }
        .notification.error { border-left: 4px solid #ff6b6b; }
        .notification.info { border-left: 4px solid #667eea; }
        .sidebar-section { padding: 1.5rem; border-bottom: 1px solid #e0e0e0; }
        .sidebar-section h3 { font-size: 0.9rem; color: #999; margin-bottom: 0.5rem; text-transform: uppercase; }
        .sidebar-item { padding: 0.75rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; margin-bottom: 0.5rem; }
        .sidebar-item:hover { background: #f5f5f5; }
        .sidebar-item.active { background: #e8eaf6; color: #667eea; }
        .loading { display: inline-block; width: 16px; height: 16px; border: 2px solid #f3f3f3; border-top: 2px solid #667eea; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        textarea { resize: vertical; }
        .status { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 0.5rem; }
        .status-on { background: #4CAF50; }
        .status-off { background: #f44336; }
        .file-selector { background: white; border-radius: 6px; padding: 1rem; margin-bottom: 1rem; border: 1px solid #ddd; }
        .file-checkbox { margin-right: 0.5rem; }
        .file-selector-header { display: flex; justify-content: between; align-items: center; margin-bottom: 0.5rem; }
        .file-selector-header h4 { margin: 0; flex: 1; }
        .select-all-btn { padding: 0.25rem 0.5rem; font-size: 0.8rem; }
        .selected-files-count { font-size: 0.9rem; color: #666; margin-left: 0.5rem; }
    </style>
</head>
<body>
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect, useRef } = React;

        function App() {
            const [activeTab, setActiveTab] = useState('projects');
            const [projects, setProjects] = useState([]);
            const [selectedProject, setSelectedProject] = useState(null);
            const [files, setFiles] = useState([]);
            const [selectedFile, setSelectedFile] = useState(null);
            const [fileContent, setFileContent] = useState('');
            const [showCreateModal, setShowCreateModal] = useState(false);
            const [loading, setLoading] = useState(false);
            const [wsConnected, setWsConnected] = useState(false);
            const [chatMessages, setChatMessages] = useState([]);
            const [chatInput, setChatInput] = useState('');
            const [isTyping, setIsTyping] = useState(false);
            const [notifications, setNotifications] = useState([]);
            const [deployingProjects, setDeployingProjects] = useState({});
            const [selectedFiles, setSelectedFiles] = useState([]);

            const chatEndRef = useRef(null);

            useEffect(() => {
                const ws = new WebSocket(\`${VITE_DYAD_WEBSOCKET_URL}\`);
                ws.onopen = () => {
                    setWsConnected(true);
                    addNotification('info', 'Connected to Ollama server');
                };
                ws.onclose = () => setWsConnected(false);
                ws.onmessage = (event) => {
                    const data = JSON.parse(event.data);
                    if (data.type === 'project_pushed') {
                        addNotification('success', 'Project deployed to GitHub!');
                        loadProjects();
                    }
                };
                return () => ws.close();
            }, []);

            useEffect(() => {
                loadProjects();
            }, []);

            useEffect(() => {
                chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
            }, [chatMessages]);

            const loadProjects = async () => {
                try {
                    setLoading(true);
                    const response = await axios.get(\`${VITE_DYAD_BACKEND_URL}/api/projects\`);
                    setProjects(response.data);
                } catch (error) {
                    addNotification('error', 'Failed to load projects');
                } finally {
                    setLoading(false);
                }
            };

            const loadFiles = async (projectId) => {
                try {
                    const response = await axios.get(\`${VITE_DYAD_BACKEND_URL}/api/files?projectId=\${projectId}\`);
                    setFiles(response.data);
                    setSelectedFile(null);
                    setSelectedFiles([]);
                } catch (error) {
                    addNotification('error', 'Failed to load files');
                }
            };

            const addNotification = (type, message) => {
                const id = Date.now();
                setNotifications(prev => [...prev, { id, type, message }]);
                setTimeout(() => {
                    setNotifications(prev => prev.filter(n => n.id !== id));
                }, 4000);
            };

            const createProject = async (data) => {
                try {
                    setLoading(true);
                    await axios.post(\`${VITE_DYAD_BACKEND_URL}/api/projects\`, data);
                    await loadProjects();
                    setShowCreateModal(false);
                    addNotification('success', 'Project created!');
                } catch (error) {
                    addNotification('error', 'Failed to create project');
                } finally {
                    setLoading(false);
                }
            };

            const selectProject = async (project) => {
                setSelectedProject(project);
                await loadFiles(project.id);
                setActiveTab('editor');
            };

            const saveFile = async () => {
                if (!selectedFile || !selectedProject) return;
                try {
                    await axios.post(\`${VITE_DYAD_BACKEND_URL}/api/files\`, {
                        projectId: selectedProject.id,
                        path: selectedFile.path,
                        content: fileContent
                    });
                    addNotification('success', 'File saved!');
                } catch (error) {
                    addNotification('error', 'Failed to save file');
                }
            };

            const deleteProject = async (projectId) => {
                if (!confirm('Delete project?')) return;
                try {
                    await axios.delete(\`${VITE_DYAD_BACKEND_URL}/api/projects/\${projectId}\`);
                    await loadProjects();
                    if (selectedProject?.id === projectId) {
                        setSelectedProject(null);
                    }
                    addNotification('success', 'Project deleted');
                } catch (error) {
                    addNotification('error', 'Failed to delete project');
                }
            };

            const deployToGitHub = async (projectId) => {
                try {
                    setDeployingProjects(prev => ({...prev, [projectId]: true}));
                    const response = await axios.post(\`${VITE_DYAD_BACKEND_URL}/api/projects/\${projectId}/push\`);
                    addNotification('success', \`Deployed to: \${response.data.repositoryUrl}\`);
                    await loadProjects();
                } catch (error) {
                    addNotification('error', 'Deployment failed');
                } finally {
                    setDeployingProjects(prev => {
                        const newState = {...prev};
                        delete newState[projectId];
                        return newState;
                    });
                }
            };

            const sendChatMessage = async () => {
                if (!chatInput.trim() || !selectedProject) return;
                
                const userMessage = chatInput;
                setChatInput('');
                setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
                setIsTyping(true);

                try {
                    const response = await fetch(\`${VITE_DYAD_BACKEND_URL}/api/ai/chat\`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            messages: [...chatMessages, { role: 'user', content: userMessage }],
                            projectId: selectedProject.id,
                            selectedFiles: selectedFiles
                        })
                    });

                    if (!response.ok || !response.body) {
                        setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error connecting to Ollama' }]);
                        setIsTyping(false);
                        return;
                    }

                    setChatMessages(prev => [...prev, { role: 'assistant', content: '' }]);
                    const reader = response.body.getReader();
                    const decoder = new TextDecoder();
                    let fullText = '';

                    while (true) {
                        const { done, value } = await reader.read();
                        if (done) break;
                        const chunk = decoder.decode(value, { stream: true });
                        
                        const lines = chunk.split('\\n');
                        for (const line of lines) {
                            if (line.startsWith('data: ')) {
                                try {
                                    const json = JSON.parse(line.slice(6));
                                    if (json.chunk) fullText += json.chunk;
                                } catch (e) {}
                            }
                        }

                        setChatMessages(prev => {
                            const arr = [...prev];
                            if (arr.length > 0 && arr[arr.length - 1].role === 'assistant') {
                                arr[arr.length - 1].content = fullText;
                            }
                            return arr;
                        });
                    }

                    setIsTyping(false);
                } catch (error) {
                    setChatMessages(prev => [...prev, { role: 'assistant', content: 'Error: ' + error.message }]);
                    setIsTyping(false);
                }
            };

            const toggleFileSelection = (filePath) => {
                setSelectedFiles(prev => 
                    prev.includes(filePath) 
                        ? prev.filter(f => f !== filePath)
                        : [...prev, filePath]
                );
            };

            const selectAllFiles = () => {
                if (selectedFiles.length === files.length) {
                    setSelectedFiles([]);
                } else {
                    setSelectedFiles(files.map(f => f.path));
                }
            };

            return (
                <div className="dashboard">
                    <div style={{ position: 'fixed', top: '20px', right: '20px' }}>
                        {notifications.map(n => (
                            <div key={n.id} className={\`notification \${n.type}\`}>
                                {n.message}
                            </div>
                        ))}
                    </div>

                    <Sidebar 
                        wsConnected={wsConnected}
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        projects={projects}
                        selectedProject={selectedProject}
                        selectProject={selectProject}
                    />

                    <div className="main-content">
                        <div className="header">
                            <h1 className="logo">Dyad - Ollama AI</h1>
                            <button className="btn btn-primary" onClick={() => setShowCreateModal(true)}>
                                Create Project
                            </button>
                        </div>

                        <div className="content">
                            {activeTab === 'projects' && (
                                <ProjectsTab 
                                    projects={projects}
                                    selectProject={selectProject}
                                    deleteProject={deleteProject}
                                    deployToGitHub={deployToGitHub}
                                    deployingProjects={deployingProjects}
                                />
                            )}
                            {activeTab === 'editor' && selectedProject && (
                                <EditorTab 
                                    selectedProject={selectedProject}
                                    files={files}
                                    selectedFile={selectedFile}
                                    setSelectedFile={setSelectedFile}
                                    fileContent={fileContent}
                                    setFileContent={setFileContent}
                                    saveFile={saveFile}
                                    deployToGitHub={deployToGitHub}
                                    deployingProjects={deployingProjects}
                                />
                            )}
                            {activeTab === 'ai-chat' && selectedProject && (
                                <ChatTab 
                                    messages={chatMessages}
                                    chatInput={chatInput}
                                    setChatInput={setChatInput}
                                    sendMessage={sendChatMessage}
                                    isTyping={isTyping}
                                    selectedProject={selectedProject}
                                    chatEndRef={chatEndRef}
                                    files={files}
                                    selectedFiles={selectedFiles}
                                    toggleFileSelection={toggleFileSelection}
                                    selectAllFiles={selectAllFiles}
                                />
                            )}
                        </div>
                    </div>

                    {showCreateModal && (
                        <CreateProjectModal 
                            onCreate={createProject}
                            onClose={() => setShowCreateModal(false)}
                        />
                    )}
                </div>
            );
        }

        function Sidebar({ wsConnected, activeTab, setActiveTab, projects, selectedProject, selectProject }) {
            return (
                <div className="sidebar">
                    <div style={{ padding: '1.5rem' }}>
                        <h2 className="logo">Dyad AI</h2>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                            <span className={\`status \${wsConnected ? 'status-on' : 'status-off'}\`}></span>
                            {wsConnected ? 'Connected' : 'Disconnected'}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {[
                            { id: 'projects', icon: 'fas fa-folder', label: 'Projects' },
                            { id: 'editor', icon: 'fas fa-code', label: 'Editor' },
                            { id: 'ai-chat', icon: 'fas fa-robot', label: 'AI Chat' }
                        ].map(tab => (
                            <div
                                key={tab.id}
                                className={\`tab \${activeTab === tab.id ? 'active' : ''}\`}
                                onClick={() => setActiveTab(tab.id)}
                            >
                                <i className={tab.icon}></i> {tab.label}
                            </div>
                        ))}
                    </div>

                    {selectedProject && (
                        <div className="sidebar-section">
                            <h3>Current Project</h3>
                            <div className="card" style={{ padding: '1rem' }}>
                                <strong>{selectedProject.name}</strong>
                                <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.5rem' }}>
                                    {selectedProject.framework}
                                </p>
                            </div>
                        </div>
                    )}

                    {projects.length > 0 && (
                        <div className="sidebar-section">
                            <h3>Recent Projects</h3>
                            {projects.map(p => (
                                <div
                                    key={p.id}
                                    className={\`sidebar-item \${selectedProject?.id === p.id ? 'active' : ''}\`}
                                    onClick={() => selectProject(p)}
                                >
                                    <i className="fas fa-project-diagram"></i> {p.name}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        function ProjectsTab({ projects, selectProject, deleteProject, deployToGitHub, deployingProjects }) {
            return (
                <div>
                    <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>Projects</h2>
                    {projects.length === 0 ? (
                        <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                            <p>No projects yet. Create one to get started!</p>
                        </div>
                    ) : (
                        <div className="grid">
                            {projects.map(project => (
                                <div key={project.id} className="card">
                                    <h3>{project.name}</h3>
                                    <p style={{ color: '#666', minHeight: '40px' }}>
                                        {project.description || 'No description'}
                                    </p>
                                    {project.repositoryUrl && (
                                        <p style={{ fontSize: '0.9rem', color: '#667eea', marginTop: '0.5rem' }}>
                                            <a href={project.repositoryUrl} target="_blank" rel="noopener noreferrer">
                                                View on GitHub
                                            </a>
                                        </p>
                                    )}
                                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                        <button className="btn btn-secondary btn-sm" onClick={() => selectProject(project)}>
                                            Open
                                        </button>
                                        <button 
                                            className="btn btn-github btn-sm"
                                            onClick={() => deployToGitHub(project.id)}
                                            disabled={deployingProjects[project.id]}
                                        >
                                            {deployingProjects[project.id] ? 'Deploying...' : 'Deploy'}
                                        </button>
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteProject(project.id)}>
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        function EditorTab({ selectedProject, files, selectedFile, setSelectedFile, fileContent, setFileContent, saveFile, deployToGitHub, deployingProjects }) {
            return (
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                        <h2 style={{ color: 'white', margin: 0 }}>Editor: {selectedProject.name}</h2>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            {selectedFile && (
                                <button className="btn btn-primary btn-sm" onClick={saveFile}>
                                    Save File
                                </button>
                            )}
                            <button 
                                className="btn btn-github btn-sm"
                                onClick={() => deployToGitHub(selectedProject.id)}
                                disabled={deployingProjects[selectedProject.id]}
                            >
                                {deployingProjects[selectedProject.id] ? 'Deploying...' : 'Deploy'}
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', height: 'calc(100% - 60px)' }}>
                        <div style={{ width: '250px' }}>
                            <h4 style={{ color: 'white', marginBottom: '1rem' }}>Files</h4>
                            <div className="file-list">
                                {files.map(file => (
                                    <div
                                        key={file.id}
                                        className={\`file-item \${selectedFile?.id === file.id ? 'active' : ''}\`}
                                        onClick={() => { setSelectedFile(file); setFileContent(file.content); }}
                                    >
                                        {file.path}
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div style={{ flex: 1 }}>
                            {selectedFile ? (
                                <>
                                    <h4 style={{ color: 'white', marginBottom: '0.5rem' }}>{selectedFile.path}</h4>
                                    <textarea
                                        className="editor"
                                        value={fileContent}
                                        onChange={(e) => setFileContent(e.target.value)}
                                        placeholder="Edit code here..."
                                    />
                                </>
                            ) : (
                                <div style={{ textAlign: 'center', color: 'white', paddingTop: '2rem' }}>
                                    Select a file to edit
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            );
        }

        function ChatTab({ messages, chatInput, setChatInput, sendMessage, isTyping, selectedProject, chatEndRef, files, selectedFiles, toggleFileSelection, selectAllFiles }) {
            return (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <h2 style={{ color: 'white', marginBottom: '1rem' }}>Ollama AI Chat - {selectedProject.name}</h2>
                    
                    <div className="file-selector">
                        <div className="file-selector-header">
                            <h4>Select Files for AI Context</h4>
                            <button className="btn btn-secondary select-all-btn" onClick={selectAllFiles}>
                                {selectedFiles.length === files.length ? 'Deselect All' : 'Select All'}
                            </button>
                        </div>
                        <div style={{ fontSize: '0.9rem', color: '#666', marginBottom: '0.5rem' }}>
                            Selected: {selectedFiles.length} of {files.length} files
                        </div>
                        <div style={{ maxHeight: '120px', overflowY: 'auto' }}>
                            {files.map(file => (
                                <div key={file.id} style={{ display: 'flex', alignItems: 'center', padding: '0.25rem 0' }}>
                                    <input
                                        type="checkbox"
                                        className="file-checkbox"
                                        checked={selectedFiles.includes(file.path)}
                                        onChange={() => toggleFileSelection(file.path)}
                                    />
                                    <span style={{ fontSize: '0.9rem' }}>{file.path}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="chat-container">
                        {messages.map((msg, i) => (
                            <div key={i} className={\`message message-\${msg.role}\`}>
                                <strong>{msg.role === 'user' ? 'You' : 'Ollama'}:</strong>
                                <div>{msg.content}</div>
                            </div>
                        ))}
                        {isTyping && <div className="message message-ai"><em>Ollama is thinking...</em></div>}
                        <div ref={chatEndRef} />
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                        <textarea
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            onKeyPress={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    sendMessage();
                                }
                            }}
                            placeholder="Ask Ollama AI something about your code..."
                            style={{ flex: 1, height: '80px' }}
                            className="input"
                        />
                        <button 
                            className="btn btn-primary"
                            onClick={sendMessage}
                            disabled={isTyping || !chatInput.trim()}
                        >
                            Send
                        </button>
                    </div>
                </div>
            );
        }

        function CreateProjectModal({ onCreate, onClose }) {
            const [data, setData] = useState({ name: '', description: '', framework: 'react' });

            const handleSubmit = (e) => {
                e.preventDefault();
                if (data.name.trim()) {
                    onCreate(data);
                }
            };

            return (
                <div className="modal">
                    <div className="modal-content">
                        <h2>Create Project</h2>
                        <form onSubmit={handleSubmit}>
                            <input
                                type="text"
                                placeholder="Project Name"
                                value={data.name}
                                onChange={(e) => setData({...data, name: e.target.value})}
                                className="input"
                                required
                                autoFocus
                            />
                            <textarea
                                placeholder="Description"
                                value={data.description}
                                onChange={(e) => setData({...data, description: e.target.value})}
                                className="input"
                                style={{ minHeight: '80px' }}
                            />
                            <select
                                value={data.framework}
                                onChange={(e) => setData({...data, framework: e.target.value})}
                                className="input"
                            >
                                <option value="react">React</option>
                                <option value="vue">Vue.js</option>
                                <option value="angular">Angular</option>
                                <option value="nextjs">Next.js</option>
                                <option value="vanilla">Vanilla JS</option>
                                <option value="node">Node.js</option>
                            </select>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
                                <button type="button" className="btn btn-secondary" onClick={onClose}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Create
                                </button>
                            </div>
                        </form>
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
    console.log('\n🚀 Dyad Backend Server Starting with Ollama AI\n');
    console.log('📍 HTTP API: http://localhost:' + PORT);
    console.log('🔌 WebSocket: ws://localhost:' + PORT);
    console.log('🎯 UI Dashboard: http://localhost:' + PORT + '/dyad\n');
    
    console.log('✅ Ollama Configuration:');
    console.log(`   Model: ${OLLAMA_MODEL}`);
    console.log(`   API: ${OLLAMA_API_URL}`);
    console.log(`   Available Models: qwen3:4b, llama3, llama3.2\n`);
    
    console.log('✅ GitHub Configuration:');
    console.log(`   Owner: ${GITHUB_OWNER}`);
    console.log(`   Visibility: ${GITHUB_DEFAULT_VISIBILITY}\n`);
    
    console.log('✨ Features:');
    console.log('   ✅ Local Ollama AI integration');
    console.log('   ✅ Project file management');
    console.log('   ✅ AI chat with project context');
    console.log('   ✅ GitHub deployment');
    console.log('   ✅ Real-time WebSocket updates');
    console.log('   ✅ File selection for AI context\n');
    
    console.log('📦 Initializing database...');
    await initializeDatabase();
    console.log('✅ Database initialized\n');

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🎯 Open http://localhost:${PORT}/dyad in your browser\n`);
      console.log('How to use:');
      console.log('1. Make sure Ollama is running on http://localhost:11434');
      console.log('2. Create a new project');
      console.log('3. Add code files to your project');
      console.log('4. Go to AI Chat tab');
      console.log('5. Select specific files for AI context (optional)');
      console.log('6. Chat with Ollama AI about your code');
      console.log('7. Deploy to GitHub when ready\n');
      console.log('Make sure Ollama is running:');
      console.log('ollama serve\n');
    });
  } catch (error) {
    console.error('❌ Server startup failed:', error);
    process.exit(1);
  }
}

startServer();