"use client";

import { useEffect, useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { motion, AnimatePresence } from "framer-motion";

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
    const [hoveredData, setHoveredData] = useState<ChartData | null>(null);

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
                <div
                    className="w-full md:w-1/2 h-[300px] relative"
                    onMouseLeave={() => setHoveredData(null)}
                >
                    {/* Fixed Tooltip Overlay - Top Left */}
                    <AnimatePresence>
                        {hoveredData && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute top-0 left-0 z-50 pointer-events-none"
                            >
                                <div className="bg-neutral-950/90 border border-white/10 p-5 rounded-2xl backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] min-w-[200px]">
                                    <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                        <div>
                                            <p className="text-[9px] font-black uppercase tracking-[0.2em] text-neutral-500">Category Breakdown</p>
                                            <p className={`text-sm font-black tracking-tight ${hoveredData.name.toUpperCase().includes("LEND") ? 'text-blue-400' : 'text-white'}`}>{hoveredData.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-neutral-500 uppercase">{hoveredData.percentage}%</p>
                                            <p className="text-xs font-mono font-bold text-neutral-300">₹{hoveredData.value.toLocaleString()}</p>
                                        </div>
                                    </div>

                                    <div className="space-y-2.5 mb-4 max-h-[120px] overflow-hidden">
                                        {hoveredData.items.map((item: any, i: number) => (
                                            <div key={i} className="flex justify-between items-center gap-4 group">
                                                <span className="text-[10px] font-bold text-neutral-400 truncate max-w-[120px]">
                                                    {item.detail || "Misc"}
                                                </span>
                                                <span className={`text-[10px] font-mono font-black ${hoveredData.name.toUpperCase().includes("LEND") ? 'text-blue-500/80' : 'text-neutral-200'}`}>
                                                    ₹{item.amount.toLocaleString()}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="pt-3 border-t border-white/5 flex justify-between items-center">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-neutral-600">Total</span>
                                        <span className={`text-xs font-black ${hoveredData.name.toUpperCase().includes("LEND") ? 'text-blue-400' : 'text-emerald-500'}`}>
                                            ₹{hoveredData.value.toLocaleString()}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

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
                                        onMouseLeave={() => setHoveredData(null)}
                                    >
                                        {chartData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.color}
                                                className="cursor-pointer transition-all duration-300 hover:opacity-100 opacity-80"
                                                stroke={hoveredData?.name === entry.name ? '#fff' : 'none'}
                                                strokeWidth={2}
                                                onMouseEnter={() => setHoveredData(entry)}
                                                style={{
                                                    filter: hoveredData?.name === entry.name ? `drop-shadow(0 0 12px ${entry.color}88)` : `drop-shadow(0 0 8px ${entry.color}44)`,
                                                    transform: hoveredData?.name === entry.name ? 'scale(1.05)' : 'scale(1)',
                                                    transformOrigin: 'center center' // This might not work perfectly in SVG but worth a shot, otherwise scale is ignored
                                                }}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ResponsiveContainer>

                            {/* Center Label */}
                            <div className={`absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-opacity duration-300 ${hoveredData ? 'opacity-20 blur-sm' : 'opacity-100'}`}>
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
