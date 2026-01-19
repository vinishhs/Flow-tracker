"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

interface ChartData {
    name: string;
    value: number;
    percentage: number;
    color: string;
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
    const total = data.reduce((acc, curr) => acc + curr.total, 0);

    const chartData: ChartData[] = data.map((item, index) => {
        const color = SPECIAL_COLORS[item.category] || COLORS[index % COLORS.length];
        return {
            name: item.category,
            value: item.total,
            percentage: Math.round((item.total / total) * 100),
            color
        };
    }).sort((a, b) => b.value - a.value);

    return (
        <div className="bg-neutral-900/10 border border-white/5 rounded-[2.5rem] p-8 md:p-12">
            <div className="flex flex-col md:flex-row items-center gap-12">
                {/* Donut Chart Side */}
                <div className="w-full md:w-1/2 h-[300px] relative">
                    <ResponsiveContainer width="100%" height="100%">
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
                                content={({ active, payload }) => {
                                    if (active && payload && payload.length) {
                                        const data = payload[0].payload;
                                        return (
                                            <div className="bg-black/90 border border-white/10 p-3 rounded-xl backdrop-blur-md shadow-2xl">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-neutral-500 mb-1">{data.name}</p>
                                                <p className="text-sm font-black text-white">₹{data.value.toLocaleString()}</p>
                                                <p className="text-[10px] font-bold text-neutral-400 mt-0.5">{data.percentage}% of total</p>
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
