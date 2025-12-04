import React, { useState, useEffect } from 'react';
import { useAuth } from './AuthProvider';
import { classNames } from '~/utils/classNames';

interface CredentialSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    onComplete?: () => void;
}

const DYAD_BACKEND_URL = import.meta.env.VITE_DYAD_BACKEND_URL || 'http://localhost:9999';

export function CredentialSetupModal({ isOpen, onClose, onComplete }: CredentialSetupModalProps) {
    const { token } = useAuth();
    const [githubToken, setGithubToken] = useState('');
    const [vercelToken, setVercelToken] = useState('');
    const [vercelOrgId, setVercelOrgId] = useState('');
    const [vercelProjectId, setVercelProjectId] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (isOpen && token) {
            loadExistingCredentials();
        }
    }, [isOpen, token]);

    const loadExistingCredentials = async () => {
        if (!token) return;

        setIsLoading(true);
        try {
            const response = await fetch(`${DYAD_BACKEND_URL}/api/credentials`, {
                headers: { 'Authorization': `Bearer ${token}` },
            });

            if (response.ok) {
                const data = await response.json();
                // We only get the types, not the values (for security)
                // So we just show which credentials exist
                console.log('Existing credentials:', data.credentials);
            }
        } catch (err) {
            console.error('Error loading credentials:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const saveCredential = async (type: string, value: string) => {
        if (!value.trim() || !token) return;

        const response = await fetch(`${DYAD_BACKEND_URL}/api/credentials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ type, value }),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.error || `Failed to save ${type}`);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSaving(true);

        try {
            // Save each credential that has a value
            if (githubToken.trim()) {
                await saveCredential('github_token', githubToken);
            }
            if (vercelToken.trim()) {
                await saveCredential('vercel_token', vercelToken);
            }
            if (vercelOrgId.trim()) {
                await saveCredential('vercel_org_id', vercelOrgId);
            }
            if (vercelProjectId.trim()) {
                await saveCredential('vercel_project_id', vercelProjectId);
            }

            onComplete?.();
            onClose();
        } catch (err: any) {
            setError(err.message || 'Failed to save credentials');
        } finally {
            setIsSaving(false);
        }
    };

    const handleSkip = () => {
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <div className="bg-bolt-elements-background-depth-1 rounded-lg shadow-xl w-full max-w-2xl p-6 border border-bolt-elements-borderColor max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h2 className="text-2xl font-bold text-bolt-elements-textPrimary">
                            Setup Deployment Credentials
                        </h2>
                        <p className="text-sm text-bolt-elements-textSecondary mt-1">
                            Configure your credentials once - they'll be used automatically for all deployments
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary"
                    >
                        <div className="i-ph:x text-xl" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="text-center py-8">
                        <div className="i-svg-spinners:90-ring-with-bg text-4xl text-bolt-elements-loader-progress mx-auto" />
                        <p className="text-bolt-elements-textSecondary mt-2">Loading...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* GitHub Token */}
                        <div>
                            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                                GitHub Personal Access Token
                                <span className="text-bolt-elements-textSecondary text-xs ml-2">(Required for deployment)</span>
                            </label>
                            <input
                                type="password"
                                value={githubToken}
                                onChange={(e) => setGithubToken(e.target.value)}
                                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus font-mono text-sm"
                                placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                            />
                            <p className="text-xs text-bolt-elements-textSecondary mt-1">
                                Create one at{' '}
                                <a
                                    href="https://github.com/settings/tokens/new?scopes=repo"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-bolt-elements-textPrimary hover:underline"
                                >
                                    github.com/settings/tokens
                                </a>
                                {' '}with 'repo' scope
                            </p>
                        </div>

                        {/* Vercel Token */}
                        <div>
                            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                                Vercel Token
                                <span className="text-bolt-elements-textSecondary text-xs ml-2">(Optional - for Vercel deployment)</span>
                            </label>
                            <input
                                type="password"
                                value={vercelToken}
                                onChange={(e) => setVercelToken(e.target.value)}
                                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus font-mono text-sm"
                                placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxx"
                            />
                        </div>

                        {/* Vercel Org ID */}
                        <div>
                            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                                Vercel Organization ID
                                <span className="text-bolt-elements-textSecondary text-xs ml-2">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={vercelOrgId}
                                onChange={(e) => setVercelOrgId(e.target.value)}
                                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus font-mono text-sm"
                                placeholder="team_xxxxxxxxxxxxxxxxxxxx"
                            />
                        </div>

                        {/* Vercel Project ID */}
                        <div>
                            <label className="block text-sm font-medium text-bolt-elements-textPrimary mb-2">
                                Vercel Project ID
                                <span className="text-bolt-elements-textSecondary text-xs ml-2">(Optional)</span>
                            </label>
                            <input
                                type="text"
                                value={vercelProjectId}
                                onChange={(e) => setVercelProjectId(e.target.value)}
                                className="w-full px-3 py-2 bg-bolt-elements-background-depth-2 border border-bolt-elements-borderColor rounded-md text-bolt-elements-textPrimary focus:outline-none focus:ring-2 focus:ring-bolt-elements-focus font-mono text-sm"
                                placeholder="prj_xxxxxxxxxxxxxxxxxxxx"
                            />
                        </div>

                        {error && (
                            <div className="bg-red-500 bg-opacity-10 border border-red-500 text-red-500 px-3 py-2 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <div className="flex gap-3">
                            <button
                                type="submit"
                                disabled={isSaving || !githubToken.trim()}
                                className={classNames(
                                    'flex-1 py-2 px-4 rounded-md font-medium transition-colors',
                                    isSaving || !githubToken.trim()
                                        ? 'bg-bolt-elements-button-primary-background opacity-50 cursor-not-allowed'
                                        : 'bg-bolt-elements-button-primary-background hover:bg-bolt-elements-button-primary-backgroundHover text-bolt-elements-button-primary-text'
                                )}
                            >
                                {isSaving ? 'Saving...' : 'Save Credentials'}
                            </button>
                            <button
                                type="button"
                                onClick={handleSkip}
                                className="px-4 py-2 text-bolt-elements-textSecondary hover:text-bolt-elements-textPrimary transition-colors"
                            >
                                Skip for now
                            </button>
                        </div>

                        <p className="text-xs text-bolt-elements-textSecondary text-center">
                            🔒 Your credentials are encrypted and stored securely. They will never be shared with other users.
                        </p>
                    </form>
                )}
            </div>
        </div>
    );
}
