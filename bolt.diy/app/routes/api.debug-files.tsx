import { json, type ActionFunctionArgs, type LoaderFunctionArgs } from '@remix-run/cloudflare';
import * as fs from 'fs';
import * as path from 'path';

const PROJECT_ROOT = '/Users/mymac/project';

export async function loader({ request }: LoaderFunctionArgs) {
  try {
    const url = new URL(request.url);
    const chatId = url.searchParams.get('chatId');
    
    console.log(`[Debug Files] Chat ID: ${chatId}`);
    
    // List all directories in project root
    const projectDirs = fs.existsSync(PROJECT_ROOT) 
      ? fs.readdirSync(PROJECT_ROOT, { withFileTypes: true })
          .filter(dirent => dirent.isDirectory())
          .map(dirent => dirent.name)
      : [];
    
    console.log(`[Debug Files] Project directories:`, projectDirs);
    
    const targetDirectory = chatId ? path.join(PROJECT_ROOT, chatId) : PROJECT_ROOT;
    const fileStructure: any = {};
    
    if (fs.existsSync(targetDirectory)) {
      function walkDir(dir: string, prefix = ''): void {
        try {
          const files = fs.readdirSync(dir);
          
          files.forEach((file) => {
            if (file.startsWith('.')) return; // Skip hidden files
            if (file === 'node_modules') return; // Skip node_modules
            
            const fullPath = path.join(dir, file);
            const stat = fs.statSync(fullPath);
            const key = prefix ? `${prefix}/${file}` : file;
            
            if (stat.isDirectory()) {
              fileStructure[key] = { type: 'directory', children: {} };
              walkDir(fullPath, key);
            } else {
              try {
                const content = fs.readFileSync(fullPath, 'utf-8');
                fileStructure[key] = {
                  type: 'file',
                  size: stat.size,
                  content: content.substring(0, 500), // First 500 chars
                  fullPath: fullPath
                };
              } catch {
                fileStructure[key] = {
                  type: 'file',
                  size: stat.size,
                  content: '[Binary file]',
                  fullPath: fullPath
                };
              }
            }
          });
        } catch (error) {
          console.error(`Failed to read directory ${dir}:`, error);
        }
      }
      
      walkDir(targetDirectory);
    }
    
    return json({
      success: true,
      projectRoot: PROJECT_ROOT,
      targetDirectory,
      chatId,
      projectDirectories: projectDirs,
      fileStructure,
      fileCount: Object.keys(fileStructure).filter(key => fileStructure[key].type === 'file').length
    });
    
  } catch (error) {
    const errMsg = error instanceof Error ? error.message : String(error);
    console.error('[Debug Files] Error:', error);
    return json({ 
      success: false, 
      error: errMsg,
      projectRoot: PROJECT_ROOT
    }, { status: 500 });
  }
}

export async function action({ request }: ActionFunctionArgs) {
  return json({ error: `Method ${request.method} not allowed` }, { status: 405 });
}
