import { ipcMain } from 'electron';
import { db } from '../../db/database';
import { boltProjects, boltFiles } from '../../db/schema';
import { eq } from 'drizzle-orm';

export function registerBoltHandlers() {
  console.log('🔧 Registering Bolt.diy IPC handlers...');

  // Project handlers
  ipcMain.handle('bolt:create-project', async (event, data) => {
    try {
      const project = await db.insert(boltProjects).values({
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      
      return project[0];
    } catch (error: any) {
      console.error('Error creating project:', error);
      throw new Error(`Failed to create project: ${error.message}`);
    }
  });

  ipcMain.handle('bolt:get-project', async (event, projectId) => {
    try {
      const project = await db.select().from(boltProjects).where(eq(boltProjects.id, projectId));
      if (!project.length) {
        throw new Error(`Project ${projectId} not found`);
      }
      return project[0];
    } catch (error: any) {
      throw new Error(`Failed to get project: ${error.message}`);
    }
  });

  ipcMain.handle('bolt:list-projects', async () => {
    try {
      return await db.select().from(boltProjects);
    } catch (error: any) {
      throw new Error(`Failed to list projects: ${error.message}`);
    }
  });

  // File handlers
  ipcMain.handle('bolt:save-file', async (event, { projectId, filePath, content }) => {
    try {
      const file = await db.insert(boltFiles).values({
        id: crypto.randomUUID(),
        projectId,
        path: filePath,
        content,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: [boltFiles.projectId, boltFiles.path],
        set: {
          content,
          updatedAt: new Date(),
        },
      }).returning();
      
      return file[0];
    } catch (error: any) {
      throw new Error(`Failed to save file: ${error.message}`);
    }
  });

  ipcMain.handle('bolt:read-file', async (event, { projectId, filePath }) => {
    try {
      const file = await db.select().from(boltFiles)
        .where(eq(boltFiles.projectId, projectId))
        .where(eq(boltFiles.path, filePath));
      
      if (!file.length) {
        throw new Error(`File ${filePath} not found in project ${projectId}`);
      }
      
      return file[0].content;
    } catch (error: any) {
      throw new Error(`Failed to read file: ${error.message}`);
    }
  });

  console.log('✅ Bolt.diy IPC handlers registered successfully');
}