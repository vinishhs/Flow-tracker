"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3 } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface CategoryTrend {
    month: string;
    category: string;
    total_spent: number;
}

interface GlobalStats {
    total_income: number;
    total_expenses: number;
    total_settled: number;
    total_lent: number;
    net_savings: number;
    tracking_since: string;
    last_updated: string;
}

export function TrendsDashboard({ onBack }: { onBack: () => void }) {
    const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([]);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [categoryItems, setCategoryItems] = useState<Record<string, any[]>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);
    const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const userId = '00000000-0000-0000-0000-000000000000'; // Fallback

                const [categoryRes, globalRes, transactionsRes] = await Promise.all([
                    supabase.from('category_spending_trends').select('*').eq('user_id', userId).order('month', { ascending: true }),
                    supabase.from('global_financial_stats').select('*').eq('user_id', userId).single(),
                    supabase.from('transactions').select('category, amount, recipient_name, transaction_type').eq('user_id', userId).order('transaction_date', { ascending: false }).limit(300)
                ]);

                if (categoryRes.data) setCategoryTrends(categoryRes.data);
                if (globalRes.data) setGlobalStats(globalRes.data);

                if (transactionsRes.data) {
                    const grouped: Record<string, any[]> = {};
                    transactionsRes.data.forEach(tx => {
                        const isLending = tx.category.toUpperCase().includes("LENT") || tx.category.toUpperCase().includes("LEND");
                        const catKey = isLending ? "LENT" : tx.category;

                        if (tx.transaction_type !== 'expense' && !isLending) return;
                        if (!grouped[catKey]) grouped[catKey] = [];
                        if (grouped[catKey].length < 5) {
                            grouped[catKey].push({
                                description: tx.recipient_name || "Misc",
                                amount: tx.amount
                            });
                        }
                    });
                    setCategoryItems(grouped);
                }

            } catch (error) {
                console.error("Error fetching trend data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xl">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-4" />
                    <p className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-400">Syncing Intelligence...</p>
                </div>
            </div>
        );
    }

    const topCategories = getTopCategories(categoryTrends);

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-2xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-h-screen py-12 px-6 flex items-center justify-center"
            >
                <div className="w-full max-w-4xl border border-white/20 bg-neutral-900/60 rounded-[3rem] shadow-2xl relative overflow-hidden">
                    {/* Header Decoration */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />

                    {/* Close Button */}
                    <button
                        onClick={onBack}
                        className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all z-10"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>

                    <div className="p-8 md:p-14">
                        <header className="mb-14 text-center">
                            <div className="flex items-center justify-center gap-3 mb-4">
                                <BarChart3 className="w-5 h-5 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">Insights Dashboard</span>
                            </div>
                            <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter mb-2 uppercase">Category Dominance</h1>
                            <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest">Where your money flows</p>
                        </header>

                        <div className="max-w-2xl mx-auto">
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-12 relative">
                                <div className="space-y-8">
                                    {topCategories.map((cat, idx) => {
                                        const isLending = cat.category === "LENT";
                                        return (
                                            <div
                                                key={cat.category}
                                                className="space-y-3 group cursor-help transition-all"
                                                onMouseEnter={() => setHoveredCategory(cat.category)}
                                                onMouseLeave={() => setHoveredCategory(null)}
                                                onMouseMove={(e) => setMousePos({ x: e.clientX, y: e.clientY })}
                                            >
                                                <div className="flex justify-between items-end text-[11px] md:text-xs font-black uppercase tracking-widest">
                                                    <span className={`${isLending ? 'text-blue-400' : 'text-neutral-400'} group-hover:text-white transition-colors`}>
                                                        {cat.category}
                                                    </span>
                                                    <span className="text-white text-lg md:text-xl tracking-tighter">₹{cat.total_spent.toLocaleString()}</span>
                                                </div>
                                                <div className="h-2.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <motion.div
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${cat.percent}%` }}
                                                        className={`h-full ${isLending ? 'bg-blue-500' : 'bg-emerald-500'} opacity-50 group-hover:opacity-100 transition-opacity`}
                                                        transition={{ duration: 1, delay: idx * 0.1 }}
                                                    />
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Deep-Dive Tooltip */}
                                <AnimatePresence>
                                    {hoveredCategory && categoryItems[hoveredCategory] && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            style={{
                                                position: 'fixed',
                                                left: mousePos.x + 20,
                                                top: mousePos.y - 40,
                                                zIndex: 1000
                                            }}
                                            className="bg-neutral-950/90 border border-white/10 p-5 rounded-2xl backdrop-blur-xl shadow-2xl min-w-[220px] pointer-events-none"
                                        >
                                            <div className="mb-3 border-b border-white/5 pb-2 flex justify-between items-end">
                                                <div>
                                                    <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-0.5">Category Deep-Dive</p>
                                                    <p className={`text-xs font-black tracking-tight ${hoveredCategory === "LENT" ? 'text-blue-400' : 'text-white'}`}>
                                                        {hoveredCategory}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-2.5 mb-4">
                                                {categoryItems[hoveredCategory].map((item, i) => (
                                                    <div key={i} className="flex justify-between items-center gap-4">
                                                        <span className="text-[10px] font-bold text-neutral-400 truncate max-w-[140px]">
                                                            {item.description}
                                                        </span>
                                                        <span className="text-[10px] font-mono font-black text-neutral-200">
                                                            ₹{item.amount.toLocaleString()}
                                                        </span>
                                                    </div>
                                                ))}
                                                {categoryItems[hoveredCategory].length === 0 && (
                                                    <p className="text-[10px] font-bold text-neutral-600 italic">No detailed records found</p>
                                                )}
                                            </div>

                                            <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                                <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Metric Total</span>
                                                <span className={`text-xs font-black ${hoveredCategory === "LENT" ? 'text-blue-400' : 'text-emerald-500'}`}>
                                                    ₹{(topCategories.find(c => c.category === hoveredCategory)?.total_spent || 0).toLocaleString()}
                                                </span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>

                            <div className="mt-12 text-center">
                                <button
                                    onClick={onBack}
                                    className="px-8 py-4 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl"
                                >
                                    Back to Workspace
                                </button>
                            </div>
                        </div>

                        {/* Footer */}
                        <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-600">
                                Analysis derived from your recent snapshots
                            </p>
                            <div className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-400">Live Financial Engine</span>
                            </div>
                        </footer>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

function getTopCategories(data: CategoryTrend[]) {
    const agg = new Map<string, number>();
    let total = 0;
    data.forEach(d => {
        const isLending = d.category.toUpperCase().includes("LENT") || d.category.toUpperCase().includes("LEND");
        const normalizedCat = isLending ? "LENT" : d.category;

        agg.set(normalizedCat, (agg.get(normalizedCat) || 0) + d.total_spent);
        total += d.total_spent;
    });

    return Array.from(agg.entries())
        .map(([category, total_spent]) => ({
            category,
            total_spent,
            percent: total > 0 ? (total_spent / total) * 100 : 0
        }))
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 10); // Show more categories since it's full screen
}
