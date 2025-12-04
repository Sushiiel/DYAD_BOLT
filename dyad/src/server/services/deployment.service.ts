import { nanoid } from 'nanoid';
import { db } from '../db';
import { deployments, projectStats, analytics } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

export interface DeploymentConfig {
    projectId: string;
    platform: 'vercel' | 'netlify' | 'cloudflare' | 'railway' | 'github-pages';
    environment?: 'production' | 'preview' | 'development';
    config?: Record<string, any>;
}

export interface DeploymentResult {
    id: string;
    status: 'pending' | 'building' | 'success' | 'failed';
    deploymentUrl?: string;
    errorMessage?: string;
}

export class DeploymentService {
    /**
     * Create a new deployment record
     */
    async createDeployment(config: DeploymentConfig): Promise<string> {
        const deploymentId = nanoid();
        const now = Math.floor(Date.now() / 1000);

        await db.insert(deployments).values({
            id: deploymentId,
            projectId: config.projectId,
            platform: config.platform,
            environment: config.environment || 'production',
            status: 'pending',
            createdAt: now,
        });

        return deploymentId;
    }

    /**
     * Update deployment status
     */
    async updateDeploymentStatus(
        deploymentId: string,
        status: 'building' | 'success' | 'failed' | 'cancelled',
        data?: {
            deploymentUrl?: string;
            buildTime?: number;
            bundleSize?: number;
            errorMessage?: string;
            metadata?: Record<string, any>;
        }
    ): Promise<void> {
        const now = Math.floor(Date.now() / 1000);
        const updateData: any = {
            status,
            ...(status === 'success' || status === 'failed' ? { completedAt: now } : {}),
            ...data,
        };

        if (data?.metadata) {
            updateData.metadata = JSON.stringify(data.metadata);
        }

        await db
            .update(deployments)
            .set(updateData)
            .where(eq(deployments.id, deploymentId));

        // Update project stats
        if (status === 'success' || status === 'failed') {
            await this.updateProjectStats(deploymentId);
        }
    }

    /**
     * Get deployment by ID
     */
    async getDeployment(deploymentId: string) {
        const result = await db
            .select()
            .from(deployments)
            .where(eq(deployments.id, deploymentId))
            .limit(1);

        return result[0] || null;
    }

    /**
     * Get all deployments for a project
     */
    async getProjectDeployments(projectId: string, limit = 50) {
        return await db
            .select()
            .from(deployments)
            .where(eq(deployments.projectId, projectId))
            .orderBy(desc(deployments.createdAt))
            .limit(limit);
    }

    /**
     * Get recent deployments across all projects
     */
    async getRecentDeployments(limit = 20) {
        return await db
            .select()
            .from(deployments)
            .orderBy(desc(deployments.createdAt))
            .limit(limit);
    }

    /**
     * Update project statistics
     */
    private async updateProjectStats(deploymentId: string): Promise<void> {
        const deployment = await this.getDeployment(deploymentId);
        if (!deployment) return;

        const projectId = deployment.projectId;
        const statsId = nanoid();
        const now = Math.floor(Date.now() / 1000);

        // Get all deployments for this project
        const allDeployments = await this.getProjectDeployments(projectId, 1000);

        const totalDeployments = allDeployments.length;
        const successfulDeployments = allDeployments.filter(
            (d) => d.status === 'success'
        ).length;
        const failedDeployments = allDeployments.filter(
            (d) => d.status === 'failed'
        ).length;

        // Calculate average build time
        const completedDeployments = allDeployments.filter(
            (d) => d.buildTime !== null
        );
        const totalBuildTime = completedDeployments.reduce(
            (sum, d) => sum + (d.buildTime || 0),
            0
        );
        const avgBuildTime =
            completedDeployments.length > 0
                ? Math.round(totalBuildTime / completedDeployments.length)
                : 0;

        const lastDeployment = allDeployments[0];
        const lastSuccessfulDeployment = allDeployments.find(
            (d) => d.status === 'success'
        );

        // Upsert project stats
        const existingStats = await db
            .select()
            .from(projectStats)
            .where(eq(projectStats.projectId, projectId))
            .limit(1);

        if (existingStats.length > 0) {
            await db
                .update(projectStats)
                .set({
                    totalDeployments,
                    successfulDeployments,
                    failedDeployments,
                    avgBuildTime,
                    totalBuildTime,
                    lastDeploymentAt: lastDeployment?.createdAt,
                    lastSuccessfulDeploymentAt: lastSuccessfulDeployment?.createdAt,
                    updatedAt: now,
                })
                .where(eq(projectStats.projectId, projectId));
        } else {
            await db.insert(projectStats).values({
                id: statsId,
                projectId,
                totalDeployments,
                successfulDeployments,
                failedDeployments,
                avgBuildTime,
                totalBuildTime,
                lastDeploymentAt: lastDeployment?.createdAt,
                lastSuccessfulDeploymentAt: lastSuccessfulDeployment?.createdAt,
                updatedAt: now,
            });
        }
    }

    /**
     * Get project statistics
     */
    async getProjectStats(projectId: string) {
        const result = await db
            .select()
            .from(projectStats)
            .where(eq(projectStats.projectId, projectId))
            .limit(1);

        return result[0] || null;
    }

    /**
     * Record analytics metric
     */
    async recordMetric(data: {
        projectId: string;
        deploymentId?: string;
        metricType: 'lighthouse' | 'error' | 'performance' | 'usage' | 'cost';
        metricName: string;
        metricValue: string | number;
        metadata?: Record<string, any>;
    }): Promise<void> {
        const metricId = nanoid();
        const now = Math.floor(Date.now() / 1000);

        await db.insert(analytics).values({
            id: metricId,
            projectId: data.projectId,
            deploymentId: data.deploymentId,
            metricType: data.metricType,
            metricName: data.metricName,
            metricValue: String(data.metricValue),
            metadata: data.metadata ? JSON.stringify(data.metadata) : null,
            recordedAt: now,
        });
    }

    /**
     * Get analytics for a project
     */
    async getProjectAnalytics(
        projectId: string,
        metricType?: string,
        limit = 100
    ) {
        let query = db
            .select()
            .from(analytics)
            .where(eq(analytics.projectId, projectId));

        if (metricType) {
            query = query.where(
                and(
                    eq(analytics.projectId, projectId),
                    eq(analytics.metricType, metricType as any)
                )
            );
        }

        return await query.orderBy(desc(analytics.recordedAt)).limit(limit);
    }
}

export const deploymentService = new DeploymentService();
