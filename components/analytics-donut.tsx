"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartData {
    name: string;
    value: number;
    percentage: number;
    color: string;
    items: any[];
    [key: string]: any;
}

const COLORS = [
    "#0d9488", // Deep Teal
    "#a855f7", // Soft Purple
    "#6366f1", // Indigo
    "#f43f5e", // Rose
    "#06b6d4", // Cyan
    "#64748b", // Slate
];

const SPECIAL_COLORS: Record<string, string> = {
    "LEND TO": "#3b82f6", // Electric Blue
    "OTHERS": "#f59e0b",  // Amber
};

export function AnalyticsDonut({ data }: { data: any[] }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const total = data.reduce((acc, curr) => acc + curr.total, 0);

    const chartData: ChartData[] = data.map((item, index) => {
        const color = SPECIAL_COLORS[item.category] || COLORS[index % COLORS.length];
        // Sort items by amount descending and take top 5
        const topItems = [...(item.items || [])]
            .sort((a, b) => b.amount - a.amount)
            .slice(0, 5);

        return {
            name: item.category,
            value: item.total,
            percentage: Math.round((item.total / total) * 100),
            color,
            items: topItems
        };
    }).sort((a, b) => b.value - a.value);

    return (
        <div className="bg-neutral-900/10 border border-white/5 rounded-[2.5rem] p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-12">
                {/* Donut Chart Side */}
                <div className="w-full md:w-1/2 h-[300px] relative">
                    {isMounted && (
                        <>
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={chartData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={85}
                                        outerRadius={110}
                                        paddingAngle={5}
                                        dataKey="value"
                                        animationBegin={0}
                                        animationDuration={1500}
                                        stroke="none"
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                className="hover:opacity-80 transition-opacity cursor-pointer drop-shadow-[0_0_8px_rgba(0,0,0,0.5)]"
                                                style={{ filter: `drop-shadow(0 0 12px ${entry.color}44)` }}
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const d = payload[0].payload;
                                                const isLending = d.name.toUpperCase().includes("LEND");

                                                return (
                                                    <div className="bg-neutral-950/90 border border-white/10 p-5 rounded-2xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[200px] animate-in fade-in zoom-in-95 duration-200">
                                                        <div className="flex justify-between items-center mb-4 border-bottom border-white/5 pb-2">
                                                            <div>
                                                                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Category Breakdown</p>
                                                                <p className={`text-sm font-black tracking-tight ${isLending ? 'text-blue-400' : 'text-white'}`}>{d.name}</p>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-[9px] font-black text-neutral-500 uppercase">{d.percentage}%</p>
                                                                <p className="text-xs font-mono font-bold text-neutral-300">₹{d.value.toLocaleString()}</p>
                                                            </div>
                                                        </div>

                                                        <div className="space-y-2.5 mb-4">
                                                            {d.items.map((item: any, i: number) => (
                                                                <div key={i} className="flex justify-between items-center gap-4 group">
                                                                    <span className="text-[10px] font-bold text-neutral-400 truncate max-w-[120px]">
                                                                        {item.detail || "Misc"}
                                                                    </span>
                                                                    <span className={`text-[10px] font-mono font-black ${isLending ? 'text-blue-500/80' : 'text-neutral-200'}`}>
                                                                        ₹{item.amount.toLocaleString()}
                                                                    </span>
                                                                </div>
                                                            ))}
                                                        </div>

                                                        <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Total</span>
                                                            <span className={`text-xs font-black ${isLending ? 'text-blue-400' : 'text-emerald-500'}`}>
                                                                ₹{d.value.toLocaleString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Label */}
                            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-neutral-500 mb-1">Total Out</span>
                                <span className="text-3xl font-black text-white">₹{total.toLocaleString()}</span>
                            </div>
                        </>
                    )}
                </div>

                {/* Legend Side */}
                <div className="w-full md:w-1/2 space-y-4">
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 mb-6">Distribution Overview</h4>
                    <div className="grid grid-cols-1 gap-3">
                        {chartData.map((item, idx) => (
                            <div
                                key={idx}
                                className="flex items-center justify-between group cursor-default"
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-2.5 h-2.5 rounded-full shadow-lg"
                                        style={{ backgroundColor: item.color, boxShadow: `0 0 12px ${item.color}66` }}
                                    />
                                    <span className="text-xs font-bold text-neutral-100 uppercase tracking-tight group-hover:text-white transition-colors">
                                        {item.name}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4">
                                    <div className="h-[1px] w-12 bg-neutral-800 group-hover:bg-neutral-700 transition-colors hidden md:block" />
                                    <span className="text-xs font-mono font-black text-neutral-400 group-hover:text-neutral-200 transition-colors">
                                        {item.percentage}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
