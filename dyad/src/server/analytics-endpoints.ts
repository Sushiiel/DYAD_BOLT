// Additional Analytics Endpoints for DYAD Backend
// These endpoints provide comprehensive analytics data from Vercel

import { Request, Response } from 'express';

const VERCEL_TOKEN = process.env.VERCEL_TOKEN;

// Get analytics metrics for a deployment (requests, bandwidth, etc.)
export async function getDeploymentMetrics(req: Request, res: Response) {
    try {
        const { deploymentId } = req.params;
        const { from, to } = req.query;

        if (!VERCEL_TOKEN) {
            return res.status(400).json({ error: 'Vercel token not configured' });
        }

        const deploymentResponse = await fetch(`https://api.vercel.com/v13/deployments/${deploymentId}`, {
            headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
        });

        if (!deploymentResponse.ok) {
            throw new Error(`Failed to fetch deployment: ${deploymentResponse.statusText}`);
        }

        const deployment: any = await deploymentResponse.json();
        const until = to ? parseInt(to as string) : Date.now();
        const since = from ? parseInt(from as string) : until - (24 * 60 * 60 * 1000);

        // Try to fetch analytics data (requires Vercel Pro plan)
        let analyticsData = null;
        try {
            const analyticsResponse = await fetch(
                `https://api.vercel.com/v1/analytics?deploymentId=${deploymentId}&from=${since}&until=${until}`,
                { headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` } }
            );
            if (analyticsResponse.ok) {
                analyticsData = await analyticsResponse.json();
            }
        } catch (e) {
            console.log('Analytics API not available (requires Pro plan)');
        }

        res.json({
            deploymentId,
            name: deployment.name,
            url: deployment.url ? `https://${deployment.url}` : null,
            state: deployment.state,
            createdAt: deployment.created,
            buildingAt: deployment.buildingAt,
            ready: deployment.ready,
            target: deployment.target || 'production',
            regions: deployment.regions || [],
            routes: deployment.routes || [],
            source: {
                commit: deployment.meta?.githubCommitSha,
                message: deployment.meta?.githubCommitMessage,
                author: deployment.meta?.githubCommitAuthorName,
                branch: deployment.meta?.githubCommitRef,
                org: deployment.meta?.githubCommitOrg,
                repo: deployment.meta?.githubCommitRepo,
            },
            timeRange: { from: since, to: until },
            analytics: analyticsData,
            note: analyticsData ? null : 'Detailed analytics require Vercel Pro plan'
        });
    } catch (error: any) {
        console.error('Error fetching deployment metrics:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch metrics' });
    }
}

// Get runtime logs for a deployment
export async function getDeploymentLogs(req: Request, res: Response) {
    try {
        const { deploymentId } = req.params;
        const { limit = '100', since, until } = req.query;

        if (!VERCEL_TOKEN) {
            return res.status(400).json({ error: 'Vercel token not configured' });
        }

        let queryParams = `limit=${limit}`;
        if (since) queryParams += `&since=${since}`;
        if (until) queryParams += `&until=${until}`;

        const logsResponse = await fetch(
            `https://api.vercel.com/v2/deployments/${deploymentId}/events?${queryParams}`,
            { headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` } }
        );

        if (!logsResponse.ok) {
            throw new Error(`Failed to fetch logs: ${logsResponse.statusText}`);
        }

        const logs = await logsResponse.json();
        res.json({
            deploymentId,
            logs: logs,
            count: Array.isArray(logs) ? logs.length : 0
        });
    } catch (error: any) {
        console.error('Error fetching deployment logs:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch logs' });
    }
}

// Get project analytics summary
export async function getProjectSummary(req: Request, res: Response) {
    try {
        const { projectId } = req.params;

        if (!VERCEL_TOKEN) {
            return res.status(400).json({ error: 'Vercel token not configured' });
        }

        const projectResponse = await fetch(`https://api.vercel.com/v9/projects/${projectId}`, {
            headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` },
        });

        if (!projectResponse.ok) {
            throw new Error(`Failed to fetch project: ${projectResponse.statusText}`);
        }

        const project: any = await projectResponse.json();
        const deploymentsResponse = await fetch(
            `https://api.vercel.com/v6/deployments?projectId=${projectId}&limit=20`,
            { headers: { 'Authorization': `Bearer ${VERCEL_TOKEN}` } }
        );

        let deployments = [];
        if (deploymentsResponse.ok) {
            const data: any = await deploymentsResponse.json();
            deployments = data.deployments || [];
        }

        const totalDeployments = deployments.length;
        const successfulDeployments = deployments.filter((d: any) => d.state === 'READY').length;
        const failedDeployments = deployments.filter((d: any) => d.state === 'ERROR').length;
        const buildTimes = deployments
            .filter((d: any) => d.buildingAt && d.ready)
            .map((d: any) => (new Date(d.ready).getTime() - new Date(d.buildingAt).getTime()) / 1000);
        const avgBuildTime = buildTimes.length > 0
            ? Math.floor(buildTimes.reduce((a, b) => a + b, 0) / buildTimes.length) : 0;

        res.json({
            projectId,
            projectName: project.name,
            framework: project.framework,
            totalDeployments,
            successfulDeployments,
            failedDeployments,
            averageBuildTime: avgBuildTime,
            recentDeployments: deployments.slice(0, 10).map((d: any) => ({
                id: d.uid,
                url: d.url ? `https://${d.url}` : null,
                state: d.state,
                createdAt: d.created,
            })),
        });
    } catch (error: any) {
        console.error('Error fetching project summary:', error);
        res.status(500).json({ error: error.message || 'Failed to fetch project summary' });
    }
}
