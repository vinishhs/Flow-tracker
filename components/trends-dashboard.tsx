"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, BarChart3, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { ProcessResult } from "@/lib/services/parser";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';


interface MergedCategoryData {
    category: string;
    saved: number;
    unsaved: number;
    total: number;
}

export function TrendsDashboard({
    isOpen,
    onClose,
    currentSessionData,
    savedMonthlyTotals
}: {
    isOpen: boolean,
    onClose: () => void,
    currentSessionData: ProcessResult | null,
    savedMonthlyTotals: Record<string, number>
}) {
    // --- Core Logic: Merge Saved + Unsaved Data ---
    const chartData = useMemo(() => {
        const merged = new Map<string, MergedCategoryData>();

        // 1. Process Saved Data (from props - pre-aggregated monthly totals)
        Object.entries(savedMonthlyTotals).forEach(([category, amount]) => {
            const isLending = category.toUpperCase().includes("LENT") || category.toUpperCase().includes("LEND");
            const catKey = isLending ? "LENT" : category;

            const existing = merged.get(catKey) || { category: catKey, saved: 0, unsaved: 0, total: 0 };
            existing.saved += amount;
            existing.total += amount;
            merged.set(catKey, existing);
        });

        // 2. Process Current Session Data (Unsaved)
        if (currentSessionData && currentSessionData.recognized) {
            currentSessionData.recognized.forEach(tx => {
                // FILTER: Exclude Income (Money In)
                if (tx.transaction_type === 'income') return;

                const isLending = tx.category.toUpperCase().includes("LENT") || tx.category.toUpperCase().includes("LEND");
                const catKey = isLending ? "LENT" : tx.category;

                const existing = merged.get(catKey) || { category: catKey, saved: 0, unsaved: 0, total: 0 };
                existing.unsaved += tx.amount;
                existing.total += tx.amount;
                merged.set(catKey, existing);
            });
        }

        // 3. Convert to Array & Sort by Total
        return Array.from(merged.values())
            .sort((a, b) => b.total - a.total)
            .slice(0, 10); // Top 10 Dominant Categories
    }, [savedMonthlyTotals, currentSessionData]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] overflow-y-auto custom-scrollbar">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-0"
                    />

                    {/* Dashboard Card Container */}
                    <div className="min-h-screen py-12 px-6 flex items-center justify-center pointer-events-none">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            transition={{ type: "spring", damping: 28, stiffness: 220 }}
                            className="w-full max-w-4xl border border-white/20 bg-neutral-900/80 rounded-[3rem] shadow-2xl relative overflow-hidden pointer-events-auto backdrop-blur-3xl"
                        >
                            {/* Header Decoration */}
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] pointer-events-none" />

                            {/* Close Button */}
                            <button
                                onClick={onClose}
                                className="absolute top-8 right-8 p-3 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all z-10"
                            >
                                <X className="w-5 h-5 text-white" />
                            </button>

                            <div className="p-8 md:p-14">
                                <header className="mb-10 text-center">
                                    <div className="flex items-center justify-center gap-3 mb-3">
                                        <BarChart3 className="w-4 h-4 text-emerald-500" />
                                        <span className="text-[9px] font-black uppercase tracking-[0.4em] text-neutral-500">Insights</span>
                                    </div>
                                    <h1 className="text-3xl md:text-4xl font-black text-white tracking-tighter mb-1 uppercase">Category Dominance</h1>
                                    <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-[0.2em]">Projected Impact Analysis</p>
                                </header>

                                <div className="max-w-2xl mx-auto">
                                    <div className="bg-white/[0.02] border border-white/[0.05] rounded-[2rem] p-6 md:p-8 relative min-h-[400px]">
                                        {/* Ghost Pattern Definition */}
                                        <svg style={{ height: 0, width: 0, position: 'absolute' }}>
                                            <defs>
                                                <pattern id="stripe-pattern" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                                    <line x1="0" y1="0" x2="0" y2="8" stroke="currentColor" strokeWidth="4" />
                                                </pattern>
                                                <pattern id="ghost-emerald" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                                    <rect width="8" height="8" fill="#10b981" opacity="0.2" />
                                                    <line x1="0" y1="0" x2="0" y2="8" stroke="#10b981" strokeWidth="2" opacity="0.5" />
                                                </pattern>
                                                <pattern id="ghost-blue" patternUnits="userSpaceOnUse" width="8" height="8" patternTransform="rotate(45)">
                                                    <rect width="8" height="8" fill="#3b82f6" opacity="0.2" />
                                                    <line x1="0" y1="0" x2="0" y2="8" stroke="#3b82f6" strokeWidth="2" opacity="0.5" />
                                                </pattern>
                                            </defs>
                                        </svg>

                                        <ResponsiveContainer width="100%" height={380}>
                                            <BarChart
                                                layout="vertical"
                                                data={chartData}
                                                margin={{ top: 20, right: 30, left: 40, bottom: 5 }}
                                            >
                                                <XAxis type="number" hide />
                                                <YAxis
                                                    dataKey="category"
                                                    type="category"
                                                    width={100}
                                                    tick={{ fill: '#a3a3a3', fontSize: 11, fontWeight: 700, style: { textTransform: 'uppercase' } }}
                                                    axisLine={false}
                                                    tickLine={false}
                                                />
                                                <Tooltip
                                                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                                                    content={({ active, payload }) => {
                                                        if (active && payload && payload.length) {
                                                            const data = payload[0].payload as MergedCategoryData;
                                                            const isLent = data.category === "LENT";
                                                            const colorClass = isLent ? "text-blue-400" : "text-emerald-500";

                                                            return (
                                                                <div className="bg-neutral-950/95 border border-white/10 p-5 rounded-2xl backdrop-blur-xl shadow-2xl min-w-[240px]">
                                                                    <div className="mb-3 border-b border-white/5 pb-2">
                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-neutral-500 mb-0.5">Projected Impact</p>
                                                                        <p className={`text-sm font-black tracking-tight text-white`}>{data.category}</p>
                                                                    </div>
                                                                    <div className="space-y-2">
                                                                        {data.saved > 0 && (
                                                                            <div className="flex justify-between text-xs font-bold text-neutral-400">
                                                                                <span>Saved:</span>
                                                                                <span>₹{data.saved.toLocaleString()}</span>
                                                                            </div>
                                                                        )}
                                                                        {data.unsaved > 0 && (
                                                                            <div className={`flex justify-between text-xs font-bold ${colorClass}`}>
                                                                                <span>Current Note (Unsaved):</span>
                                                                                <span>+₹{data.unsaved.toLocaleString()}</span>
                                                                            </div>
                                                                        )}
                                                                        <div className="pt-2 mt-2 border-t border-white/10 flex justify-between text-sm font-black text-white">
                                                                            <span>Total:</span>
                                                                            <span>₹{data.total.toLocaleString()}</span>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            );
                                                        }
                                                        return null;
                                                    }}
                                                />
                                                {/* Saved Data Bar (Solid) */}
                                                <Bar dataKey="saved" stackId="a" radius={[0, 0, 0, 0]} barSize={24}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell key={`cell-saved-${index}`} fill={entry.category === "LENT" ? "#3b82f6" : "#10b981"} />
                                                    ))}
                                                </Bar>
                                                {/* Unsaved Data Bar (Ghost Pattern) */}
                                                <Bar dataKey="unsaved" stackId="a" radius={[0, 4, 4, 0]} barSize={24}>
                                                    {chartData.map((entry, index) => (
                                                        <Cell
                                                            key={`cell-unsaved-${index}`}
                                                            fill={entry.category === "LENT" ? "url(#ghost-blue)" : "url(#ghost-emerald)"}
                                                        />
                                                    ))}
                                                </Bar>
                                            </BarChart>
                                        </ResponsiveContainer>
                                        {chartData.length === 0 && (
                                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-neutral-600 uppercase tracking-widest">
                                                No transaction data available
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-8 text-center">
                                        <button
                                            onClick={onClose}
                                            className="px-6 py-3 bg-white text-black rounded-full font-black text-[9px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl"
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
                        </motion.div>
                    </div>
                </div>
            )}
        </AnimatePresence>
    );
}
