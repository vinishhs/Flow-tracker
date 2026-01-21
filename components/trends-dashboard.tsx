"use client";

import { useState, useEffect } from "react";
import {
    AreaChart, Area, BarChart, Bar,
    XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    XAxisProps,
    YAxisProps
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import {
    TrendingUp, TrendingDown, DollarSign, Wallet,
    Activity, ArrowLeft, X, BarChart3, TrendingUpDown
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface MonthlySummary {
    month: string;
    total_income: number;
    total_expenses: number;
    net_cash_flow: number;
    total_settled: number;
}

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

const COLORS = ['#10b981', '#f43f5e', '#3b82f6', '#f59e0b', '#8b5cf6', '#ec4899'];

export function TrendsDashboard({ onBack }: { onBack: () => void }) {
    const [summary, setSummary] = useState<MonthlySummary[]>([]);
    const [categoryTrends, setCategoryTrends] = useState<CategoryTrend[]>([]);
    const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                const userId = '00000000-0000-0000-0000-000000000000'; // Fallback

                const [summaryRes, categoryRes, globalRes] = await Promise.all([
                    supabase.from('monthly_financial_summary').select('*').eq('user_id', userId).order('month', { ascending: true }),
                    supabase.from('category_spending_trends').select('*').eq('user_id', userId).order('month', { ascending: true }),
                    supabase.from('global_financial_stats').select('*').eq('user_id', userId).single()
                ]);

                if (summaryRes.data) setSummary(summaryRes.data.map(d => ({
                    ...d,
                    month: new Date(d.month).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' })
                })));

                if (categoryRes.data) setCategoryTrends(categoryRes.data);
                if (globalRes.data) setGlobalStats(globalRes.data);

            } catch (error) {
                console.error("Error fetching trend data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const recoveryRate = globalStats ? (globalStats.total_lent > 0 ? (globalStats.total_settled / globalStats.total_lent) * 100 : 100) : 0;

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

    return (
        <div className="fixed inset-0 z-[100] overflow-y-auto bg-black/40 backdrop-blur-2xl">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="min-h-screen py-12 px-6"
            >
                <div className="max-w-6xl mx-auto border border-white/20 bg-neutral-900/60 rounded-[3rem] shadow-2xl relative overflow-hidden">
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
                        <header className="mb-12">
                            <div className="flex items-center gap-3 mb-4">
                                <BarChart3 className="w-5 h-5 text-emerald-500" />
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500">Insights Dashboard</span>
                            </div>
                            <h1 className="text-5xl font-black text-white tracking-tighter mb-2">Command Center</h1>
                            <p className="text-sm text-neutral-500 font-bold uppercase tracking-widest">Aggregate Financial Intelligence</p>
                        </header>

                        {/* Top Tier: Big Picture Cards */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                            <StatsCard
                                label="Net Savings Pulse"
                                val={`₹${(globalStats?.net_savings || 0).toLocaleString()}`}
                                sub="Current Balance"
                                icon={<DollarSign className="w-4 h-4 text-emerald-400" />}
                            />
                            <StatsCard
                                label="Recovery Tracker"
                                val={`${Math.round(recoveryRate)}%`}
                                sub={`${(globalStats?.total_settled || 0).toLocaleString()} Recovered / ${(globalStats?.total_lent || 0).toLocaleString()} Lent`}
                                progress={recoveryRate}
                                icon={<Activity className="w-4 h-4 text-blue-400" />}
                            />
                            <StatsCard
                                label="Cash Flow"
                                val={`₹${((globalStats?.total_income || 0) + (globalStats?.total_expenses || 0)).toLocaleString()}`}
                                sub={`+${(globalStats?.total_income || 0).toLocaleString()} / -${(globalStats?.total_expenses || 0).toLocaleString()}`}
                                icon={<TrendingUpDown className="w-4 h-4 text-amber-400" />}
                            />
                        </div>

                        {/* Middle Tier: The Timeline */}
                        <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-10 mb-12">
                            <div className="flex justify-between items-center mb-10">
                                <div>
                                    <h3 className="text-sm font-black uppercase tracking-widest text-white">Monthly Cash Flow</h3>
                                    <p className="text-[10px] text-neutral-500 font-bold mt-1 uppercase tracking-widest">Net performance across time</p>
                                </div>
                                <div className="flex gap-4">
                                    <LegendItem label="Positive Flow" color="#10b981" />
                                    <LegendItem label="Burn" color="#f43f5e" />
                                </div>
                            </div>
                            <div className="h-[400px] w-full">
                                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                    <AreaChart
                                        data={summary}
                                        margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
                                    >
                                        <defs>
                                            <linearGradient id="colorNet" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                            </linearGradient>
                                            <linearGradient id="colorNetNeg" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                                        <XAxis
                                            dataKey="month"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#666', fontSize: 10, fontWeight: 900 }}
                                            dy={10}
                                        />
                                        <YAxis
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#666', fontSize: 10, fontWeight: 900 }}
                                        />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area
                                            type="monotone"
                                            dataKey="net_cash_flow"
                                            stroke="#10b981"
                                            strokeWidth={4}
                                            fillOpacity={1}
                                            fill="url(#colorNet)"
                                            baseValue={0}
                                        />
                                        {/* Overlay negative red line logic would be complex with single stroke, using basic color coding for now */}
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Bottom Tier: Category Breakdown */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                            <div className="bg-white/[0.03] border border-white/[0.08] rounded-[2.5rem] p-8 md:p-10">
                                <h3 className="text-sm font-black uppercase tracking-widest text-white mb-8">Category Dominance</h3>
                                <div className="space-y-6">
                                    {getTopCategories(categoryTrends).map((cat, idx) => (
                                        <div key={cat.category} className="space-y-2">
                                            <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                                                <span className="text-neutral-400">{cat.category}</span>
                                                <span className="text-white">₹{cat.total_spent.toLocaleString()}</span>
                                            </div>
                                            <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${cat.percent}%` }}
                                                    className="h-full bg-emerald-500/50"
                                                    transition={{ duration: 1, delay: idx * 0.1 }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-col justify-center gap-8">
                                <div className="p-8 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-emerald-500 mb-2">Spending Efficiency</h4>
                                    <p className="text-lg font-bold text-neutral-200">
                                        Your top category <span className="text-white underline decoration-emerald-500/50">{getTopCategories(categoryTrends)[0]?.category}</span> accounts for <span className="text-white">{Math.round(getTopCategories(categoryTrends)[0]?.percent || 0)}%</span> of your total outgoing flow.
                                    </p>
                                </div>
                                <div className="text-center md:text-left">
                                    <button
                                        onClick={onBack}
                                        className="px-8 py-4 bg-white text-black rounded-full font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-all shadow-xl"
                                    >
                                        Back to Workspace
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Footer */}
                        <footer className="mt-20 pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-neutral-600">
                                Analysis based on data from {globalStats ? new Date(globalStats.tracking_since).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'} to {globalStats ? new Date(globalStats.last_updated).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '---'}
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

function StatsCard({ label, val, sub, icon, progress }: any) {
    return (
        <div className="bg-white/5 border border-white/20 p-6 md:p-8 rounded-[2rem] transition-all hover:bg-white/[0.08] group relative overflow-hidden">
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                    <div className="p-2.5 rounded-xl bg-black/40 border border-white/5 group-hover:border-white/20 transition-all">
                        {icon}
                    </div>
                </div>
                <h4 className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">{label}</h4>
                <div className="text-2xl font-black text-white mb-2">{val}</div>
                <p className="text-[9px] font-bold text-neutral-600 uppercase tracking-widest">{sub}</p>

                {progress !== undefined && (
                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500" style={{ width: `${progress}%` }} />
                    </div>
                )}
            </div>
            <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

function LegendItem({ label, color }: { label: string, color: string }) {
    return (
        <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-black uppercase tracking-widest text-neutral-400">{label}</span>
        </div>
    );
}

function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-neutral-900/90 border border-white/10 p-4 rounded-2xl backdrop-blur-xl shadow-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-2">{label}</p>
                {payload.map((item: any, idx: number) => (
                    <div key={idx} className="flex items-center justify-between gap-8">
                        <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{item.name === 'net_cash_flow' ? 'Net Flow' : item.name}</span>
                        <span className={`text-xs font-black ${item.value >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            ₹{item.value.toLocaleString()}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
}

function getTopCategories(data: CategoryTrend[]) {
    const agg = new Map<string, number>();
    let total = 0;
    data.forEach(d => {
        agg.set(d.category, (agg.get(d.category) || 0) + d.total_spent);
        total += d.total_spent;
    });

    return Array.from(agg.entries())
        .map(([category, total_spent]) => ({
            category,
            total_spent,
            percent: (total_spent / total) * 100
        }))
        .sort((a, b) => b.total_spent - a.total_spent)
        .slice(0, 5);
}
