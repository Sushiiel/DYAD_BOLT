import {
    Users,
    Palette,
    Rocket,
    Shield,
    BarChart3,
    Code2,
    Plug,
    FileCode,
    Database,
    Sparkles,
    Music,
    Zap,
    ChevronDown,
    ChevronUp,
} from "lucide-react";
import { useState } from "react";

interface Feature {
    icon: React.ReactNode;
    title: string;
    description: string;
    status?: "available" | "beta" | "coming-soon";
    highlights?: string[];
}

interface FeatureCategory {
    id: string;
    title: string;
    features: Feature[];
    defaultExpanded?: boolean;
}

const featureCategories: FeatureCategory[] = [
    {
        id: "collaboration",
        title: "🔥 Real-Time Collaborative Coding",
        defaultExpanded: true,
        features: [
            {
                icon: <Users className="w-5 h-5" />,
                title: "Multi-User Sessions",
                description: "Code together with your team and AI assistance in real-time",
                status: "coming-soon",
                highlights: ["Live cursor tracking", "Shared AI context", "Voice-to-code"],
            },
        ],
    },
    {
        id: "visual-builder",
        title: "🎨 Visual Component Builder",
        defaultExpanded: true,
        features: [
            {
                icon: <Palette className="w-5 h-5" />,
                title: "No-Code + AI Builder",
                description: "Drag-and-drop UI builder that generates production-ready code",
                status: "coming-soon",
                highlights: [
                    "AI component suggestions",
                    "Live preview with hot-reload",
                    "Component marketplace",
                ],
            },
        ],
    },
    {
        id: "deployment",
        title: "🚀 One-Click Multi-Platform Deployment",
        defaultExpanded: true,
        features: [
            {
                icon: <Rocket className="w-5 h-5" />,
                title: "Deploy Anywhere",
                description: "Deploy to Vercel, Netlify, Cloudflare, AWS, Railway from one button",
                status: "beta",
                highlights: [
                    "Automatic environment management",
                    "Preview deployments",
                    "One-click rollback",
                ],
            },
        ],
    },
    {
        id: "ai-qa",
        title: "🤖 AI Code Review & Quality Assurance",
        features: [
            {
                icon: <Shield className="w-5 h-5" />,
                title: "Automatic Code Review",
                description: "AI reviews your code before deployment with security scanning",
                status: "available",
                highlights: [
                    "Security vulnerability scanning",
                    "Performance optimization",
                    "Accessibility compliance",
                ],
            },
        ],
    },
    {
        id: "analytics",
        title: "📊 Built-in Analytics & Monitoring",
        features: [
            {
                icon: <BarChart3 className="w-5 h-5" />,
                title: "Real-Time Metrics",
                description: "Track app performance, user behavior, and errors with AI-suggested fixes",
                status: "coming-soon",
                highlights: [
                    "Performance metrics",
                    "Error tracking",
                    "Lighthouse scores",
                ],
            },
        ],
    },
    {
        id: "playground",
        title: "🎮 Interactive Playground Mode",
        features: [
            {
                icon: <Code2 className="w-5 h-5" />,
                title: "Live Coding Environment",
                description: "CodeSandbox-like environment with AI assistance and instant sharing",
                status: "coming-soon",
                highlights: ["Instant sharing", "Version history", "Fork and remix"],
            },
        ],
    },
    {
        id: "api-integration",
        title: "🌐 AI-Powered API Integration",
        features: [
            {
                icon: <Plug className="w-5 h-5" />,
                title: "Natural Language APIs",
                description: "Call APIs using natural language and auto-generate clients",
                status: "coming-soon",
                highlights: [
                    "Natural language API calls",
                    "Auto-generate API clients",
                    "API marketplace",
                ],
            },
        ],
    },
    {
        id: "templates",
        title: "🎯 Smart Project Templates",
        features: [
            {
                icon: <FileCode className="w-5 h-5" />,
                title: "AI-Curated Templates",
                description: "Industry-specific templates with best practices built-in",
                status: "coming-soon",
                highlights: [
                    "SaaS, E-commerce, Portfolio templates",
                    "One-click customization",
                    "Best practices included",
                ],
            },
        ],
    },
    {
        id: "auth-db",
        title: "🔐 Built-in Authentication & Database",
        features: [
            {
                icon: <Database className="w-5 h-5" />,
                title: "Zero-Config Auth & DB",
                description: "Authentication and database with visual designer and AI suggestions",
                status: "beta",
                highlights: [
                    "Email, social, magic links",
                    "Visual database designer",
                    "Automatic API generation",
                ],
            },
        ],
    },
    {
        id: "design-system",
        title: "🎨 AI Design System Generator",
        features: [
            {
                icon: <Sparkles className="w-5 h-5" />,
                title: "Screenshot to Design System",
                description: "Upload a screenshot and AI generates a matching design system",
                status: "coming-soon",
                highlights: [
                    "Brand color extraction",
                    "Automatic dark mode",
                    "Accessibility-first palettes",
                ],
            },
        ],
    },
    {
        id: "vibe-mode",
        title: "🌟 Vibe Mode - Ultimate Developer Experience",
        features: [
            {
                icon: <Music className="w-5 h-5" />,
                title: "Code in Your Flow",
                description: "Music integration, ambient backgrounds, and mood-based themes",
                status: "coming-soon",
                highlights: [
                    "Spotify integration",
                    "Pomodoro timer",
                    "Achievement system",
                ],
            },
        ],
    },
    {
        id: "differentiators",
        title: "💎 Unique Differentiators",
        features: [
            {
                icon: <Zap className="w-5 h-5" />,
                title: "Revolutionary Features",
                description: "AI code evolution, natural language Git, and time travel debugging",
                status: "coming-soon",
                highlights: [
                    "AI continuously improves code",
                    "Natural language Git commands",
                    "Time travel debugging",
                ],
            },
        ],
    },
];

function StatusBadge({ status }: { status?: Feature["status"] }) {
    if (!status) return null;

    const styles = {
        available: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400",
        beta: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
        "coming-soon": "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    };

    const labels = {
        available: "Available",
        beta: "Beta",
        "coming-soon": "Coming Soon",
    };

    return (
        <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${styles[status]}`}>
            {labels[status]}
        </span>
    );
}

function FeatureCard({ feature }: { feature: Feature }) {
    return (
        <div className="group relative p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-all duration-200 hover:shadow-md hover:scale-[1.02]">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0 p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary/20 transition-colors">
                    {feature.icon}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-sm">{feature.title}</h4>
                        <StatusBadge status={feature.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mb-2">{feature.description}</p>
                    {feature.highlights && feature.highlights.length > 0 && (
                        <ul className="space-y-1">
                            {feature.highlights.map((highlight, idx) => (
                                <li key={idx} className="text-xs text-muted-foreground flex items-center gap-1">
                                    <span className="text-primary">•</span>
                                    {highlight}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

function FeatureCategorySection({ category }: { category: FeatureCategory }) {
    const [isExpanded, setIsExpanded] = useState(category.defaultExpanded ?? false);

    return (
        <div className="mb-4">
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
            >
                <h3 className="text-base font-bold">{category.title}</h3>
                {isExpanded ? (
                    <ChevronUp className="w-5 h-5 text-muted-foreground" />
                ) : (
                    <ChevronDown className="w-5 h-5 text-muted-foreground" />
                )}
            </button>
            {isExpanded && (
                <div className="mt-3 grid grid-cols-1 gap-3">
                    {category.features.map((feature, idx) => (
                        <FeatureCard key={idx} feature={feature} />
                    ))}
                </div>
            )}
        </div>
    );
}

export function FeatureSections() {
    return (
        <div className="max-w-4xl mx-auto p-6">
            <div className="text-center mb-8">
                <h2 className="text-3xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    Welcome to BackBench
                </h2>
                <p className="text-muted-foreground text-sm">
                    The Ultimate Vibe Coding Platform - Explore our revolutionary features below
                </p>
            </div>

            <div className="space-y-2">
                {featureCategories.map((category) => (
                    <FeatureCategorySection key={category.id} category={category} />
                ))}
            </div>

            <div className="mt-8 p-4 rounded-lg bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-500/20">
                <p className="text-sm text-center text-muted-foreground">
                    💡 <strong>Get Started:</strong> Type your request above to start building with AI assistance
                </p>
            </div>
        </div>
    );
}
