import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';

interface AboutModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AboutModal({ isOpen, onClose }: AboutModalProps) {
    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black/80" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-4xl transform overflow-hidden bg-black border-4 border-white p-8 text-left align-middle shadow-2xl transition-all">
                                <Dialog.Title className="text-3xl font-black uppercase tracking-wider text-white mb-6 flex items-center justify-between">
                                    <span>About WORKSPACE</span>
                                    <button
                                        onClick={onClose}
                                        className="text-white hover:text-white/80 transition-colors"
                                    >
                                        <div className="i-ph:x text-2xl" />
                                    </button>
                                </Dialog.Title>

                                <div className="space-y-6 text-white modern-scrollbar max-h-[70vh] overflow-y-auto pr-4">
                                    {/* What is it */}
                                    <section>
                                        <h3 className="text-xl font-black uppercase tracking-wider mb-3 text-white">
                                            ⚡ What is WORKSPACE?
                                        </h3>
                                        <p className="text-white/80 leading-relaxed">
                                            WORKSPACE is a revolutionary AI-powered full-stack development environment that combines the power of
                                            bolt.diy (Bolt) with BackBench - enabling you to go from idea to deployed application in minutes,
                                            not hours or days.
                                        </p>
                                    </section>

                                    {/* Why it's useful */}
                                    <section>
                                        <h3 className="text-xl font-black uppercase tracking-wider mb-3 text-white">
                                            🎯 Why WORKSPACE is Useful
                                        </h3>
                                        <ul className="space-y-2 text-white/80">
                                            <li className="flex items-start gap-2">
                                                <span className="text-white">▸</span>
                                                <span><strong className="text-white">Instant Development:</strong> Generate complete, production-ready applications with AI in seconds</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-white">▸</span>
                                                <span><strong className="text-white">No Setup Required:</strong> Start coding immediately without installing dependencies or configuring environments</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-white">▸</span>
                                                <span><strong className="text-white">Full-Stack Capabilities:</strong> Generate frontend, backend, databases, and APIs all in one place</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-white">▸</span>
                                                <span><strong className="text-white">Real-time Preview:</strong> See your application running immediately with live updates</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-white">▸</span>
                                                <span><strong className="text-white">Seamless Deployment:</strong> One-click transfer to BackBench for GitHub deployment</span>
                                            </li>
                                        </ul>
                                    </section>

                                    {/* How it works */}
                                    <section>
                                        <h3 className="text-xl font-black uppercase tracking-wider mb-3 text-white">
                                            🚀 How It Works
                                        </h3>
                                        <div className="space-y-4">
                                            <div className="bg-white/10 p-4 border-l-4 border-white">
                                                <div className="font-black text-white mb-2">STEP 1: Describe Your Idea</div>
                                                <p className="text-white/80 text-sm">Simply chat with AI and describe what you want to build. Be as detailed or as simple as you like.</p>
                                            </div>
                                            <div className="bg-white/10 p-4 border-l-4 border-white">
                                                <div className="font-black text-white mb-2">STEP 2: AI Generates Code</div>
                                                <p className="text-white/80 text-sm">Watch as AI creates your entire application - components, pages, logic, styling, everything.</p>
                                            </div>
                                            <div className="bg-white/10 p-4 border-l-4 border-white">
                                                <div className="font-black text-white mb-2">STEP 3: Edit &amp; Refine</div>
                                                <p className="text-white/80 text-sm">Make changes directly in the code editor or ask AI to modify anything you want.</p>
                                            </div>
                                            <div className="bg-white/10 p-4 border-l-4 border-white">
                                                <div className="font-black text-white mb-2">STEP 4: Deploy to BackBench</div>
                                                <p className="text-white/80 text-sm">Click the BackBench button to upload your project and deploy it to GitHub with one click.</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* Key Features */}
                                    <section>
                                        <h3 className="text-xl font-black uppercase tracking-wider mb-3 text-white">
                                            ✨ Key Features
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div className="bg-white/5 p-3 border border-white/20">
                                                <div className="font-bold text-white mb-1">🤖 AI-Powered</div>
                                                <p className="text-xs text-white/70">Multiple AI providers (Google, OpenAI, Anthropic, etc.)</p>
                                            </div>
                                            <div className="bg-white/5 p-3 border border-white/20">
                                                <div className="font-bold text-white mb-1">⚡ WebContainer</div>
                                                <p className="text-xs text-white/70">Run Node.js directly in your browser</p>
                                            </div>
                                            <div className="bg-white/5 p-3 border border-white/20">
                                                <div className="font-bold text-white mb-1">📝 Code Editor</div>
                                                <p className="text-xs text-white/70">Full-featured editor with syntax highlighting</p>
                                            </div>
                                            <div className="bg-white/5 p-3 border border-white/20">
                                                <div className="font-bold text-white mb-1">🎨 Live Preview</div>
                                                <p className="text-xs text-white/70">See changes instantly in real-time</p>
                                            </div>
                                            <div className="bg-white/5 p-3 border border-white/20">
                                                <div className="font-bold text-white mb-1">💾 File Management</div>
                                                <p className="text-xs text-white/70">Browse, edit, and organize project files</p>
                                            </div>
                                            <div className="bg-white/5 p-3 border border-white/20">
                                                <div className="font-bold text-white mb-1">🚢 GitHub Deploy</div>
                                                <p className="text-xs text-white/70">Automatic deployment via BackBench</p>
                                            </div>
                                        </div>
                                    </section>

                                    {/* BackBench Integration */}
                                    <section>
                                        <h3 className="text-xl font-black uppercase tracking-wider mb-3 text-white">
                                            🔗 BackBench Integration
                                        </h3>
                                        <p className="text-white/80 leading-relaxed mb-3">
                                            BackBench is your deployment hub that manages projects created in WORKSPACE:
                                        </p>
                                        <ul className="space-y-2 text-white/80">
                                            <li className="flex items-start gap-2">
                                                <span className="text-white">▸</span>
                                                <span><strong className="text-white">Project Management:</strong> Organize all your generated applications</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-white">▸</span>
                                                <span><strong className="text-white">GitHub Integration:</strong> Automatic repository creation and deployment</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-white">▸</span>
                                                <span><strong className="text-white">Real-time Sync:</strong> WebSocket-based file synchronization</span>
                                            </li>
                                            <li className="flex items-start gap-2">
                                                <span className="text-white">▸</span>
                                                <span><strong className="text-white">Analytics:</strong> Track deployments and application metrics</span>
                                            </li>
                                        </ul>
                                    </section>

                                    {/* Perfect for */}
                                    <section>
                                        <h3 className="text-xl font-black uppercase tracking-wider mb-3 text-white">
                                            👥 Perfect For
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                            <div className="text-center p-4 bg-white/5">
                                                <div className="text-2xl mb-2">💼</div>
                                                <div className="font-bold text-white mb-1">Developers</div>
                                                <p className="text-xs text-white/70">Rapid prototyping and MVPs</p>
                                            </div>
                                            <div className="text-center p-4 bg-white/5">
                                                <div className="text-2xl mb-2">🎨</div>
                                                <div className="font-bold text-white mb-1">Designers</div>
                                                <p className="text-xs text-white/70">Turn ideas into working demos</p>
                                            </div>
                                            <div className="text-center p-4 bg-white/5">
                                                <div className="text-2xl mb-2">🚀</div>
                                                <div className="font-bold text-white mb-1">Entrepreneurs</div>
                                                <p className="text-xs text-white/70">Launch products faster</p>
                                            </div>
                                        </div>
                                    </section>
                                </div>

                                <div className="mt-8 flex justify-center gap-4">
                                    <button
                                        onClick={onClose}
                                        className="px-6 py-3 bg-white text-black font-black uppercase tracking-wider hover:bg-black hover:text-white border-2 border-white transition-all"
                                    >
                                        Got It!
                                    </button>
                                </div>
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}
