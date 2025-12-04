// // import express from 'express';
// // import cors from 'cors';
// // import { WebSocketServer } from 'ws';
// // import { createServer } from 'http';
// // import { db, initializeDatabase } from '../db';
// // import { projects, files } from '../db/schema';
// // import { eq, and } from 'drizzle-orm';
// // import path from "path";


// // const app = express();
// // const server = createServer(app);
// // const PORT = 9999;

// // app.use(cors({
// //   origin: ['http://localhost:5173', 'http://localhost:3000'], // bolt.diy dev servers
// //   credentials: true,
// //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// //   allowedHeaders: ['Content-Type', 'Authorization']
// // }));

// // app.use(express.json({ limit: '50mb' }));
// // app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // // Health check endpoint
// // app.get('/health', (req, res) => {
// //   res.json({ 
// //     status: 'ok', 
// //     timestamp: new Date().toISOString(),
// //     service: 'dyad-backend',
// //     version: '1.0.0'
// //   });
// // });

// // // Projects endpoints
// // app.get('/api/projects', async (req, res) => {
// //   try {
// //     console.log('📂 Fetching all projects...');
// //     const allProjects = await db.select().from(projects);
// //     console.log(`📊 Found ${allProjects.length} projects`);
// //     res.json(allProjects);
// //   } catch (error: any) {
// //     console.error('❌ Error fetching projects:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.post('/api/projects', async (req, res) => {
// //   try {
// //     console.log('🆕 Creating new project:', req.body);

// //     const projectData = {
// //       ...req.body,
// //       id: crypto.randomUUID(),
// //       createdAt: new Date(),
// //       updatedAt: new Date(),
// //     };

// //     const [newProject] = await db.insert(projects).values(projectData).returning();

// //     console.log('✅ Project created successfully:', newProject.id);
// //     res.json(newProject);
// //   } catch (error: any) {
// //     console.error('❌ Error creating project:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.get('/api/projects/:id', async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     console.log('🔍 Fetching project:', id);

// //     const project = await db.query.projects.findFirst({
// //       where: eq(projects.id, id),
// //     });

// //     if (!project) {
// //       return res.status(404).json({ error: 'Project not found' });
// //     }

// //     res.json(project);
// //   } catch (error: any) {
// //     console.error('❌ Error fetching project:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.delete('/api/projects/:id', async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     console.log('🗑️ Deleting project:', id);

// //     // Delete associated files first
// //     await db.delete(files).where(eq(files.projectId, id));

// //     // Then delete the project
// //     await db.delete(projects).where(eq(projects.id, id));

// //     console.log('✅ Project deleted successfully');
// //     res.json({ success: true });
// //   } catch (error: any) {
// //     console.error('❌ Error deleting project:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Files endpoints
// // app.get('/api/files', async (req, res) => {
// //   try {
// //     const { projectId } = req.query as { projectId: string };

// //     if (!projectId) {
// //       return res.status(400).json({ error: 'Project ID is required' });
// //     }

// //     console.log('📁 Fetching files for project:', projectId);

// //     const projectFiles = await db.query.files.findMany({
// //       where: eq(files.projectId, projectId),
// //     });

// //     console.log(`📊 Found ${projectFiles.length} files`);
// //     res.json(projectFiles);
// //   } catch (error: any) {
// //     console.error('❌ Error fetching files:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.post('/api/files', async (req, res) => {
// //   try {
// //     const { projectId, path: filePath, content } = req.body;

// //     if (!projectId || !filePath) {
// //       return res.status(400).json({ error: 'Project ID and file path are required' });
// //     }

// //     console.log('💾 Saving file:', filePath, 'in project:', projectId);

// //     const fileData = {
// //       id: crypto.randomUUID(),
// //       projectId,
// //       path: filePath,
// //       content: content || '',
// //       type: 'file' as const,
// //       createdAt: new Date(),
// //       updatedAt: new Date(),
// //     };

// //     // Check if file already exists
// //     const existingFile = await db.query.files.findFirst({
// //       where: and(
// //         eq(files.projectId, projectId),
// //         eq(files.path, filePath)
// //       ),
// //     });

// //     let savedFile;
// //     if (existingFile) {
// //       // Update existing file
// //       [savedFile] = await db.update(files)
// //         .set({
// //           content: fileData.content,
// //           updatedAt: new Date(),
// //         })
// //         .where(and(
// //           eq(files.projectId, projectId),
// //           eq(files.path, filePath)
// //         ))
// //         .returning();
// //     } else {
// //       // Create new file
// //       [savedFile] = await db.insert(files).values(fileData).returning();
// //     }

// //     console.log('✅ File saved successfully');
// //     res.json(savedFile);
// //   } catch (error: any) {
// //     console.error('❌ Error saving file:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Fixed route for reading files - using query parameters instead of path parameters
// // app.get('/api/files/:projectId', async (req, res) => {
// //   try {
// //     const { projectId } = req.params;
// //     const { filePath } = req.query as { filePath: string };

// //     if (!filePath) {
// //       return res.status(400).json({ error: 'File path is required as query parameter' });
// //     }

// //     console.log('📄 Reading file:', filePath, 'from project:', projectId);

// //     const file = await db.query.files.findFirst({
// //       where: and(
// //         eq(files.projectId, projectId),
// //         eq(files.path, decodeURIComponent(filePath))
// //       ),
// //     });

// //     if (!file) {
// //       return res.status(404).json({ error: 'File not found' });
// //     }

// //     res.json(file);
// //   } catch (error: any) {
// //     console.error('❌ Error reading file:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // AI endpoints (mock for now - you can integrate with actual Dyad AI later)
// // app.post('/api/ai/generate', async (req, res) => {
// //   try {
// //     const { prompt, context } = req.body;
// //     console.log('🤖 AI generate request:', prompt);

// //     // Mock AI response - replace with actual Dyad AI integration
// //     const mockResponse = {
// //       content: `// Generated code based on: "${prompt}"\n\nfunction generatedFunction() {\n  console.log('Hello from Dyad AI!');\n  // TODO: Implement actual functionality\n  return {\n    message: 'Code generated successfully',\n    timestamp: new Date().toISOString()\n  };\n}`,
// //       files: [
// //         {
// //           path: 'generated-code.ts',
// //           content: `// Auto-generated by Dyad AI\n// Prompt: ${prompt}\n\nexport function generatedCode() {\n  return 'Hello from Dyad!';\n}`
// //         }
// //       ]
// //     };

// //     // Simulate AI processing delay
// //     await new Promise(resolve => setTimeout(resolve, 1000));

// //     res.json(mockResponse);
// //   } catch (error: any) {
// //     console.error('❌ Error in AI generation:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.post('/api/ai/chat', async (req, res) => {
// //   try {
// //     const { messages, projectId } = req.body;
// //     console.log('💬 AI chat request for project:', projectId);

// //     // Mock streaming response - replace with actual Dyad AI integration
// //     res.setHeader('Content-Type', 'text/plain; charset=utf-8');
// //     res.setHeader('Transfer-Encoding', 'chunked');

// //     const mockResponses = [
// //       'Hello! I\'m Dyad AI. ',
// //       'I can help you with your project development. ',
// //       'What would you like me to help you with today? ',
// //       'I can generate code, explain concepts, or assist with debugging. ',
// //       'Just let me know what you need!'
// //     ];

// //     for (const chunk of mockResponses) {
// //       res.write(chunk);
// //       await new Promise(resolve => setTimeout(resolve, 200));
// //     }

// //     res.end();
// //   } catch (error: any) {
// //     console.error('❌ Error in AI chat:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Dev server management endpoints (mock for now)
// // app.post('/api/dev-server/start', async (req, res) => {
// //   try {
// //     const { projectId, port = 3000 } = req.body;
// //     console.log('🚀 Starting dev server for project:', projectId, 'on port:', port);

// //     // Mock response - integrate with actual Dyad dev server management
// //     res.json({
// //       url: `http://localhost:${port}`,
// //       port,
// //       pid: Math.floor(Math.random() * 10000),
// //       status: 'running'
// //     });
// //   } catch (error: any) {
// //     console.error('❌ Error starting dev server:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.post('/api/dev-server/stop', async (req, res) => {
// //   try {
// //     const { projectId } = req.body;
// //     console.log('🛑 Stopping dev server for project:', projectId);

// //     // Mock response - integrate with actual Dyad dev server management
// //     res.json({ success: true, status: 'stopped' });
// //   } catch (error: any) {
// //     console.error('❌ Error stopping dev server:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // WebSocket setup for real-time updates
// // const wss = new WebSocketServer({ server });

// // wss.on('connection', (ws, request) => {
// //   const clientIP = request.socket.remoteAddress;
// //   console.log('🔌 New WebSocket connection from:', clientIP);

// //   // Send welcome message
// //   ws.send(JSON.stringify({
// //     type: 'connection',
// //     message: 'Connected to Dyad backend',
// //     timestamp: new Date().toISOString()
// //   }));

// //   ws.on('message', (message) => {
// //     try {
// //       const data = JSON.parse(message.toString());
// //       console.log('📨 Received WebSocket message:', data);

// //       // Echo back for testing
// //       ws.send(JSON.stringify({
// //         type: 'echo',
// //         originalMessage: data,
// //         timestamp: new Date().toISOString()
// //       }));
// //     } catch (error) {
// //       console.error('❌ WebSocket message error:', error);
// //     }
// //   });

// //   ws.on('close', () => {
// //     console.log('🔌 WebSocket connection closed');
// //   });

// //   ws.on('error', (error) => {
// //     console.error('❌ WebSocket error:', error);
// //   });
// // });

// // // Error handling middleware
// // app.use((error: any, req: any, res: any, next: any) => {
// //   console.error('🚨 Server error:', error);
// //   res.status(500).json({ 
// //     error: 'Internal server error',
// //     message: error.message 
// //   });
// // });

// // // Start the server
// // server.listen(PORT, '0.0.0.0', async () => {
// //   console.log('🎉 Dyad Backend Server Started!');
// //   console.log(`🌐 HTTP API: http://localhost:${PORT}`);
// //   console.log(`🔌 WebSocket: ws://localhost:${PORT}`);

// //   // Initialize the database
// //   try {
// //     console.log('🔧 Initializing database...');
// //     await initializeDatabase();
// //     console.log('✅ Database initialized successfully!');
// //   } catch (error) {
// //     console.error('❌ Database initialization failed:', error);
// //     process.exit(1);
// //   }

// //   console.log('💡 Ready to accept connections from bolt.diy');
// //   console.log('📡 CORS enabled for: http://localhost:5173, http://localhost:3000');
// // });

// // // Graceful shutdown
// // process.on('SIGTERM', () => {
// //   console.log('🛑 Shutting down Dyad backend server...');
// //   server.close(() => {
// //     console.log('✅ Server closed gracefully');
// //     process.exit(0);
// //   });
// // });
// // // Serve custom UI from public
// // const uiPath = path.join(__dirname, "../../public");
// // app.use(express.static(uiPath));

// // // React Router fallback
// // app.get("*", (_req, res) => {
// //   res.sendFile(path.join(uiPath, "index.html"));
// // });
// // import express from 'express';
// // import cors from 'cors';
// // import { WebSocketServer } from 'ws';
// // import { createServer } from 'http';
// // import { db, initializeDatabase } from '../db';
// // import { projects, files } from '../db/schema';
// // import { eq, and } from 'drizzle-orm';
// // import path from "path";
// // import crypto from 'crypto';

// // const app = express();
// // const server = createServer(app);
// // const PORT = 9999;

// // app.use(cors({
// //   origin: ['http://localhost:5173', 'http://localhost:3000'], // bolt.diy dev servers
// //   credentials: true,
// //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// //   allowedHeaders: ['Content-Type', 'Authorization']
// // }));

// // app.use(express.json({ limit: '50mb' }));
// // app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // // ============= DYAD UI ROUTE - ADD THIS =============
// // app.get('/dyad', (req, res) => {
// //   res.send(`
// // <!DOCTYPE html>
// // <html lang="en">
// // <head>
// //     <meta charset="UTF-8">
// //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
// //     <title>Dyad AI Dashboard</title>
// //     <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
// //     <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
// //     <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
// //     <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.0/axios.min.js"></script>
// //     <script src="https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.44.0/min/vs/loader.min.js"></script>
// //     <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
// //     <style>
// //         * { margin: 0; padding: 0; box-sizing: border-box; }
// //         body { 
// //             font-family: 'Segoe UI', system-ui, sans-serif; 
// //             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
// //             min-height: 100vh;
// //             color: #333;
// //         }
// //         .dashboard { 
// //             display: flex; 
// //             height: 100vh; 
// //             overflow: hidden;
// //         }
// //         .sidebar { 
// //             width: 300px; 
// //             background: rgba(255,255,255,0.95); 
// //             backdrop-filter: blur(10px);
// //             border-right: 1px solid rgba(255,255,255,0.2);
// //             display: flex; 
// //             flex-direction: column;
// //             box-shadow: 2px 0 20px rgba(0,0,0,0.1);
// //         }
// //         .main-content { 
// //             flex: 1; 
// //             display: flex; 
// //             flex-direction: column;
// //             overflow: hidden;
// //         }
// //         .header { 
// //             background: rgba(255,255,255,0.95); 
// //             backdrop-filter: blur(10px);
// //             padding: 1rem 2rem; 
// //             border-bottom: 1px solid rgba(255,255,255,0.2);
// //             display: flex; 
// //             align-items: center; 
// //             justify-content: space-between;
// //             box-shadow: 0 2px 20px rgba(0,0,0,0.1);
// //         }
// //         .logo { 
// //             font-size: 1.5rem; 
// //             font-weight: bold; 
// //             color: #667eea;
// //             display: flex;
// //             align-items: center;
// //             gap: 0.5rem;
// //         }
// //         .content { 
// //             flex: 1; 
// //             padding: 2rem; 
// //             overflow-y: auto;
// //             background: rgba(255,255,255,0.1);
// //         }
// //         .project-grid { 
// //             display: grid; 
// //             grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
// //             gap: 1.5rem;
// //         }
// //         .project-card { 
// //             background: rgba(255,255,255,0.95); 
// //             backdrop-filter: blur(10px);
// //             border-radius: 12px; 
// //             padding: 1.5rem; 
// //             box-shadow: 0 8px 32px rgba(0,0,0,0.1);
// //             border: 1px solid rgba(255,255,255,0.2);
// //             transition: all 0.3s ease;
// //             cursor: pointer;
// //         }
// //         .project-card:hover { 
// //             transform: translateY(-5px); 
// //             box-shadow: 0 12px 40px rgba(0,0,0,0.15);
// //         }
// //         .btn { 
// //             padding: 0.75rem 1.5rem; 
// //             border: none; 
// //             border-radius: 8px; 
// //             cursor: pointer; 
// //             font-weight: 500; 
// //             transition: all 0.3s ease;
// //             display: inline-flex;
// //             align-items: center;
// //             gap: 0.5rem;
// //         }
// //         .btn-primary { 
// //             background: linear-gradient(135deg, #667eea, #764ba2); 
// //             color: white; 
// //         }
// //         .btn-primary:hover { 
// //             transform: translateY(-2px); 
// //             box-shadow: 0 8px 25px rgba(102,126,234,0.3);
// //         }
// //         .btn-secondary { 
// //             background: rgba(255,255,255,0.2); 
// //             color: #333; 
// //             border: 1px solid rgba(255,255,255,0.3);
// //         }
// //         .btn-danger { 
// //             background: linear-gradient(135deg, #ff6b6b, #ee5a52); 
// //             color: white; 
// //         }
// //         .input { 
// //             width: 100%; 
// //             padding: 0.75rem; 
// //             border: 1px solid rgba(255,255,255,0.3); 
// //             border-radius: 8px; 
// //             background: rgba(255,255,255,0.9);
// //             margin-bottom: 1rem;
// //         }
// //         .modal { 
// //             position: fixed; 
// //             top: 0; 
// //             left: 0; 
// //             width: 100%; 
// //             height: 100%; 
// //             background: rgba(0,0,0,0.5); 
// //             backdrop-filter: blur(5px);
// //             display: flex; 
// //             align-items: center; 
// //             justify-content: center; 
// //             z-index: 1000;
// //         }
// //         .modal-content { 
// //             background: rgba(255,255,255,0.95); 
// //             backdrop-filter: blur(10px);
// //             border-radius: 12px; 
// //             padding: 2rem; 
// //             max-width: 500px; 
// //             width: 90%;
// //             box-shadow: 0 20px 60px rgba(0,0,0,0.3);
// //         }
// //         .file-tree { 
// //             background: rgba(255,255,255,0.9); 
// //             border-radius: 8px; 
// //             padding: 1rem; 
// //             margin-bottom: 1rem;
// //             max-height: 200px;
// //             overflow-y: auto;
// //         }
// //         .file-item { 
// //             padding: 0.5rem; 
// //             cursor: pointer; 
// //             border-radius: 4px; 
// //             transition: background 0.2s;
// //         }
// //         .file-item:hover { 
// //             background: rgba(102,126,234,0.1); 
// //         }
// //         .editor-container { 
// //             height: 400px; 
// //             border: 1px solid rgba(255,255,255,0.3); 
// //             border-radius: 8px; 
// //             overflow: hidden;
// //         }
// //         .chat-container { 
// //             height: 300px; 
// //             background: rgba(255,255,255,0.9); 
// //             border-radius: 8px; 
// //             padding: 1rem; 
// //             overflow-y: auto; 
// //             margin-bottom: 1rem;
// //         }
// //         .chat-input { 
// //             display: flex; 
// //             gap: 0.5rem;
// //         }
// //         .status-indicator { 
// //             width: 10px; 
// //             height: 10px; 
// //             border-radius: 50%; 
// //             display: inline-block; 
// //             margin-right: 0.5rem;
// //         }
// //         .status-connected { background: #4CAF50; }
// //         .status-disconnected { background: #f44336; }
// //         .loading { 
// //             display: inline-block; 
// //             width: 20px; 
// //             height: 20px; 
// //             border: 3px solid rgba(255,255,255,0.3); 
// //             border-radius: 50%; 
// //             border-top-color: #667eea; 
// //             animation: spin 1s ease-in-out infinite;
// //         }
// //         @keyframes spin { 
// //             to { transform: rotate(360deg); } 
// //         }
// //         .tab-container { 
// //             display: flex; 
// //             border-bottom: 1px solid rgba(255,255,255,0.3);
// //         }
// //         .tab { 
// //             padding: 1rem 2rem; 
// //             cursor: pointer; 
// //             border-bottom: 2px solid transparent; 
// //             transition: all 0.3s ease;
// //         }
// //         .tab.active { 
// //             border-bottom-color: #667eea; 
// //             background: rgba(102,126,234,0.1);
// //         }
// //         .tab-content { 
// //             padding: 2rem 0;
// //         }
// //         .hidden { 
// //             display: none !important; 
// //         }
// //     </style>
// // </head>
// // <body>
// //     <div id="root"></div>

// //     <script type="text/babel">
// //         const { useState, useEffect, useRef } = React;

// //         // Main Dashboard Component
// //         function DyadDashboard() {
// //             const [activeTab, setActiveTab] = useState('projects');
// //             const [projects, setProjects] = useState([]);
// //             const [selectedProject, setSelectedProject] = useState(null);
// //             const [files, setFiles] = useState([]);
// //             const [selectedFile, setSelectedFile] = useState(null);
// //             const [showCreateModal, setShowCreateModal] = useState(false);
// //             const [loading, setLoading] = useState(false);
// //             const [wsConnected, setWsConnected] = useState(false);
// //             const [chatMessages, setChatMessages] = useState([]);
// //             const [fileContent, setFileContent] = useState('');

// //             // WebSocket connection
// //             useEffect(() => {
// //                 const ws = new WebSocket('ws://localhost:9999');

// //                 ws.onopen = () => {
// //                     setWsConnected(true);
// //                     console.log('Connected to Dyad WebSocket');
// //                 };

// //                 ws.onclose = () => {
// //                     setWsConnected(false);
// //                     console.log('Disconnected from Dyad WebSocket');
// //                 };

// //                 ws.onmessage = (event) => {
// //                     const data = JSON.parse(event.data);
// //                     console.log('WebSocket message:', data);
// //                 };

// //                 return () => ws.close();
// //             }, []);

// //             // Load projects on mount
// //             useEffect(() => {
// //                 loadProjects();
// //             }, []);

// //             const loadProjects = async () => {
// //                 try {
// //                     setLoading(true);
// //                     const response = await axios.get('http://localhost:9999/api/projects');
// //                     setProjects(response.data);
// //                 } catch (error) {
// //                     console.error('Error loading projects:', error);
// //                 } finally {
// //                     setLoading(false);
// //                 }
// //             };

// //             const createProject = async (projectData) => {
// //                 try {
// //                     setLoading(true);
// //                     const response = await axios.post('http://localhost:9999/api/projects', projectData);
// //                     await loadProjects();
// //                     setShowCreateModal(false);
// //                 } catch (error) {
// //                     console.error('Error creating project:', error);
// //                 } finally {
// //                     setLoading(false);
// //                 }
// //             };

// //             const deleteProject = async (projectId) => {
// //                 if (confirm('Are you sure you want to delete this project?')) {
// //                     try {
// //                         await axios.delete(\`http://localhost:9999/api/projects/\${projectId}\`);
// //                         await loadProjects();
// //                         if (selectedProject?.id === projectId) {
// //                             setSelectedProject(null);
// //                             setFiles([]);
// //                         }
// //                     } catch (error) {
// //                         console.error('Error deleting project:', error);
// //                     }
// //                 }
// //             };

// //             const loadFiles = async (projectId) => {
// //                 try {
// //                     const response = await axios.get(\`http://localhost:9999/api/files?projectId=\${projectId}\`);
// //                     setFiles(response.data);
// //                 } catch (error) {
// //                     console.error('Error loading files:', error);
// //                 }
// //             };

// //             const selectProject = async (project) => {
// //                 setSelectedProject(project);
// //                 await loadFiles(project.id);
// //                 setActiveTab('editor');
// //             };

// //             const saveFile = async (projectId, filePath, content) => {
// //                 try {
// //                     await axios.post('http://localhost:9999/api/files', {
// //                         projectId,
// //                         path: filePath,
// //                         content
// //                     });
// //                     console.log('File saved successfully');
// //                 } catch (error) {
// //                     console.error('Error saving file:', error);
// //                 }
// //             };

// //             const sendChatMessage = async (message) => {
// //                 try {
// //                     setChatMessages(prev => [...prev, { role: 'user', content: message }]);

// //                     const response = await axios.post('http://localhost:9999/api/ai/chat', {
// //                         messages: [...chatMessages, { role: 'user', content: message }],
// //                         projectId: selectedProject?.id
// //                     });

// //                     setChatMessages(prev => [...prev, { role: 'assistant', content: 'AI response received!' }]);
// //                 } catch (error) {
// //                     console.error('Error sending chat message:', error);
// //                 }
// //             };

// //             return (
// //                 <div className="dashboard">
// //                     <Sidebar 
// //                         wsConnected={wsConnected}
// //                         activeTab={activeTab}
// //                         setActiveTab={setActiveTab}
// //                         selectedProject={selectedProject}
// //                         projects={projects}
// //                         selectProject={selectProject}
// //                     />
// //                     <div className="main-content">
// //                         <Header 
// //                             wsConnected={wsConnected}
// //                             selectedProject={selectedProject}
// //                             onCreateProject={() => setShowCreateModal(true)}
// //                         />
// //                         <div className="content">
// //                             {activeTab === 'projects' && (
// //                                 <ProjectsTab 
// //                                     projects={projects}
// //                                     loading={loading}
// //                                     onSelectProject={selectProject}
// //                                     onDeleteProject={deleteProject}
// //                                 />
// //                             )}
// //                             {activeTab === 'editor' && (
// //                                 <EditorTab 
// //                                     selectedProject={selectedProject}
// //                                     files={files}
// //                                     fileContent={fileContent}
// //                                     setFileContent={setFileContent}
// //                                     onSaveFile={saveFile}
// //                                 />
// //                             )}
// //                             {activeTab === 'ai-chat' && (
// //                                 <AIChatTab 
// //                                     messages={chatMessages}
// //                                     onSendMessage={sendChatMessage}
// //                                 />
// //                             )}
// //                         </div>
// //                     </div>
// //                     {showCreateModal && (
// //                         <CreateProjectModal 
// //                             onClose={() => setShowCreateModal(false)}
// //                             onCreate={createProject}
// //                         />
// //                     )}
// //                 </div>
// //             );
// //         }

// //         // Sidebar Component
// //         function Sidebar({ wsConnected, activeTab, setActiveTab, selectedProject, projects, selectProject }) {
// //             const tabs = [
// //                 { id: 'projects', icon: 'fas fa-folder', label: 'Projects' },
// //                 { id: 'editor', icon: 'fas fa-code', label: 'Editor' },
// //                 { id: 'ai-chat', icon: 'fas fa-robot', label: 'AI Chat' }
// //             ];

// //             return (
// //                 <div className="sidebar">
// //                     <div style={{ padding: '1.5rem' }}>
// //                         <h2 className="logo">
// //                             <i className="fas fa-cube"></i>
// //                             Dyad AI
// //                         </h2>
// //                         <div style={{ marginTop: '0.5rem', fontSize: '0.8rem', color: '#666' }}>
// //                             <span className={\`status-indicator \${wsConnected ? 'status-connected' : 'status-disconnected'}\`}></span>
// //                             {wsConnected ? 'Connected' : 'Disconnected'}
// //                         </div>
// //                     </div>

// //                     <div className="tab-container" style={{ flexDirection: 'column', borderBottom: 'none' }}>
// //                         {tabs.map(tab => (
// //                             <div 
// //                                 key={tab.id}
// //                                 className={\`tab \${activeTab === tab.id ? 'active' : ''}\`}
// //                                 onClick={() => setActiveTab(tab.id)}
// //                                 style={{ borderBottom: 'none', borderLeft: activeTab === tab.id ? '3px solid #667eea' : 'none' }}
// //                             >
// //                                 <i className={tab.icon}></i> {tab.label}
// //                             </div>
// //                         ))}
// //                     </div>

// //                     <div style={{ padding: '1rem', flex: 1 }}>
// //                         {selectedProject && (
// //                             <div>
// //                                 <h4>Current Project</h4>
// //                                 <div className="project-card" style={{ marginTop: '0.5rem', padding: '1rem' }}>
// //                                     <h5>{selectedProject.name}</h5>
// //                                     <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '0.5rem' }}>
// //                                         {selectedProject.framework}
// //                                     </p>
// //                                 </div>
// //                             </div>
// //                         )}

// //                         {projects.length > 0 && (
// //                             <div style={{ marginTop: '1rem' }}>
// //                                 <h4>Quick Access</h4>
// //                                 {projects.slice(0, 3).map(project => (
// //                                     <div 
// //                                         key={project.id}
// //                                         className="file-item"
// //                                         onClick={() => selectProject(project)}
// //                                     >
// //                                         <i className="fas fa-folder-open"></i> {project.name}
// //                                     </div>
// //                                 ))}
// //                             </div>
// //                         )}
// //                     </div>
// //                 </div>
// //             );
// //         }

// //         // Header Component
// //         function Header({ wsConnected, selectedProject, onCreateProject }) {
// //             return (
// //                 <div className="header">
// //                     <div>
// //                         <h1 style={{ margin: 0 }}>Dashboard</h1>
// //                         {selectedProject && (
// //                             <p style={{ margin: 0, color: '#666' }}>Editing: {selectedProject.name}</p>
// //                         )}
// //                     </div>
// //                     <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
// //                         <button className="btn btn-primary" onClick={onCreateProject}>
// //                             <i className="fas fa-plus"></i> New Project
// //                         </button>
// //                     </div>
// //                 </div>
// //             );
// //         }

// //         // Projects Tab
// //         function ProjectsTab({ projects, loading, onSelectProject, onDeleteProject }) {
// //             if (loading) {
// //                 return <div style={{ textAlign: 'center', padding: '2rem' }}>
// //                     <div className="loading"></div>
// //                     <p>Loading projects...</p>
// //                 </div>;
// //             }

// //             return (
// //                 <div>
// //                     <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>Your Projects</h2>
// //                     <div className="project-grid">
// //                         {projects.map(project => (
// //                             <div key={project.id} className="project-card">
// //                                 <h3>{project.name}</h3>
// //                                 <p style={{ color: '#666', margin: '0.5rem 0' }}>{project.description}</p>
// //                                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
// //                                     <span style={{ 
// //                                         background: '#667eea', 
// //                                         color: 'white', 
// //                                         padding: '0.25rem 0.5rem', 
// //                                         borderRadius: '4px', 
// //                                         fontSize: '0.8rem' 
// //                                     }}>
// //                                         {project.framework}
// //                                     </span>
// //                                     <div style={{ display: 'flex', gap: '0.5rem' }}>
// //                                         <button 
// //                                             className="btn btn-secondary"
// //                                             onClick={() => onSelectProject(project)}
// //                                         >
// //                                             <i className="fas fa-edit"></i> Open
// //                                         </button>
// //                                         <button 
// //                                             className="btn btn-danger"
// //                                             onClick={() => onDeleteProject(project.id)}
// //                                         >
// //                                             <i className="fas fa-trash"></i>
// //                                         </button>
// //                                     </div>
// //                                 </div>
// //                             </div>
// //                         ))}
// //                     </div>
// //                 </div>
// //             );
// //         }

// //         // Editor Tab
// //         function EditorTab({ selectedProject, files, fileContent, setFileContent, onSaveFile }) {
// //             const [selectedFile, setSelectedFile] = useState(null);
// //             const [newFileName, setNewFileName] = useState('');

// //             if (!selectedProject) {
// //                 return (
// //                     <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
// //                         <i className="fas fa-folder-open" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
// //                         <h3>No Project Selected</h3>
// //                         <p>Please select a project from the Projects tab to start editing.</p>
// //                     </div>
// //                 );
// //             }

// //             const createFile = async () => {
// //                 if (newFileName.trim()) {
// //                     await onSaveFile(selectedProject.id, newFileName, '// New file\\n');
// //                     setNewFileName('');
// //                     window.location.reload(); // Refresh to show new file
// //                 }
// //             };

// //             const selectFile = (file) => {
// //                 setSelectedFile(file);
// //                 setFileContent(file.content || '');
// //             };

// //             const saveCurrentFile = async () => {
// //                 if (selectedFile) {
// //                     await onSaveFile(selectedProject.id, selectedFile.path, fileContent);
// //                     alert('File saved successfully!');
// //                 }
// //             };

// //             return (
// //                 <div>
// //                     <div style={{ display: 'flex', gap: '2rem', height: '100%' }}>
// //                         <div style={{ width: '300px' }}>
// //                             <h3 style={{ color: 'white', marginBottom: '1rem' }}>Files</h3>
// //                             <div className="file-tree">
// //                                 <div style={{ marginBottom: '1rem' }}>
// //                                     <input 
// //                                         type="text" 
// //                                         placeholder="New file name..." 
// //                                         value={newFileName}
// //                                         onChange={(e) => setNewFileName(e.target.value)}
// //                                         className="input"
// //                                         style={{ marginBottom: '0.5rem' }}
// //                                     />
// //                                     <button className="btn btn-primary" onClick={createFile} style={{ width: '100%' }}>
// //                                         <i className="fas fa-plus"></i> Create File
// //                                     </button>
// //                                 </div>
// //                                 {files.map(file => (
// //                                     <div 
// //                                         key={file.id} 
// //                                         className={\`file-item \${selectedFile?.id === file.id ? 'active' : ''}\`}
// //                                         onClick={() => selectFile(file)}
// //                                         style={{ 
// //                                             background: selectedFile?.id === file.id ? 'rgba(102,126,234,0.2)' : 'transparent'
// //                                         }}
// //                                     >
// //                                         <i className="fas fa-file-code"></i> {file.path}
// //                                     </div>
// //                                 ))}
// //                             </div>
// //                         </div>
// //                         <div style={{ flex: 1 }}>
// //                             {selectedFile ? (
// //                                 <div>
// //                                     <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
// //                                         <h3 style={{ color: 'white' }}>Editing: {selectedFile.path}</h3>
// //                                         <button className="btn btn-primary" onClick={saveCurrentFile}>
// //                                             <i className="fas fa-save"></i> Save File
// //                                         </button>
// //                                     </div>
// //                                     <textarea 
// //                                         value={fileContent}
// //                                         onChange={(e) => setFileContent(e.target.value)}
// //                                         style={{ 
// //                                             width: '100%', 
// //                                             height: '500px', 
// //                                             fontFamily: 'monospace',
// //                                             background: 'rgba(255,255,255,0.95)',
// //                                             border: '1px solid rgba(255,255,255,0.3)',
// //                                             borderRadius: '8px',
// //                                             padding: '1rem'
// //                                         }}
// //                                         placeholder="Enter your code here..."
// //                                     />
// //                                 </div>
// //                             ) : (
// //                                 <div style={{ textAlign: 'center', padding: '2rem', color: 'white' }}>
// //                                     <i className="fas fa-file-code" style={{ fontSize: '3rem', marginBottom: '1rem' }}></i>
// //                                     <h3>No File Selected</h3>
// //                                     <p>Select a file from the file tree to start editing.</p>
// //                                 </div>
// //                             )}
// //                         </div>
// //                     </div>
// //                 </div>
// //             );
// //         }

// //         // AI Chat Tab
// //         function AIChatTab({ messages, onSendMessage }) {
// //             const [inputValue, setInputValue] = useState('');

// //             const sendMessage = () => {
// //                 if (inputValue.trim()) {
// //                     onSendMessage(inputValue);
// //                     setInputValue('');
// //                 }
// //             };

// //             const handleKeyPress = (e) => {
// //                 if (e.key === 'Enter' && !e.shiftKey) {
// //                     e.preventDefault();
// //                     sendMessage();
// //                 }
// //             };

// //             return (
// //                 <div>
// //                     <h2 style={{ marginBottom: '1.5rem', color: 'white' }}>AI Assistant</h2>
// //                     <div className="chat-container">
// //                         {messages.length === 0 ? (
// //                             <div style={{ textAlign: 'center', color: '#666', padding: '2rem' }}>
// //                                 <i className="fas fa-robot" style={{ fontSize: '2rem', marginBottom: '1rem' }}></i>
// //                                 <p>Start a conversation with the AI assistant!</p>
// //                             </div>
// //                         ) : (
// //                             messages.map((msg, idx) => (
// //                                 <div key={idx} style={{ 
// //                                     marginBottom: '1rem', 
// //                                     padding: '0.5rem',
// //                                     background: msg.role === 'user' ? '#667eea' : '#f0f0f0',
// //                                     color: msg.role === 'user' ? 'white' : '#333',
// //                                     borderRadius: '8px',
// //                                     marginLeft: msg.role === 'user' ? '2rem' : '0',
// //                                     marginRight: msg.role === 'assistant' ? '2rem' : '0'
// //                                 }}>
// //                                     <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
// //                                 </div>
// //                             ))
// //                         )}
// //                     </div>
// //                     <div className="chat-input">
// //                         <textarea 
// //                             value={inputValue}
// //                             onChange={(e) => setInputValue(e.target.value)}
// //                             onKeyPress={handleKeyPress}
// //                             placeholder="Ask the AI assistant anything..."
// //                             style={{ 
// //                                 flex: 1, 
// //                                 padding: '1rem', 
// //                                 border: '1px solid rgba(255,255,255,0.3)', 
// //                                 borderRadius: '8px',
// //                                 background: 'rgba(255,255,255,0.95)',
// //                                 resize: 'none',
// //                                 minHeight: '60px'
// //                             }}
// //                         />
// //                         <button className="btn btn-primary" onClick={sendMessage}>
// //                             <i className="fas fa-paper-plane"></i> Send
// //                         </button>
// //                     </div>
// //                 </div>
// //             );
// //         }

// //         // Create Project Modal
// //         function CreateProjectModal({ onClose, onCreate }) {
// //             const [name, setName] = useState('');
// //             const [description, setDescription] = useState('');
// //             const [framework, setFramework] = useState('react');

// //             const handleSubmit = (e) => {
// //                 e.preventDefault();
// //                 if (name.trim()) {
// //                     onCreate({ name, description, framework });
// //                 }
// //             };

// //             return (
// //                 <div className="modal">
// //                     <div className="modal-content">
// //                         <h2>Create New Project</h2>
// //                         <form onSubmit={handleSubmit}>
// //                             <input 
// //                                 type="text" 
// //                                 placeholder="Project Name" 
// //                                 value={name}
// //                                 onChange={(e) => setName(e.target.value)}
// //                                 className="input"
// //                                 required
// //                             />
// //                             <textarea 
// //                                 placeholder="Project Description" 
// //                                 value={description}
// //                                 onChange={(e) => setDescription(e.target.value)}
// //                                 className="input"
// //                                 style={{ minHeight: '80px', resize: 'vertical' }}
// //                             />
// //                             <select 
// //                                 value={framework}
// //                                 onChange={(e) => setFramework(e.target.value)}
// //                                 className="input"
// //                             >
// //                                 <option value="react">React</option>
// //                                 <option value="vue">Vue.js</option>
// //                                 <option value="angular">Angular</option>
// //                                 <option value="svelte">Svelte</option>
// //                                 <option value="vanilla">Vanilla JS</option>
// //                                 <option value="node">Node.js</option>
// //                                 <option value="python">Python</option>
// //                                 <option value="nextjs">Next.js</option>
// //                             </select>
// //                             <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
// //                                 <button type="button" className="btn btn-secondary" onClick={onClose}>
// //                                     Cancel
// //                                 </button>
// //                                 <button type="submit" className="btn btn-primary">
// //                                     <i className="fas fa-plus"></i> Create Project
// //                                 </button>
// //                             </div>
// //                         </form>
// //                     </div>
// //                 </div>
// //             );
// //         }

// //         // Render the app
// //         ReactDOM.render(<DyadDashboard />, document.getElementById('root'));
// //     </script>
// // </body>
// // </html>
// //   `);
// // });

// // // Health check endpoint
// // app.get('/health', (req, res) => {
// //   res.json({ 
// //     status: 'ok', 
// //     timestamp: new Date().toISOString(),
// //     service: 'dyad-backend',
// //     version: '1.0.0'
// //   });
// // });

// // // Projects endpoints
// // app.get('/api/projects', async (req, res) => {
// //   try {
// //     console.log('📂 Fetching all projects...');
// //     const allProjects = await db.select().from(projects);
// //     console.log(`📊 Found ${allProjects.length} projects`);
// //     res.json(allProjects);
// //   } catch (error: any) {
// //     console.error('❌ Error fetching projects:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.post('/api/projects', async (req, res) => {
// //   try {
// //     console.log('🆕 Creating new project:', req.body);

// //     const projectData = {
// //       ...req.body,
// //       id: crypto.randomUUID(),
// //       createdAt: new Date(),
// //       updatedAt: new Date(),
// //     };

// //     const [newProject] = await db.insert(projects).values(projectData).returning();

// //     console.log('✅ Project created successfully:', newProject.id);
// //     res.json(newProject);
// //   } catch (error: any) {
// //     console.error('❌ Error creating project:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.get('/api/projects/:id', async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     console.log('🔍 Fetching project:', id);

// //     const project = await db.query.projects.findFirst({
// //       where: eq(projects.id, id),
// //     });

// //     if (!project) {
// //       return res.status(404).json({ error: 'Project not found' });
// //     }

// //     res.json(project);
// //   } catch (error: any) {
// //     console.error('❌ Error fetching project:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.delete('/api/projects/:id', async (req, res) => {
// //   try {
// //     const { id } = req.params;
// //     console.log('🗑️ Deleting project:', id);

// //     // Delete associated files first
// //     await db.delete(files).where(eq(files.projectId, id));

// //     // Then delete the project
// //     await db.delete(projects).where(eq(projects.id, id));

// //     console.log('✅ Project deleted successfully');
// //     res.json({ success: true });
// //   } catch (error: any) {
// //     console.error('❌ Error deleting project:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Files endpoints
// // app.get('/api/files', async (req, res) => {
// //   try {
// //     const { projectId } = req.query as { projectId: string };

// //     if (!projectId) {
// //       return res.status(400).json({ error: 'Project ID is required' });
// //     }

// //     console.log('📁 Fetching files for project:', projectId);

// //     const projectFiles = await db.query.files.findMany({
// //       where: eq(files.projectId, projectId),
// //     });

// //     console.log(`📊 Found ${projectFiles.length} files`);
// //     res.json(projectFiles);
// //   } catch (error: any) {
// //     console.error('❌ Error fetching files:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.post('/api/files', async (req, res) => {
// //   try {
// //     const { projectId, path: filePath, content } = req.body;

// //     if (!projectId || !filePath) {
// //       return res.status(400).json({ error: 'Project ID and file path are required' });
// //     }

// //     console.log('💾 Saving file:', filePath, 'in project:', projectId);

// //     const fileData = {
// //       id: crypto.randomUUID(),
// //       projectId,
// //       path: filePath,
// //       content: content || '',
// //       type: 'file' as const,
// //       createdAt: new Date(),
// //       updatedAt: new Date(),
// //     };

// //     // Check if file already exists
// //     const existingFile = await db.query.files.findFirst({
// //       where: and(
// //         eq(files.projectId, projectId),
// //         eq(files.path, filePath)
// //       ),
// //     });

// //     let savedFile;
// //     if (existingFile) {
// //       // Update existing file
// //       [savedFile] = await db.update(files)
// //         .set({
// //           content: fileData.content,
// //           updatedAt: new Date(),
// //         })
// //         .where(and(
// //           eq(files.projectId, projectId),
// //           eq(files.path, filePath)
// //         ))
// //         .returning();
// //     } else {
// //       // Create new file
// //       [savedFile] = await db.insert(files).values(fileData).returning();
// //     }

// //     console.log('✅ File saved successfully');
// //     res.json(savedFile);
// //   } catch (error: any) {
// //     console.error('❌ Error saving file:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Fixed route for reading files - using query parameters instead of path parameters
// // app.get('/api/files/:projectId', async (req, res) => {
// //   try {
// //     const { projectId } = req.params;
// //     const { filePath } = req.query as { filePath: string };

// //     if (!filePath) {
// //       return res.status(400).json({ error: 'File path is required as query parameter' });
// //     }

// //     console.log('📄 Reading file:', filePath, 'from project:', projectId);

// //     const file = await db.query.files.findFirst({
// //       where: and(
// //         eq(files.projectId, projectId),
// //         eq(files.path, decodeURIComponent(filePath))
// //       ),
// //     });

// //     if (!file) {
// //       return res.status(404).json({ error: 'File not found' });
// //     }

// //     res.json(file);
// //   } catch (error: any) {
// //     console.error('❌ Error reading file:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // AI endpoints (mock for now - you can integrate with actual Dyad AI later)
// // app.post('/api/ai/generate', async (req, res) => {
// //   try {
// //     const { prompt, context } = req.body;
// //     console.log('🤖 AI generate request:', prompt);

// //     // Mock AI response - replace with actual Dyad AI integration
// //     const mockResponse = {
// //       content: `// Generated code based on: "${prompt}"\n\nfunction generatedFunction() {\n  console.log('Hello from Dyad AI!');\n  // TODO: Implement actual functionality\n  return {\n    message: 'Code generated successfully',\n    timestamp: new Date().toISOString()\n  };\n}`,
// //       files: [
// //         {
// //           path: 'generated-code.ts',
// //           content: `// Auto-generated by Dyad AI\n// Prompt: ${prompt}\n\nexport function generatedCode() {\n  return 'Hello from Dyad!';\n}`
// //         }
// //       ]
// //     };

// //     // Simulate AI processing delay
// //     await new Promise(resolve => setTimeout(resolve, 1000));

// //     res.json(mockResponse);
// //   } catch (error: any) {
// //     console.error('❌ Error in AI generation:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.post('/api/ai/chat', async (req, res) => {
// //   try {
// //     const { messages, projectId } = req.body;
// //     console.log('💬 AI chat request for project:', projectId);

// //     // Mock streaming response - replace with actual Dyad AI integration
// //     res.setHeader('Content-Type', 'text/plain; charset=utf-8');
// //     res.setHeader('Transfer-Encoding', 'chunked');

// //     const mockResponses = [
// //       'Hello! I\'m Dyad AI. ',
// //       'I can help you with your project development. ',
// //       'What would you like me to help you with today? ',
// //       'I can generate code, explain concepts, or assist with debugging. ',
// //       'Just let me know what you need!'
// //     ];

// //     for (const chunk of mockResponses) {
// //       res.write(chunk);
// //       await new Promise(resolve => setTimeout(resolve, 200));
// //     }

// //     res.end();
// //   } catch (error: any) {
// //     console.error('❌ Error in AI chat:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Dev server management endpoints (mock for now)
// // app.post('/api/dev-server/start', async (req, res) => {
// //   try {
// //     const { projectId, port = 3000 } = req.body;
// //     console.log('🚀 Starting dev server for project:', projectId, 'on port:', port);

// //     // Mock response - integrate with actual Dyad dev server management
// //     res.json({
// //       url: `http://localhost:${port}`,
// //       port,
// //       pid: Math.floor(Math.random() * 10000),
// //       status: 'running'
// //     });
// //   } catch (error: any) {
// //     console.error('❌ Error starting dev server:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // app.post('/api/dev-server/stop', async (req, res) => {
// //   try {
// //     const { projectId } = req.body;
// //     console.log('🛑 Stopping dev server for project:', projectId);

// //     // Mock response - integrate with actual Dyad dev server management
// //     res.json({ success: true, status: 'stopped' });
// //   } catch (error: any) {
// //     console.error('❌ Error stopping dev server:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // WebSocket setup for real-time updates
// // const wss = new WebSocketServer({ server });

// // wss.on('connection', (ws, request) => {
// //   const clientIP = request.socket.remoteAddress;
// //   console.log('🔌 New WebSocket connection from:', clientIP);

// //   // Send welcome message
// //   ws.send(JSON.stringify({
// //     type: 'connection',
// //     message: 'Connected to Dyad backend',
// //     timestamp: new Date().toISOString()
// //   }));

// //   ws.on('message', (message) => {
// //     try {
// //       const data = JSON.parse(message.toString());
// //       console.log('📨 Received WebSocket message:', data);

// //       // Echo back for testing
// //       ws.send(JSON.stringify({
// //         type: 'echo',
// //         originalMessage: data,
// //         timestamp: new Date().toISOString()
// //       }));
// //     } catch (error) {
// //       console.error('❌ WebSocket message error:', error);
// //     }
// //   });

// //   ws.on('close', () => {
// //     console.log('🔌 WebSocket connection closed');
// //   });

// //   ws.on('error', (error) => {
// //     console.error('❌ WebSocket error:', error);
// //   });
// // });

// // // Error handling middleware
// // app.use((error: any, req: any, res: any, next: any) => {
// //   console.error('🚨 Server error:', error);
// //   res.status(500).json({ 
// //     error: 'Internal server error',
// //     message: error.message 
// //   });
// // });

// // // Start the server
// // server.listen(PORT, '0.0.0.0', async () => {
// //   console.log('🎉 Dyad Backend Server Started!');
// //   console.log(`🌐 HTTP API: http://localhost:${PORT}`);
// //   console.log(`🔌 WebSocket: ws://localhost:${PORT}`);
// //   console.log(`🎨 Dyad UI: http://localhost:${PORT}/dyad`);

// //   // Initialize the database
// //   try {
// //     console.log('🔧 Initializing database...');
// //     await initializeDatabase();
// //     console.log('✅ Database initialized successfully!');
// //   } catch (error) {
// //     console.error('❌ Database initialization failed:', error);
// //     process.exit(1);
// //   }

// //   console.log('💡 Ready to accept connections from bolt.diy');
// //   console.log('📡 CORS enabled for: http://localhost:5173, http://localhost:3000');
// // });

// // // Graceful shutdown
// // process.on('SIGTERM', () => {
// //   console.log('🛑 Shutting down Dyad backend server...');
// //   server.close(() => {
// //     console.log('✅ Server closed gracefully');
// //     process.exit(0);
// //   });
// // });
// import express from 'express';
// import cors from 'cors';
// import { WebSocketServer } from 'ws';
// import { createServer } from 'http';
// import { db, initializeDatabase } from '../db';
// // DIRECT IMPORT - Use the exact table names from schema
// import { boltProjects, boltFiles } from '../db/schema.js';
// import { eq, and } from 'drizzle-orm';
// import path from "path";
// import crypto from 'crypto';
// import fs from 'fs';
// import { fileURLToPath } from 'url';
// import { dirname } from 'path';
// import { projects, files } from '../db/schema'; // ensure this matches your import path

// type FileInsert = typeof files.$inferInsert;
// type ProjectInsert = typeof projects.$inferInsert;

// // // Create aliases after import for cleaner code
// // const projects = boltProjects;
// // const files = boltFiles;

// const app = express();
// const server = createServer(app);
// const wss = new WebSocketServer({ server });
// const PORT = 9999;

// // Store WebSocket connections
// const wsConnections = new Set();

// app.use(cors({
//   origin: ['http://localhost:5173', 'http://localhost:3000'],
//   credentials: true,
//   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// app.use(express.json({ limit: '50mb' }));
// app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // WebSocket connection handling
// wss.on('connection', (ws, req) => {
//   const clientIp = req.socket.remoteAddress;
//   console.log(`New WebSocket connection from: ${clientIp}`);

//   wsConnections.add(ws);

//   ws.on('message', async (message) => {
//     try {
//       const data = JSON.parse(message.toString());
//       console.log('WebSocket message received:', data.type);

//       switch (data.type) {
//         case 'file_created':
//         case 'file_updated':
//           await handleFileSync(data);
//           break;
//         case 'project_created':
//           await handleProjectSync(data);
//           break;
//         case 'bulk_files':
//           await handleBulkFileSync(data);
//           break;
//         default:
//           console.log('Unknown message type:', data.type);
//       }
//     } catch (error) {
//       console.error('Error processing WebSocket message:', error);
//     }
//   });

//   ws.on('close', () => {
//     wsConnections.delete(ws);
//     console.log('WebSocket connection closed');
//   });

//   ws.on('error', (error) => {
//     console.error('WebSocket error:', error);
//     wsConnections.delete(ws);
//   });
// });

// // Broadcast to all connected clients
// function broadcast(data: any) {
//   const message = JSON.stringify(data);
//   wsConnections.forEach((ws: any) => {
//     if (ws.readyState === ws.OPEN) {
//       ws.send(message);
//     }
//   });
// }

// // Handle file synchronization from bolt.diy
// async function handleFileSync(data: any) {
//   try {
//     const { projectId, filePath, content, operation } = data;

//     console.log(`Syncing file: ${filePath} for project: ${projectId}`);

//     // Check if project exists, if not create it
//     let project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

//     if (project.length === 0) {
//       // Create project if it doesn't exist - only use fields that exist in schema
//       const projectData: any = {
//         id: projectId,
//         name: data.projectName || 'Bolt Project'
//       };

//       // Only add optional fields if they exist in the schema
//       if (data.projectDescription) {
//         projectData.description = data.projectDescription;
//       }
//       if (data.framework) {
//         projectData.framework = data.framework;
//       }
//       if (data.template) {
//         projectData.template = data.template;
//       }

//       await db.insert(projects).values(projectData);
//       console.log(`Created project: ${projectId}`);
//     }

//     // Check if file already exists
//     const existingFile = await db.select().from(files)
//       .where(and(eq(files.projectId, projectId), eq(files.path, filePath)))
//       .limit(1);

//     if (existingFile.length > 0) {
//       // Update existing file
//       await db.update(files)
//         .set({
//           content: content
//         })
//         .where(eq(files.id, existingFile[0].id));
//       console.log(`Updated file: ${filePath}`);
//     } else {
//       // Create new file
//       await db.insert(files).values({
//   id: crypto.randomUUID(),
//   projectId,
//   path: filePath,
//   content: content ?? '',
//   type: 'file'
// } as any);

//       console.log(`Created file: ${filePath}`);
//     }

//     // Broadcast update to connected clients
//     broadcast({
//       type: 'file_synced',
//       projectId,
//       filePath,
//       operation
//     } as any);

//   } catch (error) {
//     console.error('Error syncing file:', error);
//   }
// }

// // Handle project synchronization from bolt.diy
// async function handleProjectSync(data: any) {
//   try {
//     const { projectId, name, description, framework, template } = data;

//     console.log(`Syncing project: ${name}`);

//     // Check if project already exists
//     const existingProject = await db.select().from(projects)
//       .where(eq(projects.id, projectId))
//       .limit(1);

//     if (existingProject.length === 0) {
//       const projectData: any = {
//         id: projectId,
//         name: name
//       };

//       // Only add optional fields if they exist in the schema and have values
//       if (description) {
//         projectData.description = description;
//       }
//       if (framework) {
//         projectData.framework = framework;
//       }
//       if (template) {
//         projectData.template = template;
//       }

//       await db.insert(projects).values(projectData);
//       console.log(`Project synced: ${projectId}`);
//     }

//     broadcast({
//       type: 'project_synced',
//       projectId,
//       name
//     });

//   } catch (error) {
//     console.error('Error syncing project:', error);
//   }
// }

// // Handle bulk file synchronization from bolt.diy
// async function handleBulkFileSync(data: any) {
//   try {
//     const { projectId, files: filesList, projectName, framework, template } = data;

//     console.log(`Bulk syncing ${filesList.length} files for project: ${projectId}`);

//     // Ensure project exists
//     let project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

//     if (project.length === 0) {
//       const projectData: any = {
//         id: projectId,
//         name: projectName || 'Bolt Project'
//       };

//       // Only add optional fields if they have values
//       if (framework) {
//         projectData.framework = framework;
//       }
//       if (template) {
//         projectData.template = template;
//       }
//       // Add default description
//       projectData.description = 'Project created from bolt.diy';

//       await db.insert(projects).values(projectData);
//       console.log(`Created project during bulk sync: ${projectId}`);
//     }

//     // Process each file
//     for (const file of filesList) {
//       const { path: filePath, content } = file;

//       // Check if file exists
//       const existingFile = await db.select().from(files)
//         .where(and(eq(files.projectId, projectId), eq(files.path, filePath)))
//         .limit(1);

//       if (existingFile.length > 0) {
//         // Update existing file
//         await db.update(files)
//           .set({
//             content: content
//           })
//           .where(eq(files.id, existingFile[0].id));
//       } else {
//         // Create new file
//         await db.insert(files).values({
//     id: crypto.randomUUID(),
//     projectId: projectId,
//     path: filePath,
//     content: content,
//     type: 'file'
//   } as any);
//       }
//     }

//     console.log(`Bulk sync completed for project: ${projectId}`);

//     broadcast({
//       type: 'bulk_sync_completed',
//       projectId,
//       filesCount: filesList.length
//     });

//   } catch (error) {
//     console.error('Error in bulk file sync:', error);
//   }
// }

// // ============= API ROUTES =============

// // Get all projects
// app.get('/api/projects', async (req, res) => {
//   try {
//     console.log('Fetching all projects...');
//     const allProjects = await db.select().from(projects).orderBy(projects.updatedAt);
//     console.log(`Found ${allProjects.length} projects`);
//     res.json(allProjects);
//   } catch (error) {
//     console.error('Error fetching projects:', error);
//     res.status(500).json({ error: 'Failed to fetch projects' });
//   }
// });

// // Create a new project
// app.post('/api/projects', async (req, res) => {
//   try {
//     const { name, description, framework, template } = req.body;
//     console.log('Creating new project:', { name, description, framework, template });

//     const projectId = crypto.randomUUID();

//     const projectData: any = {
//       id: projectId,
//       name
//     };

//     // Only add optional fields if they have values
//     if (description) {
//       projectData.description = description;
//     }
//     if (framework) {
//       projectData.framework = framework;
//     }
//     if (template) {
//       projectData.template = template;
//     }

//     await db.insert(projects).values(projectData);

//     console.log(`Project created successfully: ${projectId}`);

//     broadcast({
//       type: 'project_created',
//       projectId,
//       name
//     });

//     res.json({ id: projectId, name, description, framework, template });
//   } catch (error) {
//     console.error('Error creating project:', error);
//     res.status(500).json({ error: 'Failed to create project' });
//   }
// });

// // Delete a project
// app.delete('/api/projects/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log(`Deleting project: ${id}`);

//     // Delete all files in the project first
//     await db.delete(files).where(eq(files.projectId, id));

//     // Delete the project
//     await db.delete(projects).where(eq(projects.id, id));

//     console.log(`Project deleted successfully: ${id}`);

//     broadcast({
//       type: 'project_deleted',
//       projectId: id
//     });

//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error deleting project:', error);
//     res.status(500).json({ error: 'Failed to delete project' });
//   }
// });

// // Get files for a project
// app.get('/api/files', async (req, res) => {
//   try {
//     const { projectId } = req.query;
//     console.log(`Fetching files for project: ${projectId}`);

//     if (!projectId) {
//       return res.status(400).json({ error: 'Project ID is required' });
//     }

//     const projectFiles = await db.select().from(files)
//       .where(eq(files.projectId, projectId as string))
//       .orderBy(files.path);

//     console.log(`Found ${projectFiles.length} files`);
//     res.json(projectFiles);
//   } catch (error) {
//     console.error('Error fetching files:', error);
//     res.status(500).json({ error: 'Failed to fetch files' });
//   }
// });

// // Create or update a file
// app.post('/api/files', async (req, res) => {
//   try {
//     const { projectId, path: filePath, content } = req.body;
//     console.log(`Saving file: ${filePath} for project: ${projectId}`);

//     if (!projectId || !filePath) {
//       return res.status(400).json({ error: 'Project ID and file path are required' });
//     }

//     // Check if file already exists
//     const existingFile = await db.select().from(files)
//       .where(and(eq(files.projectId, projectId), eq(files.path, filePath)))
//       .limit(1);

//     if (existingFile.length > 0) {
//       // Update existing file
//       await db.update(files)
//         .set({
//           content: content || ''
//         })
//         .where(eq(files.id, existingFile[0].id));
//       console.log(`File updated: ${filePath}`);
//     } else {
//       // Create new file
//       await db.insert(files).values({
//     id: crypto.randomUUID(),
//     projectId,
//     path: filePath,
//     content: content || '',
//     type: 'file'
//   } as any);
//       console.log(`File created: ${filePath}`);
//     }

//     broadcast({
//       type: 'file_updated',
//       projectId,
//       filePath
//     });

//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error saving file:', error);
//     res.status(500).json({ error: 'Failed to save file' });
//   }
// });

// // Delete a file
// app.delete('/api/files/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log(`Deleting file: ${id}`);

//     await db.delete(files).where(eq(files.id, id));

//     console.log(`File deleted successfully: ${id}`);
//     res.json({ success: true });
//   } catch (error) {
//     console.error('Error deleting file:', error);
//     res.status(500).json({ error: 'Failed to delete file' });
//   }
// });

// // AI Chat endpoint
// app.post('/api/ai/chat', async (req, res) => {
//   try {
//     const { messages, projectId } = req.body;
//     console.log(`AI chat request for project: ${projectId}`);

//     // Mock AI response for now
//     res.json({
//       response: "I'm a mock AI assistant. This feature will be implemented with actual AI integration.",
//       timestamp: new Date().toISOString()
//     });
//   } catch (error) {
//     console.error('Error processing AI chat:', error);
//     res.status(500).json({ error: 'AI chat service unavailable' });
//   }
// });

// // Sync endpoint for bolt.diy to push files
// app.post('/api/sync/files', async (req, res) => {
//   try {
//     const { projectId, files: filesList, projectName, framework, template } = req.body;

//     console.log(`Manual sync request - Project: ${projectId}, Files: ${filesList?.length || 0}`);

//     if (!projectId) {
//       return res.status(400).json({ error: 'Project ID is required' });
//     }

//     // Handle bulk sync
//     await handleBulkFileSync({
//       projectId,
//       files: filesList || [],
//       projectName,
//       framework,
//       template
//     });

//     res.json({ 
//       success: true, 
//       message: `Synced ${filesList?.length || 0} files for project ${projectId}` 
//     });
//   } catch (error) {
//     console.error('Error in manual sync:', error);
//     res.status(500).json({ error: 'Sync failed' });
//   }
// });

// // Get project by ID
// app.get('/api/projects/:id', async (req, res) => {
//   try {
//     const { id } = req.params;
//     console.log(`Fetching project: ${id}`);

//     const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

//     if (project.length === 0) {
//       return res.status(404).json({ error: 'Project not found' });
//     }

//     // Also get files for this project
//     const projectFiles = await db.select().from(files)
//       .where(eq(files.projectId, id))
//       .orderBy(files.path);

//     res.json({
//       ...project[0],
//       files: projectFiles
//     });
//   } catch (error) {
//     console.error('Error fetching project:', error);
//     res.status(500).json({ error: 'Failed to fetch project' });
//   }
// });

// // Health check endpoint
// app.get('/api/health', (req, res) => {
//   res.json({ 
//     status: 'healthy', 
//     timestamp: new Date().toISOString(),
//     connections: wsConnections.size 
//   });
// });

// // ============= DYAD UI ROUTE =============
// app.get('/dyad', (req, res) => {
//   const htmlContent = `<!DOCTYPE html>
// <html lang="en">
// <head>
//     <meta charset="UTF-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
//     <title>Dyad AI Dashboard</title>
//     <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
//     <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
//     <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
//     <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.0/axios.min.js"></script>
//     <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
//     <style>
//         * { margin: 0; padding: 0; box-sizing: border-box; }
//         body { 
//             font-family: 'Segoe UI', system-ui, sans-serif; 
//             background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
//             min-height: 100vh;
//             color: #333;
//         }
//         .dashboard { 
//             display: flex; 
//             height: 100vh; 
//             overflow: hidden;
//         }
//         .header { 
//             background: rgba(255,255,255,0.95); 
//             backdrop-filter: blur(10px);
//             padding: 1rem 2rem; 
//             border-bottom: 1px solid rgba(255,255,255,0.2);
//             display: flex; 
//             align-items: center; 
//             justify-content: space-between;
//             box-shadow: 0 2px 20px rgba(0,0,0,0.1);
//         }
//         .logo { 
//             font-size: 1.5rem; 
//             font-weight: bold; 
//             color: #667eea;
//             display: flex;
//             align-items: center;
//             gap: 0.5rem;
//         }
//         .content { 
//             flex: 1; 
//             padding: 2rem; 
//             overflow-y: auto;
//             background: rgba(255,255,255,0.1);
//         }
//         .project-grid { 
//             display: grid; 
//             grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
//             gap: 1.5rem;
//         }
//         .project-card { 
//             background: rgba(255,255,255,0.95); 
//             backdrop-filter: blur(10px);
//             border-radius: 12px; 
//             padding: 1.5rem; 
//             box-shadow: 0 8px 32px rgba(0,0,0,0.1);
//             border: 1px solid rgba(255,255,255,0.2);
//             transition: all 0.3s ease;
//             cursor: pointer;
//         }
//         .project-card:hover { 
//             transform: translateY(-5px); 
//             box-shadow: 0 12px 40px rgba(0,0,0,0.15);
//         }
//         .btn { 
//             padding: 0.75rem 1.5rem; 
//             border: none; 
//             border-radius: 8px; 
//             cursor: pointer; 
//             font-weight: 500; 
//             transition: all 0.3s ease;
//             display: inline-flex;
//             align-items: center;
//             gap: 0.5rem;
//         }
//         .btn-primary { 
//             background: linear-gradient(135deg, #667eea, #764ba2); 
//             color: white; 
//         }
//         .btn-primary:hover { 
//             transform: translateY(-2px); 
//             box-shadow: 0 8px 25px rgba(102,126,234,0.3);
//         }
//         .btn-secondary { 
//             background: rgba(255,255,255,0.2); 
//             color: #333; 
//             border: 1px solid rgba(255,255,255,0.3);
//         }
//         .btn-danger { 
//             background: linear-gradient(135deg, #ff6b6b, #ee5a52); 
//             color: white; 
//         }
//         .input { 
//             width: 100%; 
//             padding: 0.75rem; 
//             border: 1px solid rgba(255,255,255,0.3); 
//             border-radius: 8px; 
//             background: rgba(255,255,255,0.9);
//             margin-bottom: 1rem;
//         }
//         .modal { 
//             position: fixed; 
//             top: 0; 
//             left: 0; 
//             width: 100%; 
//             height: 100%; 
//             background: rgba(0,0,0,0.5); 
//             backdrop-filter: blur(5px);
//             display: flex; 
//             align-items: center; 
//             justify-content: center; 
//             z-index: 1000;
//         }
//         .modal-content { 
//             background: rgba(255,255,255,0.95); 
//             backdrop-filter: blur(10px);
//             border-radius: 12px; 
//             padding: 2rem; 
//             max-width: 500px; 
//             width: 90%;
//             box-shadow: 0 20px 60px rgba(0,0,0,0.3);
//         }
//         .file-tree { 
//             background: rgba(255,255,255,0.9); 
//             border-radius: 8px; 
//             padding: 1rem; 
//             margin-bottom: 1rem;
//             max-height: 200px;
//             overflow-y: auto;
//         }
//         .file-item { 
//             padding: 0.5rem; 
//             cursor: pointer; 
//             border-radius: 4px; 
//             transition: background 0.2s;
//         }
//         .file-item:hover { 
//             background: rgba(102,126,234,0.1); 
//         }
//         .loading { 
//             display: inline-block; 
//             width: 20px; 
//             height: 20px; 
//             border: 3px solid rgba(255,255,255,0.3); 
//             border-radius: 50%; 
//             border-top-color: #667eea; 
//             animation: spin 1s ease-in-out infinite;
//         }
//         @keyframes spin { 
//             to { transform: rotate(360deg); } 
//         }
//         .sync-status {
//             position: fixed;
//             top: 20px;
//             right: 20px;
//             background: rgba(255,255,255,0.95);
//             padding: 1rem;
//             border-radius: 8px;
//             box-shadow: 0 4px 12px rgba(0,0,0,0.15);
//             z-index: 1001;
//         }
//     </style>
// </head>
// <body>
//     <div id="root"></div>

//     <script type="text/babel">
//         const { useState, useEffect, useRef } = React;

//         function DyadDashboard() {
//             const [projects, setProjects] = useState([]);
//             const [loading, setLoading] = useState(false);
//             const [wsConnected, setWsConnected] = useState(false);
//             const [syncStatus, setSyncStatus] = useState(null);
//             const wsRef = useRef(null);

//             useEffect(() => {
//                 const connectWebSocket = () => {
//                     try {
//                         const ws = new WebSocket('ws://localhost:9999');
//                         wsRef.current = ws;

//                         ws.onopen = () => {
//                             setWsConnected(true);
//                             setSyncStatus({ type: 'success', message: 'Connected to Dyad server' });
//                             setTimeout(() => setSyncStatus(null), 3000);
//                         };

//                         ws.onclose = () => {
//                             setWsConnected(false);
//                             setSyncStatus({ type: 'error', message: 'Connection lost. Reconnecting...' });
//                             setTimeout(connectWebSocket, 3000);
//                         };

//                         ws.onmessage = (event) => {
//                             try {
//                                 const data = JSON.parse(event.data);
//                                 console.log('WebSocket message:', data);

//                                 switch (data.type) {
//                                     case 'project_synced':
//                                         setSyncStatus({ 
//                                             type: 'success', 
//                                             message: 'Project synced: ' + data.name
//                                         });
//                                         loadProjects();
//                                         break;
//                                     case 'bulk_sync_completed':
//                                         setSyncStatus({ 
//                                             type: 'success', 
//                                             message: data.filesCount + ' files synced!' 
//                                         });
//                                         loadProjects();
//                                         break;
//                                 }

//                                 setTimeout(() => setSyncStatus(null), 5000);
//                             } catch (error) {
//                                 console.error('Error parsing WebSocket message:', error);
//                             }
//                         };

//                         ws.onerror = (error) => {
//                             console.error('WebSocket error:', error);
//                             setSyncStatus({ type: 'error', message: 'Connection error' });
//                         };
//                     } catch (error) {
//                         console.error('Error creating WebSocket connection:', error);
//                         setTimeout(connectWebSocket, 3000);
//                     }
//                 };

//                 connectWebSocket();

//                 return () => {
//                     if (wsRef.current) {
//                         wsRef.current.close();
//                     }
//                 };
//             }, []);

//             const loadProjects = async () => {
//                 try {
//                     setLoading(true);
//                     const response = await axios.get('http://localhost:9999/api/projects');
//                     setProjects(response.data);
//                 } catch (error) {
//                     console.error('Error loading projects:', error);
//                     setSyncStatus({ type: 'error', message: 'Failed to load projects' });
//                 } finally {
//                     setLoading(false);
//                 }
//             };

//             useEffect(() => {
//                 loadProjects();
//                 const interval = setInterval(loadProjects, 10000);
//                 return () => clearInterval(interval);
//             }, []);

//             if (loading) {
//                 return React.createElement('div', { 
//                     style: { 
//                         display: 'flex', 
//                         justifyContent: 'center', 
//                         alignItems: 'center', 
//                         height: '100vh',
//                         background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
//                     } 
//                 }, [
//                     React.createElement('div', { className: 'loading', key: 'loading' }),
//                     React.createElement('p', { 
//                         style: { color: 'white', marginLeft: '1rem' }, 
//                         key: 'text' 
//                     }, 'Loading projects...')
//                 ]);
//             }

//             return React.createElement('div', { className: 'dashboard' }, [
//                 syncStatus && React.createElement('div', { 
//                     className: 'sync-status ' + syncStatus.type, 
//                     key: 'sync-status' 
//                 }, [
//                     React.createElement('i', { 
//                         className: 'fas ' + (syncStatus.type === 'success' ? 'fa-check-circle' : 
//                                            syncStatus.type === 'error' ? 'fa-exclamation-circle' : 'fa-info-circle'),
//                         key: 'icon'
//                     }),
//                     ' ' + syncStatus.message
//                 ]),

//                 React.createElement('div', { style: { width: '100%' }, key: 'main' }, [
//                     React.createElement('div', { className: 'header', key: 'header' }, [
//                         React.createElement('h1', { className: 'logo', key: 'logo' }, [
//                             React.createElement('i', { className: 'fas fa-cube', key: 'icon' }),
//                             ' Dyad Dashboard'
//                         ]),
//                         React.createElement('div', { 
//                             style: { display: 'flex', gap: '1rem', alignItems: 'center' },
//                             key: 'status'
//                         }, [
//                             React.createElement('div', { 
//                                 style: { fontSize: '0.9rem', color: wsConnected ? '#4CAF50' : '#f44336' },
//                                 key: 'ws-status'
//                             }, [
//                                 React.createElement('i', { 
//                                     className: 'fas ' + (wsConnected ? 'fa-wifi' : 'fa-wifi-slash'),
//                                     key: 'ws-icon'
//                                 }),
//                                 wsConnected ? ' Live Sync Active' : ' Offline'
//                             ])
//                         ])
//                     ]),

//                     React.createElement('div', { className: 'content', key: 'content' }, [
//                         projects.length === 0 ? 
//                         React.createElement('div', { 
//                             style: { textAlign: 'center', padding: '2rem', color: 'white' },
//                             key: 'empty-state'
//                         }, [
//                             React.createElement('i', { 
//                                 className: 'fas fa-folder-plus', 
//                                 style: { fontSize: '3rem', marginBottom: '1rem' },
//                                 key: 'icon'
//                             }),
//                             React.createElement('h3', { key: 'title' }, 'No Projects Yet'),
//                             React.createElement('p', { key: 'desc1' }, 'Create a project in bolt.diy to get started.'),
//                             React.createElement('p', { 
//                                 style: { marginTop: '1rem', fontSize: '0.9rem', opacity: 0.8 },
//                                 key: 'desc2'
//                             }, 'Projects created in bolt.diy will automatically sync here when you save files.')
//                         ]) :
//                         React.createElement('div', { key: 'projects-container' }, [
//                             React.createElement('h2', { 
//                                 style: { color: 'white', marginBottom: '1.5rem' },
//                                 key: 'title'
//                             }, 'Your Projects (' + projects.length + ')'),
//                             React.createElement('div', { className: 'project-grid', key: 'grid' },
//                                 projects.map(project => 
//                                     React.createElement('div', { 
//                                         key: project.id, 
//                                         className: 'project-card',
//                                         onClick: () => window.open('/api/projects/' + project.id, '_blank')
//                                     }, [
//                                         React.createElement('h3', { key: 'name' }, project.name),
//                                         React.createElement('p', { 
//                                             style: { color: '#666', margin: '0.5rem 0' },
//                                             key: 'desc'
//                                         }, project.description || 'No description'),
//                                         React.createElement('div', { 
//                                             style: { 
//                                                 display: 'flex', 
//                                                 justifyContent: 'space-between', 
//                                                 alignItems: 'center', 
//                                                 marginTop: '1rem',
//                                                 fontSize: '0.8rem',
//                                                 color: '#888'
//                                             },
//                                             key: 'meta'
//                                         }, [
//                                             React.createElement('div', { key: 'tags' }, [
//                                                 React.createElement('span', { 
//                                                     style: { 
//                                                         background: '#667eea', 
//                                                         color: 'white', 
//                                                         padding: '0.25rem 0.5rem', 
//                                                         borderRadius: '4px', 
//                                                         fontSize: '0.8rem',
//                                                         marginRight: '0.5rem'
//                                                     },
//                                                     key: 'framework'
//                                                 }, project.framework || 'unknown'),
//                                                 project.template && React.createElement('span', { 
//                                                     style: { 
//                                                         background: '#6c757d', 
//                                                         color: 'white', 
//                                                         padding: '0.25rem 0.5rem', 
//                                                         borderRadius: '4px', 
//                                                         fontSize: '0.8rem'
//                                                     },
//                                                     key: 'template'
//                                                 }, project.template)
//                                             ])
//                                         ]),
//                                         React.createElement('div', { 
//                                             style: { 
//                                                 fontSize: '0.7rem', 
//                                                 color: '#999', 
//                                                 marginTop: '0.5rem',
//                                                 textAlign: 'right'
//                                             },
//                                             key: 'created'
//                                         }, 'Created: ' + new Date(project.createdAt * 1000).toLocaleDateString())
//                                     ])
//                                 )
//                             )
//                         ])
//                     ])
//                 ])
//             ]);
//         }

//         ReactDOM.render(React.createElement(DyadDashboard), document.getElementById('root'));
//     </script>
// </body>
// </html>`;

//   res.send(htmlContent);
// });

// // Initialize database and start server
// async function startServer() {
//   try {
//     console.log('Dyad Backend Server Starting!');
//     console.log('HTTP API: http://localhost:' + PORT);
//     console.log('WebSocket: ws://localhost:' + PORT);
//     console.log('Dyad UI: http://localhost:' + PORT + '/dyad');
//     console.log('Initializing database...');

//     await initializeDatabase();

//     console.log('Database initialized successfully!');
//     console.log('Ready to accept connections from bolt.diy');
//     console.log('CORS enabled for: http://localhost:5173, http://localhost:3000');

//     server.listen(PORT, () => {
//       console.log(`Server running on port ${PORT}`);
//     });
//   } catch (error) {
//     console.error('Failed to start server:', error);
//     process.exit(1);
//   }
// }

// startServer();









// // import express from 'express';
// // import cors from 'cors';
// // import { WebSocketServer } from 'ws';
// // import { createServer } from 'http';
// // import { db, initializeDatabase } from '../db';
// // import { projects, files } from '../db/schema';
// // import { eq, and } from 'drizzle-orm';
// // import path from "path";
// // import crypto from 'crypto';
// // import axios from 'axios';

// // const app = express();
// // const server = createServer(app);
// // const PORT = 9999;

// // // Ollama configuration
// // const OLLAMA_BASE_URL = 'http://localhost:11434';
// // const DEFAULT_MODEL = 'llama3.1';

// // // Bolt.diy configuration
// // const BOLT_BASE_URL = 'http://localhost:5173';
// // const BOLT_WEBHOOK_SECRET = 'dyad-bolt-webhook-secret';

// // app.use(cors({
// //   origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:5174'], // bolt.diy servers
// //   credentials: true,
// //   methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
// //   allowedHeaders: ['Content-Type', 'Authorization', 'X-Webhook-Secret']
// // }));

// // app.use(express.json({ limit: '50mb' }));
// // app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// // // Initialize WebSocket server
// // const wss = new WebSocketServer({ server });

// // // Store active connections with metadata
// // const activeConnections = new Map();

// // wss.on('connection', (ws, req) => {
// //   const clientId = crypto.randomUUID();
// //   console.log('🔌 New WebSocket connection from:', req.socket.remoteAddress, `(${clientId})`);

// //   activeConnections.set(clientId, {
// //     ws,
// //     projectId: null,
// //     lastActivity: new Date(),
// //     source: 'unknown'
// //   });

// //   ws.on('message', async (message) => {
// //     try {
// //       const data = JSON.parse(message.toString());
// //       console.log('📨 WebSocket message:', data.type, 'from', clientId);

// //       const connection = activeConnections.get(clientId);
// //       if (connection) {
// //         connection.lastActivity = new Date();
// //         connection.projectId = data.projectId || connection.projectId;
// //         connection.source = data.source || connection.source;
// //       }

// //       // Handle different message types
// //       switch (data.type) {
// //         case 'subscribe_project':
// //           if (connection) {
// //             connection.projectId = data.projectId;
// //           }
// //           break;

// //         case 'file_change':
// //           await handleFileChange(data);
// //           broadcastToProject(data.projectId, data, ws);
// //           break;

// //         case 'bolt_project_sync':
// //           await handleBoltProjectSync(data);
// //           break;

// //         case 'ai_request':
// //           await handleAIRequest(data, ws);
// //           break;

// //         case 'ping':
// //           ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
// //           break;
// //       }
// //     } catch (error) {
// //       console.error('❌ Error processing WebSocket message:', error);
// //       ws.send(JSON.stringify({ 
// //         type: 'error', 
// //         message: error.message,
// //         timestamp: new Date().toISOString()
// //       }));
// //     }
// //   });

// //   ws.on('close', () => {
// //     console.log('🔌 WebSocket connection closed:', clientId);
// //     activeConnections.delete(clientId);
// //   });

// //   ws.on('error', (error) => {
// //     console.error('🔌 WebSocket error:', error);
// //     activeConnections.delete(clientId);
// //   });
// // });

// // // ============= HELPER FUNCTIONS =============

// // function getFileType(filePath: string): string {
// //   const ext = path.extname(filePath).toLowerCase();
// //   const typeMap: { [key: string]: string } = {
// //     '.js': 'javascript',
// //     '.jsx': 'react',
// //     '.ts': 'typescript',
// //     '.tsx': 'react-typescript',
// //     '.css': 'css',
// //     '.scss': 'scss',
// //     '.sass': 'sass',
// //     '.less': 'less',
// //     '.html': 'html',
// //     '.htm': 'html',
// //     '.xml': 'xml',
// //     '.json': 'json',
// //     '.md': 'markdown',
// //     '.txt': 'text',
// //     '.py': 'python',
// //     '.php': 'php',
// //     '.java': 'java',
// //     '.cpp': 'cpp',
// //     '.c': 'c',
// //     '.cs': 'csharp',
// //     '.go': 'go',
// //     '.rs': 'rust',
// //     '.rb': 'ruby',
// //     '.vue': 'vue',
// //     '.svelte': 'svelte',
// //     '.yaml': 'yaml',
// //     '.yml': 'yaml',
// //     '.toml': 'toml',
// //     '.ini': 'ini',
// //     '.conf': 'config',
// //     '.env': 'env',
// //     '.gitignore': 'gitignore',
// //     '.dockerfile': 'dockerfile',
// //     '.sql': 'sql',
// //     '.sh': 'shell',
// //     '.bash': 'shell',
// //     '.zsh': 'shell',
// //     '.fish': 'shell',
// //     '.ps1': 'powershell',
// //     '.bat': 'batch',
// //     '.cmd': 'batch'
// //   };

// //   return typeMap[ext] || 'text';
// // }

// // function getInitialFiles(framework: string, projectName: string): Array<{path: string, content: string}> {
// //   const files: Array<{path: string, content: string}> = [];

// //   switch (framework) {
// //     case 'react':
// //       files.push(
// //         {
// //           path: 'package.json',
// //           content: JSON.stringify({
// //             "name": projectName.toLowerCase().replace(/\s+/g, '-'),
// //             "private": true,
// //             "version": "0.0.0",
// //             "type": "module",
// //             "scripts": {
// //               "dev": "vite",
// //               "build": "tsc && vite build",
// //               "lint": "eslint . --ext ts,tsx --report-unused-disable-directives --max-warnings 0",
// //               "preview": "vite preview"
// //             },
// //             "dependencies": {
// //               "react": "^18.2.0",
// //               "react-dom": "^18.2.0"
// //             },
// //             "devDependencies": {
// //               "@types/react": "^18.2.66",
// //               "@types/react-dom": "^18.2.22",
// //               "@typescript-eslint/eslint-plugin": "^7.2.0",
// //               "@typescript-eslint/parser": "^7.2.0",
// //               "@vitejs/plugin-react": "^4.2.1",
// //               "eslint": "^8.57.0",
// //               "eslint-plugin-react-hooks": "^4.6.0",
// //               "eslint-plugin-react-refresh": "^0.4.6",
// //               "typescript": "^5.2.2",
// //               "vite": "^5.2.0"
// //             }
// //           }, null, 2)
// //         },
// //         {
// //           path: 'index.html',
// //           content: `<!doctype html>
// // <html lang="en">
// //   <head>
// //     <meta charset="UTF-8" />
// //     <link rel="icon" type="image/svg+xml" href="/vite.svg" />
// //     <meta name="viewport" content="width=device-width, initial-scale=1.0" />
// //     <title>${projectName}</title>
// //   </head>
// //   <body>
// //     <div id="root"></div>
// //     <script type="module" src="/src/main.tsx"></script>
// //   </body>
// // </html>`
// //         },
// //         {
// //           path: 'src/main.tsx',
// //           content: `import React from 'react'
// // import ReactDOM from 'react-dom/client'
// // import App from './App.tsx'
// // import './index.css'

// // ReactDOM.createRoot(document.getElementById('root')!).render(
// //   <React.StrictMode>
// //     <App />
// //   </React.StrictMode>,
// // )`
// //         },
// //         {
// //           path: 'src/App.tsx',
// //           content: `import { useState } from 'react'
// // import './App.css'

// // function App() {
// //   const [count, setCount] = useState(0)

// //   return (
// //     <>
// //       <div className="app">
// //         <h1>${projectName}</h1>
// //         <div className="card">
// //           <button onClick={() => setCount((count) => count + 1)}>
// //             count is {count}
// //           </button>
// //           <p>
// //             Edit <code>src/App.tsx</code> and save to test HMR
// //           </p>
// //         </div>
// //         <p className="read-the-docs">
// //           Click on the Vite and React logos to learn more
// //         </p>
// //       </div>
// //     </>
// //   )
// // }

// // export default App`
// //         },
// //         {
// //           path: 'src/App.css',
// //           content: `#root {
// //   max-width: 1280px;
// //   margin: 0 auto;
// //   padding: 2rem;
// //   text-align: center;
// // }

// // .app {
// //   height: 100vh;
// //   display: flex;
// //   flex-direction: column;
// //   align-items: center;
// //   justify-content: center;
// // }

// // .card {
// //   padding: 2em;
// // }

// // .read-the-docs {
// //   color: #888;
// // }`
// //         },
// //         {
// //           path: 'src/index.css',
// //           content: `:root {
// //   font-family: Inter, system-ui, Avenir, Helvetica, Arial, sans-serif;
// //   line-height: 1.5;
// //   font-weight: 400;

// //   color-scheme: light dark;
// //   color: rgba(255, 255, 255, 0.87);
// //   background-color: #242424;

// //   font-synthesis: none;
// //   text-rendering: optimizeLegibility;
// //   -webkit-font-smoothing: antialiased;
// //   -moz-osx-font-smoothing: grayscale;
// //   -webkit-text-size-adjust: 100%;
// // }

// // body {
// //   margin: 0;
// //   display: flex;
// //   place-items: center;
// //   min-width: 320px;
// //   min-height: 100vh;
// // }

// // h1 {
// //   font-size: 3.2em;
// //   line-height: 1.1;
// // }

// // button {
// //   border-radius: 8px;
// //   border: 1px solid transparent;
// //   padding: 0.6em 1.2em;
// //   font-size: 1em;
// //   font-weight: 500;
// //   font-family: inherit;
// //   background-color: #1a1a1a;
// //   color: white;
// //   cursor: pointer;
// //   transition: border-color 0.25s;
// // }
// // button:hover {
// //   border-color: #646cff;
// // }
// // button:focus,
// // button:focus-visible {
// //   outline: 4px auto -webkit-focus-ring-color;
// // }

// // @media (prefers-color-scheme: light) {
// //   :root {
// //     color: #213547;
// //     background-color: #ffffff;
// //   }
// //   button {
// //     background-color: #f9f9f9;
// //     color: #213547;
// //   }
// // }`
// //         }
// //       );
// //       break;

// //     case 'vue':
// //       files.push(
// //         {
// //           path: 'package.json',
// //           content: JSON.stringify({
// //             "name": projectName.toLowerCase().replace(/\s+/g, '-'),
// //             "private": true,
// //             "version": "0.0.0",
// //             "type": "module",
// //             "scripts": {
// //               "dev": "vite",
// //               "build": "vue-tsc && vite build",
// //               "preview": "vite preview"
// //             },
// //             "dependencies": {
// //               "vue": "^3.3.11"
// //             },
// //             "devDependencies": {
// //               "@vitejs/plugin-vue": "^4.5.2",
// //               "typescript": "^5.2.2",
// //               "vite": "^5.0.8",
// //               "vue-tsc": "^1.8.25"
// //             }
// //           }, null, 2)
// //         },
// //         {
// //           path: 'src/App.vue',
// //           content: `<template>
// //   <div id="app">
// //     <h1>{{ title }}</h1>
// //     <button @click="increment">Count: {{ count }}</button>
// //   </div>
// // </template>

// // <script setup lang="ts">
// // import { ref } from 'vue'

// // const title = ref('${projectName}')
// // const count = ref(0)

// // const increment = () => {
// //   count.value++
// // }
// // </script>

// // <style scoped>
// // #app {
// //   font-family: Avenir, Helvetica, Arial, sans-serif;
// //   text-align: center;
// //   color: #2c3e50;
// //   margin-top: 60px;
// // }

// // button {
// //   background-color: #4caf50;
// //   border: none;
// //   color: white;
// //   padding: 15px 32px;
// //   text-align: center;
// //   text-decoration: none;
// //   display: inline-block;
// //   font-size: 16px;
// //   margin: 4px 2px;
// //   cursor: pointer;
// //   border-radius: 4px;
// // }
// // </style>`
// //         }
// //       );
// //       break;

// //     default:
// //       files.push(
// //         {
// //           path: 'index.html',
// //           content: `<!DOCTYPE html>
// // <html lang="en">
// // <head>
// //     <meta charset="UTF-8">
// //     <meta name="viewport" content="width=device-width, initial-scale=1.0">
// //     <title>${projectName}</title>
// //     <link rel="stylesheet" href="style.css">
// // </head>
// // <body>
// //     <div class="container">
// //         <h1>${projectName}</h1>
// //         <p>Welcome to your new project!</p>
// //         <button id="btn">Click me!</button>
// //     </div>
// //     <script src="script.js"></script>
// // </body>
// // </html>`
// //         },
// //         {
// //           path: 'style.css',
// //           content: `body {
// //     font-family: Arial, sans-serif;
// //     margin: 0;
// //     padding: 0;
// //     background-color: #f0f0f0;
// // }

// // .container {
// //     max-width: 800px;
// //     margin: 0 auto;
// //     padding: 20px;
// //     text-align: center;
// // }

// // h1 {
// //     color: #333;
// // }

// // button {
// //     background-color: #007bff;
// //     color: white;
// //     border: none;
// //     padding: 10px 20px;
// //     font-size: 16px;
// //     border-radius: 4px;
// //     cursor: pointer;
// // }

// // button:hover {
// //     background-color: #0056b3;
// // }`
// //         },
// //         {
// //           path: 'script.js',
// //           content: `document.addEventListener('DOMContentLoaded', function() {
// //     const button = document.getElementById('btn');
// //     let clickCount = 0;

// //     button.addEventListener('click', function() {
// //         clickCount++;
// //         button.textContent = \`Clicked \${clickCount} times!\`;
// //     });
// // });`
// //         }
// //       );
// //   }

// //   return files;
// // }

// // // Fixed cleanup function to work with TypeScript
// // function cleanupInactiveConnections() {
// //   const now = new Date();
// //   const clientsToRemove: string[] = [];

// //   activeConnections.forEach((connection, clientId) => {
// //     const timeDiff = now.getTime() - connection.lastActivity.getTime();
// //     if (timeDiff > 300000) { // 5 minutes
// //       console.log('🧹 Cleaning up inactive connection:', clientId);
// //       connection.ws.terminate();
// //       clientsToRemove.push(clientId);
// //     }
// //   });

// //   clientsToRemove.forEach(clientId => {
// //     activeConnections.delete(clientId);
// //   });
// // }

// // // Fixed broadcastToProject function
// // function broadcastToProject(projectId: string, message: any, sender?: any) {
// //   let count = 0;
// //   const clientsToRemove: string[] = [];

// //   activeConnections.forEach((connection, clientId) => {
// //     if (connection.ws !== sender && 
// //         connection.ws.readyState === 1 && 
// //         connection.projectId === projectId) {
// //       try {
// //         connection.ws.send(JSON.stringify(message));
// //         count++;
// //       } catch (error) {
// //         console.error('❌ Error broadcasting to client:', clientId, error.message);
// //         clientsToRemove.push(clientId);
// //       }
// //     }
// //   });

// //   clientsToRemove.forEach(clientId => {
// //     activeConnections.delete(clientId);
// //   });

// //   if (count > 0) {
// //     console.log(`📡 Broadcasted message to ${count} clients for project:`, projectId);
// //   }
// // }

// // function broadcastToAll(message: any) {
// //   let count = 0;
// //   const clientsToRemove: string[] = [];

// //   activeConnections.forEach((connection, clientId) => {
// //     if (connection.ws.readyState === 1) {
// //       try {
// //         connection.ws.send(JSON.stringify(message));
// //         count++;
// //       } catch (error) {
// //         console.error('❌ Error broadcasting to client:', clientId, error.message);
// //         clientsToRemove.push(clientId);
// //       }
// //     }
// //   });

// //   clientsToRemove.forEach(clientId => {
// //     activeConnections.delete(clientId);
// //   });

// //   if (count > 0) {
// //     console.log(`📡 Broadcasted message to ${count} clients`);
// //   }
// // }

// // // Fixed createProjectFromBolt to match your schema
// // async function createProjectFromBolt(boltProject: any) {
// //   try {
// //     const projectId = crypto.randomUUID();
// //     console.log('📁 Creating project from Bolt.diy:', boltProject.name);

// //     // Insert project - using only fields that exist in your schema
// //     await db.insert(projects).values({
// //       id: projectId,
// //       name: boltProject.name || 'Imported from Bolt',
// //     //   template: boltProject.framework || 'react',
// //       framework: detectFramework(boltProject.files) || 'react',
// //       devServerPort: 3000,
// //       devServerPid: 0,
// //       isRunning: false,
// //       createdAt: new Date(),
// //       updatedAt: new Date()
// //     } as any);

// //     // Insert files if they exist - remove 'type' field as it doesn't exist
// //     if (boltProject.files && Array.isArray(boltProject.files)) {
// //       for (const file of boltProject.files) {
// //         await db.insert(files).values({
// //           id: crypto.randomUUID(),
// //           projectId: projectId,
// //           path: file.path || file.name || 'untitled.js',
// //           content: file.content || '',
// //           createdAt: new Date(),
// //           updatedAt: new Date()
// //         } as any);
// //       }
// //     }

// //     console.log(`✅ Created project from Bolt: ${boltProject.name} (${projectId})`);

// //     // Notify Bolt.diy of successful creation
// //     try {
// //       await axios.post(`${BOLT_BASE_URL}/api/dyad/project-created`, {
// //         dyadProjectId: projectId,
// //         boltProjectId: boltProject.id,
// //         name: boltProject.name
// //       }, {
// //         headers: { 'X-Webhook-Secret': BOLT_WEBHOOK_SECRET },
// //         timeout: 5000
// //       });
// //     } catch (webhookError: any) {
// //       console.log('📡 Could not notify Bolt.diy (this is normal):', webhookError.message);
// //     }

// //     return projectId;
// //   } catch (error) {
// //     console.error('❌ Error creating project from Bolt:', error);
// //     throw error;
// //   }
// // }

// // async function updateFilesFromBolt(projectId: string, boltFiles: any[]) {
// //   try {
// //     console.log(`📝 Updating ${boltFiles.length} files from Bolt for project:`, projectId);

// //     for (const file of boltFiles) {
// //       // Check if file exists
// //       const existingFile = await db.query.files.findFirst({
// //         where: and(
// //           eq(files.projectId, projectId),
// //           eq(files.path, file.path)
// //         )
// //       });

// //       if (existingFile) {
// //         // Update existing file
// //         await db.update(files)
// //           .set({ 
// //             content: file.content,
// //             updatedAt: new Date()
// //           })
// //           .where(eq(files.id, existingFile.id));
// //       } else {
// //         // Create new file - remove type field
// //         await db.insert(files).values({
// //           id: crypto.randomUUID(),
// //           projectId: projectId,
// //           path: file.path,
// //           content: file.content || '',
// //           createdAt: new Date(),
// //           updatedAt: new Date()
// //         } as any);
// //       }
// //     }

// //     console.log(`✅ Updated ${boltFiles.length} files from Bolt`);
// //   } catch (error) {
// //     console.error('❌ Error updating files from Bolt:', error);
// //     throw error;
// //   }
// // }

// // async function sendProjectToBolt(projectId: string) {
// //   try {
// //     const project = await db.query.projects.findFirst({
// //       where: eq(projects.id, projectId)
// //     });

// //     if (!project) {
// //       throw new Error('Project not found');
// //     }

// //     const projectFiles = await db.query.files.findMany({
// //       where: eq(files.projectId, projectId)
// //     });

// //     // Format for Bolt.diy - use available fields
// //     const boltData = {
// //       id: crypto.randomUUID(), // Generate new ID
// //       name: project.name,
// //       description: `Project exported from Dyad`, // Default description
// //       framework: detectFramework(projectFiles), // Detect from files
// //       files: projectFiles.map(file => ({
// //         path: file.path,
// //         content: file.content,
// //         type: getFileType(file.path) // Calculate type from path
// //       })),
// //       createdAt: project.createdAt,
// //       updatedAt: new Date()
// //     };

// //     // Send to Bolt.diy
// //     await axios.post(`${BOLT_BASE_URL}/api/dyad/import-project`, boltData, {
// //       headers: { 'X-Webhook-Secret': BOLT_WEBHOOK_SECRET },
// //       timeout: 10000
// //     });

// //     console.log(`✅ Sent project to Bolt.diy: ${project.name}`);
// //   } catch (error) {
// //     console.error('❌ Error sending project to Bolt:', error);
// //     throw error;
// //   }
// // }

// // // ============= BOLT.DIY INTEGRATION FUNCTIONS =============

// // async function handleBoltProjectSync(data: any) {
// //   try {
// //     console.log('🔄 Handling Bolt project sync:', data.action);

// //     switch (data.action) {
// //       case 'project_created':
// //         await createProjectFromBolt(data.project);
// //         break;

// //       case 'files_updated':
// //         await updateFilesFromBolt(data.projectId, data.files);
// //         break;

// //       case 'project_request':
// //         await sendProjectToBolt(data.projectId);
// //         break;
// //     }

// //     // Broadcast update to all connected clients
// //     broadcastToAll({
// //       type: 'bolt_sync_complete',
// //       action: data.action,
// //       projectId: data.projectId,
// //       timestamp: new Date().toISOString()
// //     });
// //   } catch (error) {
// //     console.error('❌ Error handling Bolt sync:', error);
// //     throw error;
// //   }
// // }

// // // ============= AI INTEGRATION FUNCTIONS =============

// // async function handleAIRequest(data: any, ws: any) {
// //   try {
// //     console.log('🤖 Processing AI request for project:', data.projectId);

// //     const response = await processAIRequest({
// //       message: data.message,
// //       projectId: data.projectId,
// //       model: data.model || DEFAULT_MODEL,
// //       context: data.context || {}
// //     });

// //     ws.send(JSON.stringify({
// //       type: 'ai_response',
// //       requestId: data.requestId,
// //       response: response.response,
// //       fileChanges: response.fileChanges,
// //       model: response.model,
// //       timestamp: new Date().toISOString()
// //     }));

// //     // If AI made file changes, broadcast to other clients
// //     if (response.fileChanges && response.fileChanges.length > 0) {
// //       broadcastToProject(data.projectId, {
// //         type: 'file_update',
// //         projectId: data.projectId,
// //         fileChanges: response.fileChanges,
// //         source: 'ai',
// //         timestamp: new Date().toISOString()
// //       }, ws);
// //     }
// //   } catch (error) {
// //     console.error('❌ Error handling AI request:', error);
// //     ws.send(JSON.stringify({
// //       type: 'ai_error',
// //       requestId: data.requestId,
// //       error: error.message,
// //       timestamp: new Date().toISOString()
// //     }));
// //   }
// // }

// // async function processAIRequest(params: {
// //   message: string;
// //   projectId: string;
// //   model: string;
// //   context: any;
// // }) {
// //   const { message, projectId, model, context } = params;

// //   // Get project context
// //   const project = await db.query.projects.findFirst({
// //     where: eq(projects.id, projectId),
// //   });

// //   if (!project) {
// //     throw new Error('Project not found');
// //   }

// //   // Get all current files for context
// //   const currentFiles = await db.query.files.findMany({
// //     where: eq(files.projectId, projectId)
// //   });

// //   // Build comprehensive context for the AI
// //   const projectContext = `Project: ${project.name}
// // Framework: ${project.framework}

// // Current files in project:
// // ${currentFiles.map(f => `- ${f.path} (${f.content?.length || 0} chars)`).join('\n')}
// // `;

// //   const fileContents = currentFiles.map(f => `
// // File: ${f.path}
// // \`\`\`${getFileExtension(f.path)}
// // ${f.content || '// Empty file'}
// // \`\`\`
// // `).join('\n');

// //   // Create system prompt for code assistance
// //   const systemPrompt = `You are Dyad AI, an expert coding assistant integrated with Bolt.diy. You help developers by:

// // 1. Analyzing and fixing code errors
// // 2. Suggesting improvements and optimizations  
// // 3. Adding new features and functionality
// // 4. Explaining code concepts
// // 5. Generating code based on requirements

// // IMPORTANT: When you need to update or create files, provide the COMPLETE file content wrapped in triple backticks with the file extension, like this:

// // \`\`\`javascript
// // // Complete file content here
// // \`\`\`

// // For multiple files, use this format:
// // File: src/components/NewComponent.jsx
// // \`\`\`jsx
// // // Complete component code
// // \`\`\`

// // File: src/styles/component.css
// // \`\`\`css
// // /* Complete CSS */
// // \`\`\`

// // Context: ${projectContext}

// // Current file contents:
// // ${fileContents}

// // User request: ${message}`;

// //   try {
// //     // Call Ollama API
// //     const ollamaResponse = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
// //       model: model,
// //       prompt: systemPrompt,
// //       stream: false,
// //       options: {
// //         temperature: 0.1,
// //         top_p: 0.9,
// //         top_k: 40,
// //         num_predict: 4096 // Allow longer responses for code
// //       }
// //     }, { timeout: 60000 }); // 60 second timeout

// //     const aiResponse = ollamaResponse.data.response;
// //     console.log('✅ AI response generated using model:', model);

// //     // Parse AI response for potential file changes
// //     const fileChanges = await parseAIResponseForFileChanges(aiResponse, projectId, currentFiles);

// //     return { 
// //       response: aiResponse,
// //       fileChanges: fileChanges,
// //       model: model,
// //       timestamp: new Date().toISOString()
// //     };

// //   } catch (ollamaError: any) {
// //     console.error('❌ Ollama API error:', ollamaError.message);

// //     // Fallback response if Ollama is unavailable
// //     const fallbackResponse = `I'm having trouble connecting to the Ollama AI service. Here's what I can help you with:

// // **For the message**: "${message}"

// // **Troubleshooting Steps:**
// // 1. Check that Ollama is running: \`ollama serve\`
// // 2. Verify the model is installed: \`ollama list\`
// // 3. Test the connection: \`curl http://localhost:11434/api/version\`

// // **General Coding Help:**
// // - Check for syntax errors (missing semicolons, brackets)
// // - Verify import statements are correct
// // - Ensure all variables are properly declared
// // - Check for typos in function/variable names
// // - Consider error handling and edge cases

// // Please ensure Ollama is running on localhost:11434 with the ${model} model for full AI capabilities.`;

// //     return { 
// //       response: fallbackResponse,
// //       fileChanges: [],
// //       model: 'fallback',
// //       error: 'Ollama service unavailable: ' + ollamaError.message
// //     };
// //   }
// // }

// // // Enhanced function to parse AI responses for file changes
// // async function parseAIResponseForFileChanges(response: string, projectId: string, currentFiles: any[]): Promise<any[]> {
// //   const fileChanges: any[] = [];

// //   try {
// //     // Look for file patterns in the response
// //     const filePatterns = [
// //       // Pattern: File: path/to/file.ext
// //       /File:\s*([^\n]+)\n```([a-zA-Z]*)\n([\s\S]*?)```/g,
// //       // Pattern: ```language (with file comment)
// //       /(?:\/\/\s*File:\s*([^\n]+)\n|\/\*\s*File:\s*([^\n]+)\s*\*\/\n)?```([a-zA-Z]*)\n([\s\S]*?)```/g
// //     ];

// //     for (const pattern of filePatterns) {
// //       let match;
// //       while ((match = pattern.exec(response)) !== null) {
// //         let filePath = match[1] || match[2];
// //         let language = match[2] || match[3];
// //         let content = match[3] || match[4];

// //         if (!filePath && language && content) {
// //           // Try to infer file path from content or use a default
// //           if (language === 'jsx' || language === 'tsx') {
// //             filePath = 'src/App.' + language;
// //           } else if (language === 'css') {
// //             filePath = 'src/App.css';
// //           } else if (language === 'javascript' || language === 'js') {
// //             filePath = 'src/index.js';
// //           } else if (language === 'html') {
// //             filePath = 'index.html';
// //           } else {
// //             filePath = 'generated-file.' + (language || 'txt');
// //           }
// //         }

// //         if (filePath && content) {
// //           // Clean up the file path
// //           filePath = filePath.trim();
// //           if (filePath.startsWith('./')) {
// //             filePath = filePath.substring(2);
// //           }

// //           // Clean up content
// //           content = content.trim();

// //           fileChanges.push({
// //             path: filePath,
// //             content: content,
// //             action: 'update'
// //           });

// //           // Actually update the file in the database
// //           try {
// //             const existingFile = await db.query.files.findFirst({
// //               where: and(
// //                 eq(files.projectId, projectId),
// //                 eq(files.path, filePath)
// //               )
// //             });

// //             if (existingFile) {
// //               // Update existing file
// //               await db.update(files)
// //                 .set({ 
// //                   content: content,
// //                   updatedAt: new Date()
// //                 })
// //                 .where(eq(files.id, existingFile.id));

// //               console.log(`✅ AI updated existing file: ${filePath}`);
// //             } else {
// //               // Create new file
// //               await db.insert(files).values({
// //                 id: crypto.randomUUID(),
// //                 projectId: projectId,
// //                 path: filePath,
// //                 content: content,
// //                 createdAt: new Date(),
// //                 updatedAt: new Date()
// //               } as any);

// //               console.log(`✅ AI created new file: ${filePath}`);
// //             }
// //           } catch (dbError) {
// //             console.error('❌ Error updating file from AI response:', dbError);
// //           }
// //         }
// //       }
// //     }

// //     // Also update project timestamp
// //     if (fileChanges.length > 0) {
// //       await db.update(projects)
// //         .set({ updatedAt: new Date() })
// //         .where(eq(projects.id, projectId));
// //     }

// //     console.log(`🤖 AI processed ${fileChanges.length} file changes`);

// //   } catch (error) {
// //     console.error('❌ Error parsing AI response for file changes:', error);
// //   }

// //   return fileChanges;
// // }

// // // ============= WEBHOOK ENDPOINTS FOR BOLT.DIY =============

// // // Webhook to receive updates from Bolt.diy
// // app.post('/api/bolt/webhook', async (req, res) => {
// //   try {
// //     const webhookSecret = req.headers['x-webhook-secret'];
// //     if (webhookSecret !== BOLT_WEBHOOK_SECRET) {
// //       return res.status(401).json({ error: 'Invalid webhook secret' });
// //     }

// //     const { action, project, files: boltFiles, projectId } = req.body;
// //     console.log('🔗 Bolt webhook received:', action);

// //     let result = null;

// //     switch (action) {
// //       case 'project_created':
// //         result = await createProjectFromBolt(project);
// //         broadcastToAll({
// //           type: 'bolt_project_created',
// //           projectId: result,
// //           projectName: project.name,
// //           timestamp: new Date().toISOString()
// //         });
// //         break;

// //       case 'files_updated':
// //         if (projectId) {
// //           await updateFilesFromBolt(projectId, boltFiles);
// //           broadcastToProject(projectId, {
// //             type: 'file_update',
// //             projectId: projectId,
// //             fileChanges: boltFiles.map(f => ({ path: f.path })),
// //             source: 'bolt',
// //             timestamp: new Date().toISOString()
// //           });
// //         }
// //         break;

// //       case 'project_request':
// //         await sendProjectToBolt(projectId);
// //         break;
// //     }

// //     res.json({ success: true, result });
// //   } catch (error) {
// //     console.error('❌ Error handling Bolt webhook:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Endpoint for Bolt.diy to check connection
// // app.get('/api/bolt/status', (req, res) => {
// //   res.json({ 
// //     status: 'connected',
// //     timestamp: new Date().toISOString(),
// //     activeConnections: activeConnections.size,
// //     ollamaConnected: false // Will be updated by status check
// //   });
// // });

// // // ============= OLLAMA INTEGRATION ENDPOINTS =============

// // // Check Ollama status
// // app.get('/api/ai/status', async (req, res) => {
// //   try {
// //     const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
// //     res.json({ 
// //       connected: true, 
// //       models: response.data.models || [],
// //       baseUrl: OLLAMA_BASE_URL,
// //       defaultModel: DEFAULT_MODEL
// //     });
// //   } catch (error: any) {
// //     res.json({ 
// //       connected: false, 
// //       error: error.message,
// //       baseUrl: OLLAMA_BASE_URL,
// //       defaultModel: DEFAULT_MODEL
// //     });
// //   }
// // });

// // // Get available models
// // app.get('/api/ai/models', async (req, res) => {
// //   try {
// //     const response = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
// //     const models = response.data.models?.map((model: any) => ({
// //       name: model.name,
// //       size: model.size,
// //       modified_at: model.modified_at
// //     })) || [];
// //     res.json({ models });
// //   } catch (error: any) {
// //     console.error('Error fetching Ollama models:', error);
// //     res.status(500).json({ error: error.message, models: [] });
// //   }
// // });

// // // Enhanced AI chat endpoint with Ollama integration
// // app.post('/api/ai/chat', async (req, res) => {
// //   try {
// //     const { message, projectId, model = DEFAULT_MODEL, context = {} } = req.body;
// //     console.log('🤖 AI chat request for project:', projectId, 'using model:', model);

// //     if (!projectId) {
// //       return res.status(400).json({ error: 'Project ID is required' });
// //     }

// //     const response = await processAIRequest({
// //       message,
// //       projectId,
// //       model,
// //       context
// //     });

// //     res.json(response);
// //   } catch (error: any) {
// //     console.error('❌ Error in AI chat:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // ============= EXISTING PROJECT AND FILE ENDPOINTS =============

// // // Get all projects
// // app.get('/api/projects', async (req, res) => {
// //   try {
// //     console.log('📂 Fetching all projects...');
// //     const allProjects = await db.query.projects.findMany({
// //       orderBy: (projects, { desc }) => [desc(projects.updatedAt)]
// //     });
// //     console.log(`📊 Found ${allProjects.length} projects`);
// //     res.json(allProjects);
// //   } catch (error: any) {
// //     console.error('❌ Error fetching projects:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Create new project
// // app.post('/api/projects', async (req, res) => {
// //   try {
// //     const { name, framework = 'react' } = req.body;
// //     console.log('📁 Creating new project:', name);

// //     const projectId = crypto.randomUUID();

// //     await db.insert(projects).values({
// //       id: projectId,
// //       name,
// //       template: framework,
// //       framework,
// //       devServerPort: 3000,
// //       devServerPid: 0,
// //       isRunning: false,
// //       createdAt: new Date(),
// //       updatedAt: new Date()
// //     } as any);

// //     // Create initial files based on framework
// //     const initialFiles = getInitialFiles(framework, name);
// //     for (const file of initialFiles) {
// //       await db.insert(files).values({
// //         id: crypto.randomUUID(),
// //         projectId: projectId,
// //         path: file.path,
// //         content: file.content,
// //         createdAt: new Date(),
// //         updatedAt: new Date()
// //       } as any);
// //     }

// //     const newProject = await db.query.projects.findFirst({
// //       where: eq(projects.id, projectId)
// //     });

// //     console.log(`✅ Created project: ${name} (${projectId})`);

// //     // Broadcast to all clients
// //     broadcastToAll({
// //       type: 'project_created',
// //       project: newProject,
// //       timestamp: new Date().toISOString()
// //     });

// //     res.json(newProject);
// //   } catch (error: any) {
// //     console.error('❌ Error creating project:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Delete project
// // app.delete('/api/projects/:id', async (req, res) => {
// //   try {
// //     const projectId = req.params.id;
// //     console.log('🗑️ Deleting project:', projectId);

// //     // Delete all files first
// //     await db.delete(files).where(eq(files.projectId, projectId));

// //     // Delete project
// //     await db.delete(projects).where(eq(projects.id, projectId));

// //     console.log(`✅ Deleted project: ${projectId}`);

// //     // Broadcast deletion
// //     broadcastToAll({
// //       type: 'project_deleted',
// //       projectId: projectId,
// //       timestamp: new Date().toISOString()
// //     });

// //     res.json({ success: true });
// //   } catch (error: any) {
// //     console.error('❌ Error deleting project:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Get files for a project
// // app.get('/api/files', async (req, res) => {
// //   try {
// //     const { projectId } = req.query;

// //     if (!projectId) {
// //       return res.status(400).json({ error: 'Project ID is required' });
// //     }

// //     console.log('📁 Fetching files for project:', projectId);

// //     const projectFiles = await db.query.files.findMany({
// //       where: eq(files.projectId, projectId as string),
// //       orderBy: (files, { asc }) => [asc(files.path)]
// //     });

// //     console.log(`📊 Found ${projectFiles.length} files`);
// //     res.json(projectFiles);
// //   } catch (error: any) {
// //     console.error('❌ Error fetching files:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Get specific file content
// // app.get('/api/files/:projectId', async (req, res) => {
// //   try {
// //     const { projectId } = req.params;
// //     const { filePath } = req.query;

// //     console.log('📄 Fetching file:', filePath, 'from project:', projectId);

// //     const file = await db.query.files.findFirst({
// //       where: and(
// //         eq(files.projectId, projectId),
// //         eq(files.path, filePath as string)
// //       )
// //     });

// //     if (!file) {
// //       return res.status(404).json({ error: 'File not found' });
// //     }

// //     res.json(file);
// //   } catch (error: any) {
// //     console.error('❌ Error fetching file:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // // Save/create file
// // app.post('/api/files', async (req, res) => {
// //   try {
// //     const { projectId, path: filePath, content } = req.body;
// //     console.log('💾 Saving file:', filePath, 'to project:', projectId);

// //     // Check if file exists
// //     const existingFile = await db.query.files.findFirst({
// //       where: and(
// //         eq(files.projectId, projectId),
// //         eq(files.path, filePath)
// //       )
// //     });

// //     if (existingFile) {
// //       // Update existing file
// //       await db.update(files)
// //         .set({ 
// //           content,
// //           updatedAt: new Date()
// //         })
// //         .where(eq(files.id, existingFile.id));
// //     } else {
// //       // Create new file
// //       await db.insert(files).values({
// //         id: crypto.randomUUID(),
// //         projectId,
// //         path: filePath,
// //         content: content || '',
// //         createdAt: new Date(),
// //         updatedAt: new Date()
// //       } as any);
// //     }

// //     // Broadcast file change to WebSocket clients
// //     broadcastToProject(projectId, {
// //       type: 'file_update',
// //       projectId,
// //       filePath,
// //       source: 'dyad',
// //       timestamp: new Date().toISOString()
// //     });

// //     console.log(`✅ Saved file: ${filePath}`);
// //     res.json({ success: true });
// //   } catch (error: any) {
// //     console.error('❌ Error saving file:', error);
// //     res.status(500).json({ error: error.message });
// //   }
// // });

// // async function handleFileChange(data: any) {
// //   // Update file in database if needed
// //   if (data.filePath && data.content !== undefined) {
// //     try {
// //       await db.update(files)
// //         .set({ 
// //           content: data.content,
// //           updatedAt: new Date()
// //         })
// //         .where(and(
// //           eq(files.projectId, data.projectId),
// //           eq(files.path, data.filePath)
// //         ));
// //     } catch (error) {
// //       console.error('❌ Error updating file from change event:', error);
// //     }
// //   }
// // }

// // function detectFramework(files: any[]): string {
// //   if (!files || !Array.isArray(files)) return 'react';

// //   const fileNames = files.map(f => f.path || f.name || '').join(' ').toLowerCase();

// //   if (fileNames.includes('package.json')) {
// //     const packageFile = files.find(f => (f.path || f.name || '').includes('package.json'));
// //     if (packageFile && packageFile.content) {
// //       try {
// //         const packageJson = JSON.parse(packageFile.content);
// //         if (packageJson.dependencies) {
// //           if (packageJson.dependencies['@angular/core']) return 'angular';
// //           if (packageJson.dependencies['vue']) return 'vue';
// //           if (packageJson.dependencies['svelte']) return 'svelte';
// //           if (packageJson.dependencies['react']) return 'react';
// //         }
// //       } catch (e) {
// //         // Invalid JSON, continue with heuristics
// //       }
// //     }
// //   }

// //   if (fileNames.includes('.vue')) return 'vue';
// //   if (fileNames.includes('.svelte')) return 'svelte';
// //   if (fileNames.includes('angular.json')) return 'angular';
// //   if (fileNames.includes('.jsx') || fileNames.includes('.tsx')) return 'react';

// //   return 'react'; // Default
// // }

// // function getFileExtension(filePath: string): string {
// //   const ext = path.extname(filePath).toLowerCase();
// //   const extMap: { [key: string]: string } = {
// //     '.js': 'javascript',
// //     '.jsx': 'jsx',
// //     '.ts': 'typescript',
// //     '.tsx': 'tsx',
// //     '.css': 'css',
// //     '.scss': 'scss',
// //     '.sass': 'sass',
// //     '.html': 'html',
// //     '.json': 'json',
// //     '.md': 'markdown',
// //     '.py': 'python',
// //     '.php': 'php',
// //     '.java': 'java',
// //     '.cpp': 'cpp',
// //     '.c': 'c',
// //     '.vue': 'vue',
// //     '.svelte': 'svelte'
// //   };
// //   return extMap[ext] || 'text';
// // }

// // // Update the cleanup interval to use the fixed function
// // setInterval(cleanupInactiveConnections, 60000); // Check every minute

// // // Initialize database and start server
// // async function startServer() {
// //   try {
// //     await initializeDatabase();
// //     console.log('📊 Database initialized successfully');

// //     server.listen(PORT, () => {
// //       console.log(`🚀 Dyad server running on port ${PORT}`);
// //       console.log(`🔌 WebSocket server ready for connections`);
// //       console.log(`🤖 Ollama integration: ${OLLAMA_BASE_URL}`);
// //       console.log(`⚡ Bolt.diy integration: ${BOLT_BASE_URL}`);
// //     });
// //   } catch (error) {
// //     console.error('❌ Failed to start server:', error);
// //     process.exit(1);
// //   }
// // }

// // startServer();



import { v4 as uuidv4 } from 'uuid';
import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import { createServer } from 'http';
import { db, initializeDatabase } from '../db';
import { eq, and, desc } from 'drizzle-orm';
import crypto from 'crypto';
import { projects, files, users, userCredentials, deployments, analytics, projectStats } from '../db/schema';
import { Octokit } from '@octokit/rest';
import fetch from 'node-fetch';
import dotenv from "dotenv"
import { hashPassword, verifyPassword, generateToken, authenticateToken, optionalAuth, AuthRequest } from './auth';
import { encryptCredential, decryptCredential } from './encryption';
import { nanoid } from 'nanoid';
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

// Vercel Configuration
const VERCEL_TOKEN = process.env.VERCEL_TOKEN;
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID;

// Ollama Configuration - Local Models
const OLLAMA_API_URL = "http://localhost:11434/api/generate";
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || "llama3.2"; // Can be: qwen3:4b, llama3, llama3.2

const wsConnections = new Set<any>();

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:9999', '*', `${VITE_DYAD_BACKEND_URL}`, 'http://62.72.59.219:5173'],
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

/**
 * Ensure index.html exists for GitHub Pages
 * Creates a basic index.html if one doesn't exist at the root
 */
async function ensureIndexHtml(projectFiles: any[]): Promise<any[]> {
  // Check if index.html exists at root level
  const hasRootIndexHtml = projectFiles.some(f => {
    const cleanPath = f.path.replace(/^\/+/, '').replace(/^home\/project\//, '');
    return cleanPath === 'index.html' || cleanPath === '/index.html';
  });

  if (hasRootIndexHtml) {
    console.log('index.html found at root');
    return projectFiles;
  }

  console.log('No root index.html found, checking for entry points...');

  // Check if there's a src/main.tsx or src/main.jsx (Vite pattern)
  const hasViteEntry = projectFiles.some(f =>
    f.path.includes('src/main.tsx') ||
    f.path.includes('src/main.jsx') ||
    f.path.includes('src/main.ts') ||
    f.path.includes('src/main.js')
  );

  // Check if there's already an index.html somewhere
  const existingIndexHtml = projectFiles.find(f =>
    f.path.includes('index.html')
  );

  if (existingIndexHtml) {
    console.log(`Found index.html at ${existingIndexHtml.path}, using it`);
    // Move it to root
    return [...projectFiles.filter(f => f.path !== existingIndexHtml.path), {
      ...existingIndexHtml,
      path: 'index.html'
    }];
  }

  // Create a basic index.html
  let indexHtmlContent = '';

  if (hasViteEntry) {
    // Create Vite-compatible index.html
    indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Vite App</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
  } else {
    // Create basic HTML
    indexHtmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>App</title>
  </head>
  <body>
    <div id="app"></div>
    <h1>Welcome</h1>
    <p>This app was deployed from BackBench</p>
  </body>
</html>`;
  }

  console.log('Creating fallback index.html');

  return [...projectFiles, {
    path: 'index.html',
    content: indexHtmlContent,
    type: 'file',
    projectId: projectFiles[0]?.projectId
  }];
}

async function createGitHubRepo(
  projectName: string,
  description: string = '',
  isPrivate: boolean = true,
  githubToken: string,
  githubOwner: string
) {
  const octokit = new Octokit({ auth: githubToken });

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
      description: description || `Deployed from BackBench: ${projectName}`,
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
        owner: githubOwner,
        repo: repoName,
      });
      console.log(`Using existing repo: ${repo.html_url}`);
      return { repo, repoName };
    }
    throw error;
  }
}

async function pushFilesToGitHub(
  repoName: string,
  projectFiles: any[],
  githubToken: string,
  githubOwner: string
) {
  const octokit = new Octokit({ auth: githubToken });

  console.log(`Uploading ${projectFiles.length} files to ${repoName}...`);

  try {
    const { data: ref } = await octokit.git.getRef({
      owner: githubOwner,
      repo: repoName,
      ref: 'heads/main',
    });

    const latestCommitSha = ref.object.sha;

    const { data: latestCommit } = await octokit.git.getCommit({
      owner: githubOwner,
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

    console.log(`Filtered to ${actualFiles.length} actual files to upload`);

    const blobs = [];
    for (const file of actualFiles) {
      try {
        const content = file.content || '';

        // Clean the path more thoroughly
        let cleanPath = file.path;
        // Remove leading slashes
        if (cleanPath.startsWith('/')) cleanPath = cleanPath.substring(1);
        // Remove common prefixes
        if (cleanPath.startsWith('home/project/')) cleanPath = cleanPath.substring('home/project/'.length);
        if (cleanPath.startsWith('/home/project/')) cleanPath = cleanPath.substring('/home/project/'.length);

        console.log(`Uploading: ${file.path} -> ${cleanPath}`);

        const { data: blob } = await octokit.git.createBlob({
          owner: githubOwner,
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

    console.log(`Created ${blobs.length} blobs, creating tree...`);

    const { data: tree } = await octokit.git.createTree({
      owner: githubOwner,
      repo: repoName,
      tree: blobs,
      base_tree: latestCommit.tree.sha,
    });

    const { data: commit } = await octokit.git.createCommit({
      owner: githubOwner,
      repo: repoName,
      message: 'Deployed from BackBench',
      tree: tree.sha,
      parents: [latestCommitSha],
    });

    await octokit.git.updateRef({
      owner: githubOwner,
      repo: repoName,
      ref: 'heads/main',
      sha: commit.sha,
    });

    console.log(`Successfully uploaded ${actualFiles.length} files to ${repoName}`);
    console.log(`Files uploaded: ${blobs.map(b => b.path).join(', ')}`);
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

async function deployToGitHub(
  projectId: string,
  projectName: string,
  description: string,
  userId: string
) {
  try {
    console.log(`Starting GitHub deployment for project: ${projectName}`);

    // Get user's GitHub credentials or fall back to environment variables
    let githubToken: string | null = null;

    if (userId === 'system') {
      // Backward compatibility: use environment variable
      githubToken = GITHUB_TOKEN || null;
      console.log('Using GITHUB_TOKEN from environment variables (unauthenticated mode)');
    } else {
      // Authenticated user: get from database
      githubToken = await getUserCredential(userId, 'github_token');
    }

    if (!githubToken) {
      throw new Error('GitHub token not found. Please configure your credentials or set GITHUB_TOKEN environment variable.');
    }

    // Get GitHub owner from token (or use default)
    const githubOwner = GITHUB_OWNER;

    let projectFiles = await db.select().from(files)
      .where(eq(files.projectId, projectId));

    if (projectFiles.length === 0) {
      throw new Error('No files found in project. Cannot deploy empty project.');
    }

    console.log(`Found ${projectFiles.length} files in database`);

    // Ensure index.html exists (still good practice)
    projectFiles = await ensureIndexHtml(projectFiles);
    console.log(`After ensuring index.html: ${projectFiles.length} files`);

    const isPrivate = GITHUB_DEFAULT_VISIBILITY === 'private';

    console.log(`Creating GitHub repository...`);
    const { repo, repoName } = await createGitHubRepo(
      projectName,
      description,
      isPrivate,
      githubToken,
      githubOwner
    );

    // Add GitHub Actions workflow for Vercel deployment
    const workflowContent = `name: Deploy to Vercel

on:
  push:
    branches: [ main ]
  workflow_dispatch:

jobs:
  deploy:
    runs-on: ubuntu-latest
    name: Deploy to Vercel
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - name: Install dependencies
        run: npm ci

      - name: Build
        run: npm run build

      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v25
        with:
          vercel-token: \${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: \${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: \${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
`;

    // Add or update GitHub Actions workflow for Vercel
    const workflowPath = '.github/workflows/deploy.yml';
    const existingWorkflowIndex = projectFiles.findIndex(f => f.path === workflowPath);

    if (existingWorkflowIndex >= 0) {
      // Update existing workflow file
      projectFiles[existingWorkflowIndex].content = workflowContent;
      console.log('Updated existing workflow file');
    } else {
      // Add new workflow file
      projectFiles.push({
        id: crypto.randomUUID(),
        path: workflowPath,
        content: workflowContent,
        type: 'file',
        projectId,
        createdAt: Date.now(),
        updatedAt: Date.now()
      } as any);
      console.log('Added new workflow file');
    }

    // NOTE: Removed vite.config.ts modification as Vercel handles base path automatically.

    console.log(`Uploading files to repository...`);
    await pushFilesToGitHub(repoName, projectFiles, githubToken, githubOwner);

    // Construct predicted Vercel URL
    const pagesUrl = `https://${repoName}.vercel.app`;

    // Get existing Vercel project ID from database
    const existingProject = await db.select().from(projects)
      .where(eq(projects.id, projectId))
      .limit(1);

    const existingVercelProjectId = existingProject[0]?.vercelProjectId || undefined;

    // Automatically trigger Vercel deployment
    let vercelDeploymentUrl = pagesUrl;
    let vercelProjectId = existingVercelProjectId;

    try {
      console.log('Triggering Vercel deployment...');
      const vercelResult = await deployToVercel(
        repo.html_url,
        repoName,
        githubOwner,
        userId,
        existingVercelProjectId
      );

      if (vercelResult.url) {
        vercelDeploymentUrl = vercelResult.url;
        vercelProjectId = vercelResult.vercelProjectId;
        console.log(`✅ Vercel deployment triggered: ${vercelDeploymentUrl}`);
        console.log(`✅ Vercel project ID: ${vercelProjectId}`);
      }
    } catch (vercelError: any) {
      console.warn('Vercel deployment failed, but GitHub push was successful:', vercelError.message);
      // Continue anyway - GitHub deployment succeeded
    }

    // Update project in database with deployment URLs and Vercel project ID
    await db.update(projects)
      .set({
        repositoryUrl: repo.html_url,
        deploymentUrl: vercelDeploymentUrl,
        vercelProjectId: vercelProjectId
      } as any)
      .where(eq(projects.id, projectId));

    console.log(`✅ Updated project in database with deployment URLs`);
    console.log(`Deployment complete!`);

    return {
      success: true,
      repositoryUrl: repo.html_url,
      pagesUrl: vercelDeploymentUrl,
      vercelProjectId: vercelProjectId,
      repoName: repoName,
      filesDeployed: projectFiles.length,
      isPrivate: isPrivate,
      message: `Successfully pushed ${projectFiles.length} files to GitHub repository: ${repoName}. Vercel deployment triggered automatically! URL: ${vercelDeploymentUrl}`
    };
  } catch (error: any) {
    console.error('Deployment failed:', error.message);
    throw error;
  }
}

// Helper function to get Vercel credentials
async function getVercelCredentials(userId: string): Promise<{
  token: string;
  orgId?: string;
}> {
  if (userId === 'system') {
    // Use environment variables for unauthenticated users
    if (!VERCEL_TOKEN) {
      throw new Error('Vercel token not configured in environment variables');
    }
    return {
      token: VERCEL_TOKEN,
      orgId: undefined
    };
  }

  // Get user's Vercel credentials from database
  const token = await getUserCredential(userId, 'vercel_token');
  const orgId = await getUserCredential(userId, 'vercel_org_id');

  if (!token) {
    // Fall back to environment variables
    if (!VERCEL_TOKEN) {
      throw new Error('Vercel token not found. Please configure your credentials.');
    }
    return {
      token: VERCEL_TOKEN,
      orgId: undefined
    };
  }

  return {
    token,
    orgId: orgId || undefined
  };
}

// Enhanced Vercel Deployment Function - Creates unique Vercel project per BackBench project
async function deployToVercel(
  repoUrl: string,
  projectName: string,
  githubOwner: string,
  userId: string,
  existingVercelProjectId?: string
): Promise<{
  url: string;
  deploymentId: string;
  vercelProjectId: string;
  inspectorUrl?: string;
}> {
  try {
    const { token, orgId } = await getVercelCredentials(userId);

    // First, get the GitHub repository ID
    const githubToken = userId === 'system' ? GITHUB_TOKEN : await getUserCredential(userId, 'github_token');
    const repoResponse = await fetch(`https://api.github.com/repos/${githubOwner}/${projectName}`, {
      headers: {
        'Authorization': `token ${githubToken || ''}`,
        'Accept': 'application/vnd.github.v3+json'
      }
    });

    if (!repoResponse.ok) {
      throw new Error(`Failed to fetch GitHub repo info: ${repoResponse.status}`);
    }

    const repoData: any = await repoResponse.json();
    const repoId = repoData.id;

    console.log(`GitHub repo ID: ${repoId}`);

    let vercelProjectId = existingVercelProjectId;

    // If no existing Vercel project, create a new one
    if (!vercelProjectId) {
      console.log('Creating new Vercel project...');
      const createProjectResponse = await fetch('https://api.vercel.com/v9/projects', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: projectName,
          framework: 'vite',
          gitRepository: {
            type: 'github',
            repo: `${githubOwner}/${projectName}`
          },
          ...(orgId && { teamId: orgId })
        }),
      });

      if (!createProjectResponse.ok) {
        const errorText = await createProjectResponse.text();
        console.error(`Failed to create Vercel project: ${errorText}`);
        // If project already exists, try to get it
        if (createProjectResponse.status === 409) {
          console.log('Project already exists, fetching existing project...');
          const getProjectResponse = await fetch(`https://api.vercel.com/v9/projects/${projectName}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (getProjectResponse.ok) {
            const existingProject: any = await getProjectResponse.json();
            vercelProjectId = existingProject.id;
            console.log(`Using existing Vercel project: ${vercelProjectId}`);
          } else {
            throw new Error(`Vercel project creation failed: ${errorText}`);
          }
        } else {
          throw new Error(`Vercel project creation failed: ${errorText}`);
        }
      } else {
        const projectData: any = await createProjectResponse.json();
        vercelProjectId = projectData.id;
        console.log(`✅ Created new Vercel project: ${vercelProjectId}`);
      }
    }

    // Trigger a new deployment
    console.log('Triggering Vercel deployment...');
    const deployResponse = await fetch('https://api.vercel.com/v13/deployments', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: projectName,
        project: vercelProjectId,
        gitSource: {
          type: 'github',
          repoId: repoId,
          ref: 'main'
        },
        target: 'production',
        ...(orgId && { teamId: orgId })
      }),
    });

    if (!deployResponse.ok) {
      const errorText = await deployResponse.text();
      throw new Error(`Vercel deployment API error: ${deployResponse.status} - ${errorText}`);
    }

    const deployData: any = await deployResponse.json();
    console.log('Vercel deployment triggered:', deployData);

    return {
      url: deployData.url ? `https://${deployData.url}` : `https://${projectName}.vercel.app`,
      deploymentId: deployData.id,
      vercelProjectId: vercelProjectId!,
      inspectorUrl: deployData.inspectorUrl
    };
  } catch (error: any) {
    console.error('Vercel deployment error:', error);
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
      ws.ping(() => { });
    } catch (err) {
      try { ws.terminate(); } catch { }
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
      try { ws.terminate(); } catch { }
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
    const { projectId, files: filesList, projectName, framework, template, userId } = data;

    // Use default user if userId not provided (for unauthenticated transfers from bolt.diy)
    const effectiveUserId = userId || 'system';

    console.log(`\u2705 Bulk sync started:`);
    console.log(`   - Project ID: ${projectId}`);
    console.log(`   - Project Name: ${projectName || 'Unnamed'}`);
    console.log(`   - Files Count: ${filesList?.length || 0}`);
    console.log(`   - User ID: ${effectiveUserId}`);
    console.log(`   - Framework: ${framework || 'N/A'}`);
    console.log(`   - Template: ${template || 'N/A'}`);

    // Validate files
    const validFiles = (filesList || []).filter(f => {
      if (!f.path) {
        console.warn(`Skipping file without path:`, f);
        return false;
      }
      if (f.content === undefined || f.content === null) {
        console.warn(`Skipping file with undefined content: ${f.path}`);
        return false;
      }
      return true;
    });

    console.log(`\u2705 Validated ${validFiles.length} files out of ${filesList?.length || 0}`);

    // Check if project exists
    let project = await db.select().from(projects).where(eq(projects.id, projectId)).limit(1);

    if (project.length === 0) {
      // Create new project
      const projectData: any = {
        id: projectId,
        name: projectName || 'Untitled Project',
        userId: effectiveUserId,
        description: 'Project created from bolt.diy'
      };

      if (framework) projectData.framework = framework;
      if (template) projectData.template = template;

      await db.insert(projects).values(projectData);
      console.log(`\u2705 Created new project: ${projectId} (${projectName})`);
    } else {
      console.log(`\u2705 Project already exists: ${projectId}`);
    }

    // Sync files
    let filesCreated = 0;
    let filesUpdated = 0;

    for (const file of validFiles) {
      const { path: filePath, content } = file;

      const existingFile = await db.select().from(files)
        .where(and(eq(files.projectId, projectId), eq(files.path, filePath)))
        .limit(1);

      if (existingFile.length > 0) {
        // Update existing file
        await db.update(files)
          .set({
            content,
          } as any)
          .where(eq(files.id, existingFile[0].id));
        filesUpdated++;
      } else {
        // Create new file
        const fileData: any = {
          id: crypto.randomUUID(),
          projectId,
          userId: effectiveUserId,
          path: filePath,
          content,
          type: 'file'
        };

        await db.insert(files).values(fileData);
        filesCreated++;
      }
    }

    console.log(`\u2705 Bulk sync completed for project: ${projectId}`);
    console.log(`   - Files created: ${filesCreated}`);
    console.log(`   - Files updated: ${filesUpdated}`);
    console.log(`   - Total files: ${filesCreated + filesUpdated}`);

    broadcast({
      type: 'bulk_sync_completed',
      projectId,
      filesCount: validFiles.length,
      filesCreated,
      filesUpdated
    });
  } catch (error) {
    console.error('\u274c Error in bulk file sync:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
  }
}

// ==================== Authentication Routes ====================

app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Check if user already exists
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return res.status(409).json({ error: 'User already exists' });
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const userId = crypto.randomUUID();

    await db.insert(users).values({
      id: userId,
      email,
      passwordHash,
      name: name || null,
    } as any);

    // Generate JWT token
    const token = generateToken(userId, email);

    res.json({
      success: true,
      token,
      user: { id: userId, email, name }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const userList = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (userList.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = userList[0];

    // Verify password
    const isValid = await verifyPassword(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = generateToken(user.id, user.email);

    res.json({
      success: true,
      token,
      user: { id: user.id, email: user.email, name: user.name }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/api/auth/me', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const userList = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    if (userList.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userList[0];
    res.json({
      id: user.id,
      email: user.email,
      name: user.name
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// ==================== Credential Management Routes ====================

app.post('/api/credentials', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { type, value } = req.body;

    if (!type || !value) {
      return res.status(400).json({ error: 'Type and value are required' });
    }

    const validTypes = ['github_token', 'vercel_token', 'vercel_org_id', 'vercel_project_id'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid credential type' });
    }

    // Encrypt the credential
    const { encryptedValue, iv, authTag } = encryptCredential(value);

    // Check if credential already exists
    const existing = await db.select().from(userCredentials)
      .where(and(eq(userCredentials.userId, userId), eq(userCredentials.credentialType, type)))
      .limit(1);

    if (existing.length > 0) {
      // Update existing credential
      await db.update(userCredentials)
        .set({
          encryptedValue: `${encryptedValue}:${authTag}`,
          iv,
          updatedAt: Math.floor(Date.now() / 1000)
        } as any)
        .where(eq(userCredentials.id, existing[0].id));
    } else {
      // Create new credential
      await db.insert(userCredentials).values({
        id: crypto.randomUUID(),
        userId,
        credentialType: type,
        encryptedValue: `${encryptedValue}:${authTag}`,
        iv,
      } as any);
    }

    res.json({ success: true, message: 'Credential saved successfully' });
  } catch (error) {
    console.error('Save credential error:', error);
    res.status(500).json({ error: 'Failed to save credential' });
  }
});

app.get('/api/credentials', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;

    const creds = await db.select().from(userCredentials)
      .where(eq(userCredentials.userId, userId));

    // Return only the types, not the actual values
    const credentialTypes = creds.map(c => c.credentialType);

    res.json({ credentials: credentialTypes });
  } catch (error) {
    console.error('Get credentials error:', error);
    res.status(500).json({ error: 'Failed to get credentials' });
  }
});

app.delete('/api/credentials/:type', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { type } = req.params;

    await db.delete(userCredentials)
      .where(and(
        eq(userCredentials.userId, userId),
        eq(userCredentials.credentialType, type as any)
      ));

    res.json({ success: true, message: 'Credential deleted' });
  } catch (error) {
    console.error('Delete credential error:', error);
    res.status(500).json({ error: 'Failed to delete credential' });
  }
});

// Helper function to get user's decrypted credential
async function getUserCredential(userId: string, type: string): Promise<string | null> {
  try {
    const creds = await db.select().from(userCredentials)
      .where(and(
        eq(userCredentials.userId, userId),
        eq(userCredentials.credentialType, type as any)
      ))
      .limit(1);

    if (creds.length === 0) {
      return null;
    }

    const cred = creds[0];
    const [encryptedValue, authTag] = cred.encryptedValue.split(':');
    return decryptCredential(encryptedValue, cred.iv, authTag);
  } catch (error) {
    console.error('Error getting credential:', error);
    return null;
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

app.post('/api/projects/:id/push', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.userId;

    if (userId) {
      console.log(`Push to GitHub request for project: ${id} by user: ${userId}`);
    } else {
      console.log(`Push to GitHub request for project: ${id} (unauthenticated - using env vars)`);
    }

    const project = await db.select().from(projects).where(eq(projects.id, id)).limit(1);

    if (project.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // If authenticated, verify the project belongs to the user
    if (userId && project[0].userId && project[0].userId !== userId) {
      return res.status(403).json({ error: 'Unauthorized: Project does not belong to you' });
    }

    // Use userId if authenticated, otherwise use 'system' for backward compatibility
    const deployUserId = userId || 'system';

    const result = await deployToGitHub(
      id,
      project[0].name,
      project[0].description || '',
      deployUserId
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

app.post('/api/sync/files', optionalAuth, async (req: AuthRequest, res) => {
  try {
    const { projectId, files: filesList, projectName, framework, template } = req.body;
    const userId = req.user?.userId; // Optional - may be undefined for backward compatibility

    if (!projectId) {
      return res.status(400).json({ error: 'Project ID is required' });
    }

    await handleBulkFileSync({
      projectId,
      files: filesList || [],
      projectName,
      framework,
      template,
      userId // Pass userId to sync handler
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

// ==================== DEPLOYMENT & ANALYTICS ENDPOINTS ====================

// Create deployment
app.post('/api/deployments', async (req, res) => {
  try {
    const { projectId, platform } = req.body;

    if (!projectId || !platform) {
      return res.status(400).json({ error: 'Project ID and platform are required' });
    }

    const deploymentId = nanoid();
    const now = Math.floor(Date.now() / 1000);

    await db.insert(deployments).values({
      id: deploymentId,
      projectId,
      platform: platform as any,
      status: 'pending' as any,
      environment: 'production' as any,
      createdAt: now,
    } as any);

    broadcast({
      type: 'deployment_started',
      deploymentId,
      projectId,
      platform,
    });

    res.json({ id: deploymentId, status: 'pending' });
  } catch (error: any) {
    console.error('Error creating deployment:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get deployment status
app.get('/api/deployments/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deployment = await db.select().from(deployments)
      .where(eq(deployments.id, id))
      .limit(1);

    if (deployment.length === 0) {
      return res.status(404).json({ error: 'Deployment not found' });
    }

    res.json(deployment[0]);
  } catch (error) {
    console.error('Error fetching deployment:', error);
    res.status(500).json({ error: 'Failed to fetch deployment' });
  }
});

// Get project deployments
app.get('/api/deployments/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    const projectDeployments = await db.select().from(deployments)
      .where(eq(deployments.projectId, projectId))
      .orderBy(desc(deployments.createdAt))
      .limit(limit);

    res.json(projectDeployments);
  } catch (error) {
    console.error('Error fetching deployments:', error);
    res.status(500).json({ error: 'Failed to fetch deployments' });
  }
});

// Get recent deployments
app.get('/api/deployments/recent', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20;
    const recentDeployments = await db.select().from(deployments)
      .orderBy(desc(deployments.createdAt))
      .limit(limit);

    res.json(recentDeployments);
  } catch (error) {
    console.error('Error fetching recent deployments:', error);
    res.status(500).json({ error: 'Failed to fetch recent deployments' });
  }
});

// Get project analytics overview
app.get('/api/analytics/:projectId/overview', async (req, res) => {
  try {
    const { projectId } = req.params;

    const stats = await db.select().from(projectStats)
      .where(eq(projectStats.projectId, projectId))
      .limit(1);

    const deploymentList = await db.select().from(deployments)
      .where(eq(deployments.projectId, projectId))
      .limit(100);

    const platformCounts: Record<string, number> = {};
    deploymentList.forEach(d => {
      platformCounts[d.platform] = (platformCounts[d.platform] || 0) + 1;
    });

    const overview = {
      totalDeployments: stats[0]?.totalDeployments || 0,
      successfulDeployments: stats[0]?.successfulDeployments || 0,
      failedDeployments: stats[0]?.failedDeployments || 0,
      successRate: stats[0]?.totalDeployments
        ? ((stats[0].successfulDeployments / stats[0].totalDeployments) * 100).toFixed(1)
        : '0',
      avgBuildTime: stats[0]?.avgBuildTime || 0,
      lastDeployment: stats[0]?.lastDeploymentAt,
      platforms: Object.entries(platformCounts).map(([platform, count]) => ({
        platform,
        count,
      })),
    };

    res.json(overview);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// Get project stats
app.get('/api/stats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const stats = await db.select().from(projectStats)
      .where(eq(projectStats.projectId, projectId))
      .limit(1);

    if (stats.length === 0) {
      return res.json({
        totalDeployments: 0,
        successfulDeployments: 0,
        failedDeployments: 0,
        avgBuildTime: 0,
      });
    }

    res.json(stats[0]);
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// Fetch Vercel deployments and sync to database
app.get('/api/vercel/deployments', async (req, res) => {
  try {
    if (!VERCEL_TOKEN) {
      return res.status(400).json({ error: 'Vercel token not configured' });
    }

    // Fetch deployments from Vercel API
    const response = await fetch('https://api.vercel.com/v6/deployments', {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const vercelDeployments = data.deployments || [];

    // Sync to local database
    const syncedDeployments = [];
    for (const vDeploy of vercelDeployments.slice(0, 50)) { // Limit to 50 most recent
      const deploymentId = vDeploy.uid || nanoid();

      // Check if deployment already exists
      const existing = await db.select().from(deployments)
        .where(eq(deployments.id, deploymentId))
        .limit(1);

      if (existing.length === 0) {
        // Create new deployment record
        const now = Math.floor(Date.now() / 1000);
        const createdAt = vDeploy.created ? Math.floor(new Date(vDeploy.created).getTime() / 1000) : now;

        await db.insert(deployments).values({
          id: deploymentId,
          projectId: vDeploy.name || 'unknown',
          platform: 'vercel' as any,
          status: (vDeploy.state === 'READY' ? 'success' :
            vDeploy.state === 'ERROR' ? 'failed' :
              vDeploy.state === 'BUILDING' ? 'building' : 'pending') as any,
          environment: 'production' as any,
          deploymentUrl: vDeploy.url ? `https://${vDeploy.url}` : null,
          buildTime: vDeploy.buildingAt && vDeploy.ready ?
            Math.floor((new Date(vDeploy.ready).getTime() - new Date(vDeploy.buildingAt).getTime()) / 1000) : null,
          createdAt,
          completedAt: vDeploy.ready ? Math.floor(new Date(vDeploy.ready).getTime() / 1000) : null,
          metadata: JSON.stringify({
            vercelId: vDeploy.uid,
            name: vDeploy.name,
            target: vDeploy.target,
          }),
        } as any);
      }

      syncedDeployments.push({
        id: deploymentId,
        name: vDeploy.name,
        url: vDeploy.url ? `https://${vDeploy.url}` : null,
        state: vDeploy.state,
        created: vDeploy.created,
        ready: vDeploy.ready,
      });
    }

    res.json({
      total: vercelDeployments.length,
      synced: syncedDeployments.length,
      deployments: syncedDeployments,
    });
  } catch (error: any) {
    console.error('Error fetching Vercel deployments:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch Vercel deployments' });
  }
});

// Analytics API Endpoints

// Get all deployments with analytics
app.get('/api/analytics/deployments', async (req, res) => {
  try {
    if (!VERCEL_TOKEN) {
      return res.status(400).json({ error: 'Vercel token not configured' });
    }

    // Fetch deployments from Vercel API
    const response = await fetch('https://api.vercel.com/v6/deployments?limit=100', {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const deployments = data.deployments || [];

    // Transform to analytics format
    const analytics = deployments.map((d: any) => ({
      id: d.uid,
      projectId: d.projectId,
      projectName: d.name,
      url: d.url ? `https://${d.url}` : null,
      state: d.state,
      createdAt: d.created ? new Date(d.created).getTime() : Date.now(),
      buildingAt: d.buildingAt ? new Date(d.buildingAt).getTime() : null,
      ready: d.ready ? new Date(d.ready).getTime() : null,
      buildTime: d.buildingAt && d.ready ?
        Math.floor((new Date(d.ready).getTime() - new Date(d.buildingAt).getTime()) / 1000) : null,
      meta: {
        githubCommitSha: d.meta?.githubCommitSha,
        githubCommitMessage: d.meta?.githubCommitMessage,
        githubCommitAuthorName: d.meta?.githubCommitAuthorName,
      }
    }));

    res.json({ deployments: analytics });
  } catch (error: any) {
    console.error('Error fetching deployment analytics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch analytics' });
  }
});

// Get analytics for a specific project
app.get('/api/analytics/project/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;

    if (!VERCEL_TOKEN) {
      return res.status(400).json({ error: 'Vercel token not configured' });
    }

    // Fetch project deployments from Vercel
    const response = await fetch(`https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=50`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.statusText}`);
    }

    const data: any = await response.json();
    const deployments = data.deployments || [];

    // Calculate analytics
    const totalDeployments = deployments.length;
    const successfulDeployments = deployments.filter((d: any) => d.state === 'READY').length;
    const failedDeployments = deployments.filter((d: any) => d.state === 'ERROR').length;

    const buildTimes = deployments
      .filter((d: any) => d.buildingAt && d.ready)
      .map((d: any) => Math.floor((new Date(d.ready).getTime() - new Date(d.buildingAt).getTime()) / 1000));

    const averageBuildTime = buildTimes.length > 0
      ? Math.floor(buildTimes.reduce((a: number, b: number) => a + b, 0) / buildTimes.length)
      : 0;

    // Transform deployments
    const deploymentsList = deployments.map((d: any) => ({
      id: d.uid,
      projectId: d.projectId,
      projectName: d.name,
      url: d.url ? `https://${d.url}` : null,
      state: d.state,
      createdAt: d.created ? new Date(d.created).getTime() : Date.now(),
      buildingAt: d.buildingAt ? new Date(d.buildingAt).getTime() : null,
      ready: d.ready ? new Date(d.ready).getTime() : null,
      buildTime: d.buildingAt && d.ready ?
        Math.floor((new Date(d.ready).getTime() - new Date(d.buildingAt).getTime()) / 1000) : null,
      meta: {
        githubCommitSha: d.meta?.githubCommitSha,
        githubCommitMessage: d.meta?.githubCommitMessage,
        githubCommitAuthorName: d.meta?.githubCommitAuthorName,
      }
    }));

    res.json({
      projectId,
      projectName: deployments[0]?.name || 'Unknown',
      totalDeployments,
      successfulDeployments,
      failedDeployments,
      averageBuildTime,
      deployments: deploymentsList
    });
  } catch (error: any) {
    console.error('Error fetching project analytics:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch project analytics' });
  }
});

// Get detailed analytics for a specific deployment
app.get('/api/analytics/deployment/:deploymentId', async (req, res) => {
  try {
    const { deploymentId } = req.params;

    if (!VERCEL_TOKEN) {
      return res.status(400).json({ error: 'Vercel token not configured' });
    }

    // Fetch deployment details from Vercel
    const response = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
      headers: {
        'Authorization': `Bearer ${VERCEL_TOKEN}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Vercel API error: ${response.statusText}`);
    }

    const deployment: any = await response.json();

    // Fetch build logs if available
    let buildLogs = null;
    try {
      const logsResponse = await fetch(`https://api.vercel.com/v2/deployments/${deploymentId}/events`, {
        headers: {
          'Authorization': `Bearer ${VERCEL_TOKEN}`,
        },
      });
      if (logsResponse.ok) {
        buildLogs = await logsResponse.json();
      }
    } catch (e) {
      console.log('Could not fetch build logs:', e);
    }

    res.json({
      id: deployment.uid,
      projectId: deployment.projectId,
      projectName: deployment.name,
      url: deployment.url ? `https://${deployment.url}` : null,
      state: deployment.state,
      createdAt: deployment.created ? new Date(deployment.created).getTime() : Date.now(),
      buildingAt: deployment.buildingAt ? new Date(deployment.buildingAt).getTime() : null,
      ready: deployment.ready ? new Date(deployment.ready).getTime() : null,
      buildTime: deployment.buildingAt && deployment.ready ?
        Math.floor((new Date(deployment.ready).getTime() - new Date(deployment.buildingAt).getTime()) / 1000) : null,
      meta: {
        githubCommitSha: deployment.meta?.githubCommitSha,
        githubCommitMessage: deployment.meta?.githubCommitMessage,
        githubCommitAuthorName: deployment.meta?.githubCommitAuthorName,
        githubCommitRef: deployment.meta?.githubCommitRef,
        githubOrg: deployment.meta?.githubOrg,
        githubRepo: deployment.meta?.githubRepo,
      },
      buildLogs: buildLogs,
      target: deployment.target,
      source: deployment.source,
    });
  } catch (error: any) {
    console.error('Error fetching deployment details:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch deployment details' });
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
    <title>BackBench - AI Code Editor with Ollama</title>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/axios/1.6.0/axios.min.js"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css" rel="stylesheet">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body { 
            font-family: 'Inter', 'Segoe UI', system-ui, sans-serif; 
            background: #000000;
            min-height: 100vh; 
            color: #ffffff;
            overflow: hidden;
        }
        
        .dashboard { 
            display: flex; 
            height: 100vh; 
            overflow: hidden;
            background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
        }
        
        .sidebar { 
            width: 280px; 
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            border-right: 1px solid rgba(255, 255, 255, 0.1);
            display: flex; 
            flex-direction: column;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        
        .sidebar:hover {
            background: rgba(255, 255, 255, 0.05);
        }
        
        .main-content { 
            flex: 1; 
            display: flex; 
            flex-direction: column; 
            overflow: hidden;
        }
        
        .header { 
            background: rgba(255, 255, 255, 0.03);
            backdrop-filter: blur(10px);
            padding: 1.5rem 2rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            display: flex; 
            justify-content: space-between; 
            align-items: center;
        }
        
        .logo { 
            font-size: 1.5rem; 
            font-weight: 800; 
            background: linear-gradient(135deg, #ffffff 0%, #cccccc 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            letter-spacing: -0.02em;
        }
        
        .content { 
            flex: 1; 
            overflow-y: auto; 
            padding: 2rem;
            background: transparent;
        }
        
        .content::-webkit-scrollbar { width: 8px; }
        .content::-webkit-scrollbar-track { background: rgba(255, 255, 255, 0.05); }
        .content::-webkit-scrollbar-thumb { 
            background: rgba(255, 255, 255, 0.2); 
            border-radius: 4px;
        }
        .content::-webkit-scrollbar-thumb:hover { background: rgba(255, 255, 255, 0.3); }
        
        .grid { 
            display: grid; 
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); 
            gap: 1.5rem;
        }
        
        .card { 
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 12px; 
            padding: 1.5rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
        }
        
        .card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 2px;
            background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.5), transparent);
            transform: translateX(-100%);
            transition: transform 0.6s ease;
        }
        
        .card:hover {
            transform: translateY(-8px);
            background: rgba(255, 255, 255, 0.08);
            border-color: rgba(255, 255, 255, 0.3);
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
        }
        
        .card:hover::before {
            transform: translateX(100%);
        }
        
        .btn { 
            padding: 0.75rem 1.5rem;
            border: 2px solid;
            border-radius: 8px;
            cursor: pointer;
            font-weight: 600;
            font-size: 0.95rem;
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            position: relative;
            overflow: hidden;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        
        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: currentColor;
            transform: scaleX(0);
            transform-origin: left;
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: -1;
            opacity: 0.1;
        }
        
        .btn:hover::before {
            transform: scaleX(1);
        }
        
        .btn:active {
            transform: scale(0.98);
        }
        
        .btn-primary { 
            background: #ffffff;
            color: #000000;
            border-color: #ffffff;
        }
        
        .btn-primary:hover { 
            background: #000000;
            color: #ffffff;
            box-shadow: 0 10px 30px rgba(255, 255, 255, 0.3);
        }
        
        .btn-secondary { 
            background: transparent;
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .btn-secondary:hover { 
            border-color: #ffffff;
            background: rgba(255, 255, 255, 0.1);
        }
        
        .btn-success { 
            background: transparent;
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .btn-danger { 
            background: transparent;
            color: #ff4444;
            border-color: #ff4444;
        }
        
        .btn-danger:hover {
            background: #ff4444;
            color: #ffffff;
        }
        
        .btn-github { 
            background: #ffffff;
            color: #000000;
            border-color: #ffffff;
        }
        
        .btn-github:hover {
            background: #000000;
            color: #ffffff;
        }
        
        .btn-sm { 
            padding: 0.5rem 1rem;
            font-size: 0.85rem;
        }
        
        .input { 
            width: 100%;
            padding: 0.875rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            font-size: 1rem;
            background: rgba(255, 255, 255, 0.05);
            color: #ffffff;
            transition: all 0.3s ease;
            margin-bottom: 1rem;
        }
        
        .input:focus {
            outline: none;
            border-color: #ffffff;
            background: rgba(255, 255, 255, 0.08);
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }
        
        .input::placeholder {
            color: rgba(255, 255, 255, 0.4);
        }
        
        .modal { 
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 1000;
            animation: fadeIn 0.3s ease;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        .modal-content { 
            background: rgba(26, 26, 26, 0.95);
            backdrop-filter: blur(20px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: 16px;
            padding: 2rem;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            animation: slideUp 0.3s ease;
        }
        
        @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
        }
        
        .tab { 
            padding: 1rem 1.5rem;
            cursor: pointer;
            border-left: 3px solid transparent;
            transition: all 0.2s ease;
            color: rgba(255, 255, 255, 0.6);
            font-weight: 500;
        }
        
        .tab:hover {
            background: rgba(255, 255, 255, 0.05);
            color: rgba(255, 255, 255, 0.9);
        }
        
        .tab.active { 
            border-left-color: #ffffff;
            color: #ffffff;
            background: rgba(255, 255, 255, 0.08);
        }
        
        .file-list { 
            max-height: 300px;
            overflow-y: auto;
        }
        
        .file-item { 
            padding: 0.75rem;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s ease;
            color: rgba(255, 255, 255, 0.7);
            border: 1px solid transparent;
        }
        
        .file-item:hover { 
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        .file-item.active { 
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .editor { 
            width: 100%;
            height: 400px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            padding: 1rem;
            font-family: 'Monaco', 'Courier New', monospace;
            background: rgba(0, 0, 0, 0.5);
            color: #ffffff;
            font-size: 0.9rem;
            line-height: 1.6;
        }
        
        .editor:focus {
            outline: none;
            border-color: #ffffff;
            box-shadow: 0 0 0 3px rgba(255, 255, 255, 0.1);
        }
        
        .chat-container { 
            height: 400px;
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 8px;
            overflow-y: auto;
            padding: 1rem;
            background: rgba(0, 0, 0, 0.3);
        }
        
        .message { 
            padding: 1rem 1.25rem;
            margin-bottom: 0.75rem;
            border-radius: 8px;
            animation: messageSlide 0.3s ease;
        }
        
        @keyframes messageSlide {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .message-user { 
            background: #ffffff;
            color: #000000;
            margin-left: 2rem;
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .message-ai { 
            background: rgba(255, 255, 255, 0.05);
            border: 1px solid rgba(255, 255, 255, 0.1);
            margin-right: 2rem;
            color: #ffffff;
        }
        
        .notification { 
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(26, 26, 26, 0.95);
            backdrop-filter: blur(10px);
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
            max-width: 400px;
            border: 1px solid;
            animation: slideIn 0.3s ease;
            z-index: 2000;
        }
        
        @keyframes slideIn {
            from { transform: translateX(400px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
        
        .notification.success { border-color: #4CAF50; color: #4CAF50; }
        .notification.error { border-color: #ff4444; color: #ff4444; }
        .notification.info { border-color: #ffffff; color: #ffffff; }
        
        .sidebar-section { 
            padding: 1.5rem;
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .sidebar-section h3 { 
            font-size: 0.75rem;
            color: rgba(255, 255, 255, 0.5);
            margin-bottom: 0.75rem;
            text-transform: uppercase;
            letter-spacing: 0.1em;
            font-weight: 600;
        }
        
        .sidebar-item { 
            padding: 0.75rem;
            cursor: pointer;
            border-radius: 6px;
            transition: all 0.2s ease;
            margin-bottom: 0.5rem;
            color: rgba(255, 255, 255, 0.7);
            border: 1px solid transparent;
        }
        
        .sidebar-item:hover { 
            background: rgba(255, 255, 255, 0.08);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.2);
        }
        
        .sidebar-item.active { 
            background: rgba(255, 255, 255, 0.1);
            color: #ffffff;
            border-color: rgba(255, 255, 255, 0.3);
        }
        
        .loading { 
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid rgba(255, 255, 255, 0.2);
            border-top: 2px solid #ffffff;
            border-radius: 50%;
            animation: spin 0.8s linear infinite;
        }
        
        @keyframes spin { 
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        textarea { resize: vertical; }
        
        .status { 
            width: 8px;
            height: 8px;
            border-radius: 50%;
            display: inline-block;
            margin-right: 0.5rem;
            box-shadow: 0 0 8px currentColor;
        }
        
        .status-on { background: #4CAF50; color: #4CAF50; }
        .status-off { background: #ff4444; color: #ff4444; }
        
        .file-selector { 
            background: rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 1rem;
            margin-bottom: 1rem;
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        .file-checkbox { margin-right: 0.5rem; cursor: pointer; }
        
        .file-selector-header { 
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 0.75rem;
        }
        
        .file-selector-header h4 { 
            margin: 0;
            flex: 1;
            font-size: 0.95rem;
            font-weight: 600;
        }
        
        .select-all-btn { 
            padding: 0.4rem 0.8rem;
            font-size: 0.8rem;
        }
        
        h2, h3, h4 { 
            font-weight: 700;
            letter-spacing: -0.01em;
        }
        
        strong { font-weight: 600; }
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
            
            // New state for deployments and analytics
            const [recentDeployments, setRecentDeployments] = useState([]);
            const [projectStats, setProjectStats] = useState(null);
            const [analyticsOverview, setAnalyticsOverview] = useState(null);
            const [allDeployments, setAllDeployments] = useState([]);
            const [selectedDeployment, setSelectedDeployment] = useState(null);
            const [selectedAnalyticsProject, setSelectedAnalyticsProject] = useState(null);
            const [deploymentDetails, setDeploymentDetails] = useState(null);



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

            const loadAllDeployments = async () => {
                try {
                    const response = await axios.get(\`${VITE_DYAD_BACKEND_URL}/api/analytics/deployments\`);
                    setAllDeployments(response.data.deployments || []);
                } catch (error) {
                    console.error('Failed to load deployments:', error);
                    addNotification('error', 'Failed to load deployments');
                }
            };

            const loadProjectAnalytics = async (projectId) => {
                try {
                    setLoading(true);
                    const response = await axios.get(\`${VITE_DYAD_BACKEND_URL}/api/analytics/project/\${projectId}\`);
                    setProjectStats(response.data);
                } catch (error) {
                    console.error('Failed to load project analytics:', error);
                    addNotification('error', 'Failed to load project analytics');
                } finally {
                    setLoading(false);
                }
            };

            const loadDeploymentDetails = async (deploymentId) => {
                try {
                    setLoading(true);
                    const response = await axios.get(\`${VITE_DYAD_BACKEND_URL}/api/analytics/deployment/\${deploymentId}\`);
                    setDeploymentDetails(response.data);
                    setSelectedDeployment(response.data);
                } catch (error) {
                    console.error('Failed to load deployment details:', error);
                    addNotification('error', 'Failed to load deployment details');
                } finally {
                    setLoading(false);
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
                            <h1 className="logo">BackBench - Ollama AI</h1>
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
                            {activeTab === 'analytics' && (
                                <AnalyticsTab 
                                    allDeployments={allDeployments}
                                    selectedAnalyticsProject={selectedAnalyticsProject}
                                    setSelectedAnalyticsProject={setSelectedAnalyticsProject}
                                    projectStats={projectStats}
                                    selectedDeployment={selectedDeployment}
                                    deploymentDetails={deploymentDetails}
                                    loadAllDeployments={loadAllDeployments}
                                    loadProjectAnalytics={loadProjectAnalytics}
                                    loadDeploymentDetails={loadDeploymentDetails}
                                    loading={loading}
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
                        <h2 className="logo">BackBench AI</h2>
                        <div style={{ marginTop: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                            <span className={\`status \${wsConnected ? 'status-on' : 'status-off'}\`}></span>
                            {wsConnected ? 'Connected' : 'Disconnected'}
                        </div>
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                        {[
                            { id: 'projects', icon: 'fas fa-folder', label: 'Projects' },
                            { id: 'editor', icon: 'fas fa-code', label: 'Editor' },
                            { id: 'ai-chat', icon: 'fas fa-robot', label: 'AI Chat' },
                            { id: 'analytics', icon: 'fas fa-chart-line', label: 'Analytics' }
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
                                    {(project.repositoryUrl || project.deploymentUrl) && (
                                        <div style={{ 
                                            display: 'flex', 
                                            gap: '1rem', 
                                            marginTop: '0.75rem',
                                            flexWrap: 'wrap'
                                        }}>
                                            {project.repositoryUrl && (
                                                <a 
                                                    href={project.repositoryUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        fontSize: '0.85rem', 
                                                        color: '#667eea',
                                                        textDecoration: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem'
                                                    }}
                                                >
                                                    <i className="fab fa-github"></i>
                                                    GitHub
                                                </a>
                            )}
                                            {project.deploymentUrl && (
                                                <a 
                                                    href={project.deploymentUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    style={{ 
                                                        fontSize: '0.85rem', 
                                                        color: '#10b981',
                                                        textDecoration: 'none',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        gap: '0.3rem'
                                                    }}
                                                >
                                                    <i className="fas fa-external-link-alt"></i>
                                                    Live Site
                                                </a>
                                            )}
                                        </div>
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

        function AnalyticsTab({ allDeployments, selectedAnalyticsProject, setSelectedAnalyticsProject, projectStats, selectedDeployment, deploymentDetails, loadAllDeployments, loadProjectAnalytics, loadDeploymentDetails, loading }) {
            useEffect(() => {
                loadAllDeployments();
            }, []);

            useEffect(() => {
                if (selectedAnalyticsProject) {
                    loadProjectAnalytics(selectedAnalyticsProject);
                }
            }, [selectedAnalyticsProject]);

            // Get unique projects from deployments
            const uniqueProjects = [...new Set(allDeployments.map(d => d.projectId))].filter(Boolean);
            
            const formatDate = (timestamp) => {
                return new Date(timestamp).toLocaleString();
            };

            const formatDuration = (seconds) => {
                if (!seconds) return 'N/A';
                const mins = Math.floor(seconds / 60);
                const secs = seconds % 60;
                return `${ mins }m ${ secs }s`;
            };

            const getStateColor = (state) => {
                switch(state) {
                    case 'READY': return '#10b981';
                    case 'ERROR': return '#ef4444';
                    case 'BUILDING': return '#f59e0b';
                    case 'QUEUED': return '#6b7280';
                    case 'CANCELED': return '#9ca3af';
                    default: return '#6b7280';
                }
            };

            const getStateIcon = (state) => {
                switch(state) {
                    case 'READY': return 'fas fa-check-circle';
                    case 'ERROR': return 'fas fa-times-circle';
                    case 'BUILDING': return 'fas fa-spinner fa-spin';
                    case 'QUEUED': return 'fas fa-clock';
                    case 'CANCELED': return 'fas fa-ban';
                    default: return 'fas fa-circle';
                }
            };

            return (
                <div style={{ display: 'flex', flexDirection: 'column', height: '100%', padding: '1rem' }}>
                    <h2 style={{ color: 'white', marginBottom: '1.5rem' }}>Deployment Analytics</h2>
                    
                    {/* Project Selector */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ color: 'white', display: 'block', marginBottom: '0.5rem' }}>
                            Select Project:
                        </label>
                        <select 
                            className="input"
                            value={selectedAnalyticsProject || ''}
                            onChange={(e) => setSelectedAnalyticsProject(e.target.value)}
                            style={{ width: '100%', maxWidth: '400px' }}
                        >
                            <option value="">All Projects</option>
                            {uniqueProjects.map(projectId => (
                                <option key={projectId} value={projectId}>{projectId}</option>
                            ))}
                        </select>
                    </div>

                    {/* Overview Cards */}
                    {projectStats && (
                        <div style={{ 
                            display: 'grid', 
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
                            gap: '1rem', 
                            marginBottom: '1.5rem' 
                        }}>
                            <div style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                padding: '1rem', 
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    Total Deployments
                                </div>
                                <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                                    {projectStats.totalDeployments}
                                </div>
                            </div>
                            <div style={{ 
                                background: 'rgba(16, 185, 129, 0.1)', 
                                padding: '1rem', 
                                borderRadius: '8px',
                                border: '1px solid rgba(16, 185, 129, 0.3)'
                            }}>
                                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    Successful
                                </div>
                                <div style={{ color: '#10b981', fontSize: '2rem', fontWeight: 'bold' }}>
                                    {projectStats.successfulDeployments}
                                </div>
                            </div>
                            <div style={{ 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                padding: '1rem', 
                                borderRadius: '8px',
                                border: '1px solid rgba(239, 68, 68, 0.3)'
                            }}>
                                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    Failed
                                </div>
                                <div style={{ color: '#ef4444', fontSize: '2rem', fontWeight: 'bold' }}>
                                    {projectStats.failedDeployments}
                                </div>
                            </div>
                            <div style={{ 
                                background: 'rgba(255, 255, 255, 0.1)', 
                                padding: '1rem', 
                                borderRadius: '8px',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.5rem' }}>
                                    Avg Build Time
                                </div>
                                <div style={{ color: 'white', fontSize: '2rem', fontWeight: 'bold' }}>
                                    {formatDuration(projectStats.averageBuildTime)}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Deployments List */}
                    <div style={{ flex: 1, overflowY: 'auto' }}>
                        <h3 style={{ color: 'white', marginBottom: '1rem' }}>
                            {selectedAnalyticsProject ? 'Project Deployments' : 'All Deployments'}
                        </h3>
                        
                        {loading ? (
                            <div style={{ textAlign: 'center', color: 'white', padding: '2rem' }}>
                                <i className="fas fa-spinner fa-spin" style={{ fontSize: '2rem' }}></i>
                                <div style={{ marginTop: '1rem' }}>Loading analytics...</div>
                            </div>
                        ) : (
                            <div style={{ 
                                background: 'rgba(0, 0, 0, 0.3)', 
                                borderRadius: '8px', 
                                overflow: 'hidden',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                    <thead>
                                        <tr style={{ background: 'rgba(255, 255, 255, 0.05)' }}>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Status</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Project</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>URL</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Build Time</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Created</th>
                                            <th style={{ padding: '0.75rem', textAlign: 'left', color: '#9ca3af', fontWeight: '600' }}>Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(projectStats?.deployments || allDeployments).map((deployment) => (
                                            <tr 
                                                key={deployment.id}
                                                style={{ 
                                                    borderTop: '1px solid rgba(255, 255, 255, 0.1)',
                                                    cursor: 'pointer',
                                                    background: selectedDeployment?.id === deployment.id ? 'rgba(255, 255, 255, 0.1)' : 'transparent'
                                                }}
                                                onClick={() => loadDeploymentDetails(deployment.id)}
                                            >
                                                <td style={{ padding: '0.75rem' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                        <i 
                                                            className={getStateIcon(deployment.state)}
                                                            style={{ color: getStateColor(deployment.state) }}
                                                        ></i>
                                                        <span style={{ color: getStateColor(deployment.state), fontSize: '0.875rem' }}>
                                                            {deployment.state}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.875rem' }}>
                                                    {deployment.projectName || 'N/A'}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    {deployment.url ? (
                                                        <a 
                                                            href={deployment.url} 
                                                            target="_blank" 
                                                            rel="noopener noreferrer"
                                                            style={{ color: '#3b82f6', textDecoration: 'none', fontSize: '0.875rem' }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        >
                                                            <i className="fas fa-external-link-alt" style={{ marginRight: '0.25rem' }}></i>
                                                            Visit
                                                        </a>
                                                    ) : (
                                                        <span style={{ color: '#6b7280', fontSize: '0.875rem' }}>N/A</span>
                                                    )}
                                                </td>
                                                <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.875rem' }}>
                                                    {formatDuration(deployment.buildTime)}
                                                </td>
                                                <td style={{ padding: '0.75rem', color: 'white', fontSize: '0.875rem' }}>
                                                    {formatDate(deployment.createdAt)}
                                                </td>
                                                <td style={{ padding: '0.75rem' }}>
                                                    <button
                                                        className="btn btn-secondary"
                                                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.5rem' }}
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            loadDeploymentDetails(deployment.id);
                                                        }}
                                                    >
                                                        Details
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                
                                {(projectStats?.deployments || allDeployments).length === 0 && (
                                    <div style={{ textAlign: 'center', color: '#6b7280', padding: '2rem' }}>
                                        No deployments found
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Deployment Details */}
                        {deploymentDetails && (
                            <div style={{ 
                                marginTop: '1.5rem', 
                                background: 'rgba(0, 0, 0, 0.3)', 
                                borderRadius: '8px', 
                                padding: '1.5rem',
                                border: '1px solid rgba(255, 255, 255, 0.2)'
                            }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                                    <h3 style={{ color: 'white', margin: 0 }}>Deployment Details</h3>
                                    <button 
                                        className="btn btn-secondary"
                                        onClick={() => setSelectedDeployment(null)}
                                        style={{ fontSize: '0.875rem' }}
                                    >
                                        Close
                                    </button>
                                </div>

                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                                    <div>
                                        <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Deployment ID</div>
                                        <div style={{ color: 'white', fontSize: '0.875rem', fontFamily: 'monospace' }}>{deploymentDetails.id}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Status</div>
                                        <div style={{ color: getStateColor(deploymentDetails.state), fontSize: '0.875rem', fontWeight: 'bold' }}>
                                            {deploymentDetails.state}
                                        </div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Build Time</div>
                                        <div style={{ color: 'white', fontSize: '0.875rem' }}>{formatDuration(deploymentDetails.buildTime)}</div>
                                    </div>
                                    <div>
                                        <div style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Created At</div>
                                        <div style={{ color: 'white', fontSize: '0.875rem' }}>{formatDate(deploymentDetails.createdAt)}</div>
                                    </div>
                                </div>

                                {deploymentDetails.meta && (
                                    <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)' }}>
                                        <h4 style={{ color: 'white', marginBottom: '0.75rem' }}>Git Information</h4>
                                        <div style={{ display: 'grid', gap: '0.5rem' }}>
                                            {deploymentDetails.meta.githubCommitSha && (
                                                <div>
                                                    <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Commit: </span>
                                                    <span style={{ color: 'white', fontSize: '0.875rem', fontFamily: 'monospace' }}>
                                                        {deploymentDetails.meta.githubCommitSha.substring(0, 7)}
                                                    </span>
                                                </div>
                                            )}
                                            {deploymentDetails.meta.githubCommitMessage && (
                                                <div>
                                                    <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Message: </span>
                                                    <span style={{ color: 'white', fontSize: '0.875rem' }}>
                                                        {deploymentDetails.meta.githubCommitMessage}
                                                    </span>
                                                </div>
                                            )}
                                            {deploymentDetails.meta.githubCommitAuthorName && (
                                                <div>
                                                    <span style={{ color: '#9ca3af', fontSize: '0.875rem' }}>Author: </span>
                                                    <span style={{ color: 'white', fontSize: '0.875rem' }}>
                                                        {deploymentDetails.meta.githubCommitAuthorName}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {deploymentDetails.url && (
                                    <div style={{ marginTop: '1rem' }}>
                                        <a 
                                            href={deploymentDetails.url} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="btn btn-primary"
                                            style={{ width: '100%', textAlign: 'center' }}
                                        >
                                            <i className="fas fa-external-link-alt" style={{ marginRight: '0.5rem' }}></i>
                                            Visit Deployment
                                        </a>
                                    </div>
                                )}
                            </div>
                        )}
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
    console.log('\n🚀 BackBench Backend Server Starting with Ollama AI\n');
    console.log('📍 HTTP API: http://localhost:' + PORT);
    console.log('🔌 WebSocket: ws://localhost:' + PORT);
    console.log('🎯 UI Dashboard: http://localhost:' + PORT + '\n');

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

    // Serve the standalone UI at root path
    console.log('🎨 Configuring standalone UI...');
    app.get('/', (req, res) => {
      res.redirect('/dyad');
    });
    console.log('✅ Standalone UI configured\n');

    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🎯 Open http://localhost:${PORT} in your browser\n`);
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