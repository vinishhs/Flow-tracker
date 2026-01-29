"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Copy, Check, Zap, Shield, TrendingUp, Sparkles } from "lucide-react";
import { parseAppleNote } from "@/lib/services/parser";

export default function LandingPage() {
    const [demoInput, setDemoInput] = useState("");
    const [copied, setCopied] = useState(false);

    // Demo Logic: Process the text in real-time
    const demoResult = useMemo(() => {
        if (!demoInput.trim()) return [];
        const { recognized } = parseAppleNote(demoInput);

        // Aggregate by category
        const map = new Map<string, { total: number, color: string }>();
        recognized.forEach(tx => {
            const existing = map.get(tx.category) || { total: 0, color: tx.category === "LENT" ? "bg-blue-500" : "bg-emerald-500" };
            existing.total += tx.amount;
            map.set(tx.category, existing);
        });

        return Array.from(map.entries()).map(([category, data]) => ({
            category,
            ...data
        })).sort((a, b) => b.total - a.total);
    }, [demoInput]);

    const maxDemoTotal = Math.max(...demoResult.map(d => d.total), 1000);

    const sampleNote = `17 Jan
Travel ₹200
Lunch ₹500
lent to Rahul ₹1000
Social ₹300`;

    const handleCopySample = () => {
        setDemoInput(sampleNote);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white selection:bg-emerald-500/30 overflow-x-hidden font-sans">
            {/* BACKGROUND EFFECTS */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
            </div>

            {/* NAVBAR */}
            <nav className="fixed top-0 left-0 right-0 z-[100] px-6 py-6 transition-all duration-300">
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full flex justify-between items-center"
                >
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black italic text-black text-xl">F</div>
                        <span className="text-xl font-black tracking-tighter uppercase text-white">Flow</span>
                    </div>

                    <div className="flex items-center gap-6">
                        <Link href="/dashboard" className="text-sm font-bold text-neutral-400 hover:text-white transition-colors">
                            Explore
                        </Link>
                        <Link
                            href="/dashboard"
                            className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-black uppercase tracking-widest rounded-xl transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                        >
                            Sign In
                        </Link>
                    </div>
                </motion.div>
            </nav>

            {/* HERO SECTION */}
            <main className="max-w-5xl mx-auto px-6 pt-40 pb-20 relative z-10">
                <div className="text-center mb-20">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 mb-6"
                    >
                        <Sparkles className="w-3 h-3" /> The World's Minimalist Tracker
                    </motion.div>

                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-4xl md:text-6xl font-black tracking-tight mb-8 leading-[1.1] text-white"
                    >
                        Master Your Money.<br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-emerald-600">No Spreadsheets Required.</span>
                    </motion.h1>

                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-base md:text-lg text-neutral-400 max-w-2xl mx-auto mb-10 leading-relaxed"
                    >
                        Paste your transaction notes. We handle the math, categorization, and projections instantly with Flow Intelligence.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="flex flex-col md:flex-row items-center justify-center gap-4"
                    >
                        <Link
                            href="/dashboard"
                            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-400 text-black rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                        >
                            Get Started <ChevronRight className="w-4 h-4" />
                        </Link>
                    </motion.div>
                </div>

                {/* DEMO LITE SECTION */}
                <motion.section
                    initial={{ opacity: 0, y: 40 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-40"
                >
                    {/* Left: Editor */}
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 backdrop-blur-sm relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-6">
                            <button
                                onClick={handleCopySample}
                                className="flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-white/10 rounded-xl hover:border-emerald-500/50 transition-all text-[10px] font-bold uppercase tracking-widest text-white"
                            >
                                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                                {copied ? "Pasted!" : "Paste Sample"}
                            </button>
                        </div>

                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500 mb-6 flex items-center gap-2">
                            <Zap className="w-3 h-3" /> Interactive Input
                        </h3>

                        <textarea
                            value={demoInput}
                            onChange={(e) => setDemoInput(e.target.value)}
                            placeholder="Paste sample notes like: ₹500 for lunch..."
                            className="w-full h-64 bg-transparent font-mono text-sm outline-none resize-none placeholder:text-neutral-700 text-white"
                        />

                        <div className="absolute bottom-6 left-8 right-8 h-px bg-white/5" />
                        <div className="mt-8 flex items-center justify-between">
                            <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Parser Active</span>
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse [animation-delay:200ms]" />
                            </div>
                        </div>
                    </div>

                    {/* Right: Visualization */}
                    <div className="bg-neutral-900/50 border border-white/5 rounded-[2.5rem] p-8 flex flex-col justify-center relative overflow-hidden group">
                        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                        <h3 className="text-xs font-black uppercase tracking-[0.3em] text-neutral-500 mb-10 flex items-center gap-2">
                            <TrendingUp className="w-3 h-3" /> Ghost Impact Logic
                        </h3>

                        <div className="space-y-8 relative z-10">
                            {demoResult.length === 0 ? (
                                <div className="h-64 flex flex-col items-center justify-center text-center space-y-4">
                                    <div className="p-4 bg-neutral-800 rounded-full border border-white/5">
                                        <Zap className="w-6 h-6 text-neutral-600" />
                                    </div>
                                    <p className="text-sm text-neutral-600 font-bold uppercase tracking-widest">
                                        Start typing to see<br />instant categorization
                                    </p>
                                </div>
                            ) : (
                                <AnimatePresence mode="popLayout">
                                    {demoResult.map((res) => (
                                        <motion.div
                                            key={res.category}
                                            layout
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, scale: 0.9 }}
                                            className="space-y-3"
                                        >
                                            <div className="flex justify-between items-end">
                                                <span className="text-xs font-black uppercase tracking-widest text-white">{res.category}</span>
                                                <span className="text-lg font-black font-mono text-white">₹{res.total.toLocaleString()}</span>
                                            </div>
                                            <div className="h-4 bg-neutral-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${(res.total / maxDemoTotal) * 100}%` }}
                                                    className={`h-full ${res.color} shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all`}
                                                />
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            )}
                        </div>

                        {demoResult.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-12 pt-8 border-t border-white/5 flex items-center gap-4"
                            >
                                <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                    <Shield className="w-5 h-5 text-emerald-500" />
                                </div>
                                <p className="text-[10px] font-bold text-neutral-500 uppercase leading-relaxed tracking-widest">
                                    Intelligence verified. All your<br />spend impact is projected.
                                </p>
                            </motion.div>
                        )}
                    </div>
                </motion.section>

                {/* FEATURE GRID */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-40">
                    <FeatureCard
                        icon={<Zap className="w-6 h-6 text-emerald-500" />}
                        title="The Parser"
                        desc="Type like you text. No forms, no friction. Just paste your notes."
                        delay={0.4}
                    />
                    <FeatureCard
                        icon={<TrendingUp className="w-6 h-6 text-blue-500" />}
                        title="Ghost Projections"
                        desc="See the impact of your spend before you commit to the archive."
                        delay={0.5}
                    />
                    <FeatureCard
                        icon={<Shield className="w-6 h-6 text-emerald-500" />}
                        title="Debt Recovery"
                        desc="Smart tracking for what you've lent and what's owed to you."
                        delay={0.6}
                    />
                </section>

                {/* FOOTER CTA */}
                <motion.section
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="text-center bg-gradient-to-b from-emerald-500/10 to-transparent p-20 rounded-[4rem] border border-emerald-500/10"
                >
                    <h2 className="text-2xl md:text-4xl font-black tracking-tight mb-8 text-white">Ready to take control?</h2>
                    <Link
                        href="/dashboard"
                        className="inline-block px-8 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.4em] hover:scale-110 active:scale-95 transition-all shadow-white/10 shadow-2xl"
                    >
                        ENTER THE FLOW
                    </Link>
                </motion.section>
            </main>

            {/* FOOTER */}
            <footer className="border-t border-white/5 py-12 px-6">
                <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-emerald-500 rounded flex items-center justify-center font-black italic text-black text-sm">F</div>
                        <span className="text-sm font-black uppercase tracking-tighter text-white">Flow</span>
                    </div>
                    <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-[0.2em]">
                        © 2026 FLOW INTELLIGENCE SYSTEMS. ALL RIGHTS RESERVED.
                    </p>
                </div>
            </footer>
        </div>
    );
}

function FeatureCard({ icon, title, desc, delay }: any) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay, duration: 0.5 }}
            className="p-8 bg-neutral-900/30 border border-white/5 rounded-[2rem] hover:border-emerald-500/20 transition-all group"
        >
            <div className="mb-6 p-3 bg-neutral-900 rounded-2xl w-fit border border-white/10 group-hover:border-emerald-500/30 transition-all">
                {icon}
            </div>
            <h3 className="text-lg font-black mb-3 text-white">{title}</h3>
            <p className="text-sm text-neutral-400 leading-relaxed font-medium">{desc}</p>
        </motion.div>
    );
}
