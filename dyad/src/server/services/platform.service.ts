import axios from 'axios';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';
import archiver from 'archiver';
import { deploymentService } from './deployment.service';

export interface VercelConfig {
    apiToken: string;
    teamId?: string;
    projectName: string;
}

export interface NetlifyConfig {
    apiToken: string;
    siteName: string;
}

export interface CloudflareConfig {
    apiToken: string;
    accountId: string;
    projectName: string;
}

export interface RailwayConfig {
    apiToken: string;
    projectName: string;
}

/**
 * Vercel Deployment Service
 */
export class VercelDeploymentService {
    private apiToken: string;
    private teamId?: string;
    private baseUrl = 'https://api.vercel.com';

    constructor(config: VercelConfig) {
        this.apiToken = config.apiToken;
        this.teamId = config.teamId;
    }

    async deploy(
        projectPath: string,
        projectName: string,
        localDeploymentId: string
    ): Promise<{ url: string; buildTime: number; vercelDeploymentId: string }> {
        const startTime = Date.now();

        try {
            // Update status to building
            await deploymentService.updateDeploymentStatus(localDeploymentId, 'building');

            // Create deployment on Vercel
            const deployment = await this.createDeployment(projectPath, projectName);

            console.log(`✅ Vercel deployment created: ${deployment.id}`);
            console.log(`📝 Local deployment ID: ${localDeploymentId}`);
            console.log(`📝 Vercel deployment ID: ${deployment.id}`);

            // Wait for deployment to complete
            await this.waitForDeployment(deployment.id);

            const buildTime = Math.floor((Date.now() - startTime) / 1000);

            // Update status to success with Vercel deployment ID in metadata
            await deploymentService.updateDeploymentStatus(localDeploymentId, 'success', {
                deploymentUrl: deployment.url,
                buildTime,
                metadata: {
                    vercelDeploymentId: deployment.id,
                    vercelUrl: deployment.url
                },
            });

            return {
                url: deployment.url,
                buildTime,
                vercelDeploymentId: deployment.id
            };
        } catch (error: any) {
            await deploymentService.updateDeploymentStatus(localDeploymentId, 'failed', {
                errorMessage: error.message,
            });
            throw error;
        }
    }

    private async createDeployment(projectPath: string, projectName: string) {
        const files = await this.getProjectFiles(projectPath);

        const response = await axios.post(
            `${this.baseUrl}/v13/deployments`,
            {
                name: projectName,
                files,
                projectSettings: {
                    framework: 'vite',
                },
            },
            {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    'Content-Type': 'application/json',
                },
                params: this.teamId ? { teamId: this.teamId } : {},
            }
        );

        return {
            id: response.data.id,
            url: response.data.url,
        };
    }

    private async getProjectFiles(projectPath: string): Promise<any[]> {
        const files: any[] = [];
        const walkDir = (dir: string, baseDir: string = dir) => {
            const items = fs.readdirSync(dir);
            for (const item of items) {
                const fullPath = path.join(dir, item);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory()) {
                    if (!item.startsWith('.') && item !== 'node_modules') {
                        walkDir(fullPath, baseDir);
                    }
                } else {
                    const relativePath = path.relative(baseDir, fullPath);
                    const content = fs.readFileSync(fullPath, 'utf-8');
                    files.push({
                        file: relativePath,
                        data: content,
                    });
                }
            }
        };

        walkDir(projectPath);
        return files;
    }

    private async waitForDeployment(deploymentId: string): Promise<void> {
        const maxAttempts = 60; // 5 minutes max
        let attempts = 0;

        while (attempts < maxAttempts) {
            const response = await axios.get(
                `${this.baseUrl}/v13/deployments/${deploymentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                    },
                    params: this.teamId ? { teamId: this.teamId } : {},
                }
            );

            const state = response.data.readyState;

            if (state === 'READY') {
                return;
            } else if (state === 'ERROR' || state === 'CANCELED') {
                throw new Error(`Deployment failed with state: ${state}`);
            }

            await new Promise((resolve) => setTimeout(resolve, 5000));
            attempts++;
        }

        throw new Error('Deployment timeout');
    }
}

/**
 * Netlify Deployment Service
 */
export class NetlifyDeploymentService {
    private apiToken: string;
    private baseUrl = 'https://api.netlify.com/api/v1';

    constructor(config: NetlifyConfig) {
        this.apiToken = config.apiToken;
    }

    async deploy(
        projectPath: string,
        siteName: string,
        deploymentId: string
    ): Promise<{ url: string; buildTime: number }> {
        const startTime = Date.now();

        try {
            await deploymentService.updateDeploymentStatus(deploymentId, 'building');

            // Create site if it doesn't exist
            const site = await this.getOrCreateSite(siteName);

            // Deploy files
            const deployment = await this.deployFiles(site.id, projectPath);

            // Wait for deployment
            await this.waitForDeployment(deployment.id);

            const buildTime = Math.floor((Date.now() - startTime) / 1000);

            await deploymentService.updateDeploymentStatus(deploymentId, 'success', {
                deploymentUrl: deployment.url,
                buildTime,
                metadata: { netlifyDeploymentId: deployment.id },
            });

            return { url: deployment.url, buildTime };
        } catch (error: any) {
            await deploymentService.updateDeploymentStatus(deploymentId, 'failed', {
                errorMessage: error.message,
            });
            throw error;
        }
    }

    private async getOrCreateSite(siteName: string) {
        try {
            // Try to get existing site
            const response = await axios.get(`${this.baseUrl}/sites/${siteName}`, {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                },
            });
            return response.data;
        } catch (error) {
            // Create new site
            const response = await axios.post(
                `${this.baseUrl}/sites`,
                {
                    name: siteName,
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                    },
                }
            );
            return response.data;
        }
    }

    private async deployFiles(siteId: string, projectPath: string) {
        // Create zip of project files
        const zipPath = `/tmp/${siteId}-${Date.now()}.zip`;
        await this.createZip(projectPath, zipPath);

        // Upload zip
        const formData = new FormData();
        formData.append('file', fs.createReadStream(zipPath));

        const response = await axios.post(
            `${this.baseUrl}/sites/${siteId}/deploys`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    ...formData.getHeaders(),
                },
            }
        );

        // Clean up
        fs.unlinkSync(zipPath);

        return {
            id: response.data.id,
            url: response.data.ssl_url || response.data.url,
        };
    }

    private async createZip(sourceDir: string, outPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }

    private async waitForDeployment(deploymentId: string): Promise<void> {
        const maxAttempts = 60;
        let attempts = 0;

        while (attempts < maxAttempts) {
            const response = await axios.get(
                `${this.baseUrl}/deploys/${deploymentId}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                    },
                }
            );

            const state = response.data.state;

            if (state === 'ready') {
                return;
            } else if (state === 'error') {
                throw new Error('Deployment failed');
            }

            await new Promise((resolve) => setTimeout(resolve, 5000));
            attempts++;
        }

        throw new Error('Deployment timeout');
    }
}

/**
 * Cloudflare Pages Deployment Service
 */
export class CloudflareDeploymentService {
    private apiToken: string;
    private accountId: string;
    private baseUrl = 'https://api.cloudflare.com/client/v4';

    constructor(config: CloudflareConfig) {
        this.apiToken = config.apiToken;
        this.accountId = config.accountId;
    }

    async deploy(
        projectPath: string,
        projectName: string,
        deploymentId: string
    ): Promise<{ url: string; buildTime: number }> {
        const startTime = Date.now();

        try {
            await deploymentService.updateDeploymentStatus(deploymentId, 'building');

            // Create project if it doesn't exist
            await this.getOrCreateProject(projectName);

            // Deploy via direct upload
            const deployment = await this.directUpload(projectName, projectPath);

            const buildTime = Math.floor((Date.now() - startTime) / 1000);

            await deploymentService.updateDeploymentStatus(deploymentId, 'success', {
                deploymentUrl: deployment.url,
                buildTime,
                metadata: { cloudflareDeploymentId: deployment.id },
            });

            return { url: deployment.url, buildTime };
        } catch (error: any) {
            await deploymentService.updateDeploymentStatus(deploymentId, 'failed', {
                errorMessage: error.message,
            });
            throw error;
        }
    }

    private async getOrCreateProject(projectName: string) {
        try {
            const response = await axios.get(
                `${this.baseUrl}/accounts/${this.accountId}/pages/projects/${projectName}`,
                {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                    },
                }
            );
            return response.data.result;
        } catch (error) {
            const response = await axios.post(
                `${this.baseUrl}/accounts/${this.accountId}/pages/projects`,
                {
                    name: projectName,
                    production_branch: 'main',
                },
                {
                    headers: {
                        Authorization: `Bearer ${this.apiToken}`,
                    },
                }
            );
            return response.data.result;
        }
    }

    private async directUpload(projectName: string, projectPath: string) {
        // Create zip
        const zipPath = `/tmp/${projectName}-${Date.now()}.zip`;
        await this.createZip(projectPath, zipPath);

        // Upload
        const formData = new FormData();
        formData.append('file', fs.createReadStream(zipPath));

        const response = await axios.post(
            `${this.baseUrl}/accounts/${this.accountId}/pages/projects/${projectName}/deployments`,
            formData,
            {
                headers: {
                    Authorization: `Bearer ${this.apiToken}`,
                    ...formData.getHeaders(),
                },
            }
        );

        // Clean up
        fs.unlinkSync(zipPath);

        return {
            id: response.data.result.id,
            url: response.data.result.url,
        };
    }

    private async createZip(sourceDir: string, outPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(outPath);
            const archive = archiver('zip', { zlib: { level: 9 } });

            output.on('close', resolve);
            archive.on('error', reject);

            archive.pipe(output);
            archive.directory(sourceDir, false);
            archive.finalize();
        });
    }
}
