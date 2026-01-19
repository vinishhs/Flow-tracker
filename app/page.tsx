"use client";

import { useState, useMemo, useRef } from "react";
import { ChevronDown } from "lucide-react";
import { parseAppleNote, TransactionData, ProcessResult } from "@/lib/services/parser";

interface GroupedTransaction {
  category: string;
  total: number;
  type: 'income' | 'expense';
  items: Array<{
    amount: number;
    date?: string;
    detail?: string;
    originalLine?: string;
  }>;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleProcess = () => {
    if (!input.trim()) return;
    const data = parseAppleNote(input);
    setResult(data);
    setExpandedCategory(null); // Reset expansion on new process
  };

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Nested aggregation: group by category and preserve individual items
  const groupedTransactions = useMemo(() => {
    if (!result) return [];

    const categoryMap = new Map<string, GroupedTransaction>();

    result.recognized.forEach(tx => {
      const existing = categoryMap.get(tx.category);
      if (existing) {
        existing.total += tx.amount;
        existing.items.push({
          amount: tx.amount,
          date: tx.date,
          detail: tx.originalDetail,
          originalLine: tx.originalLine
        });
      } else {
        categoryMap.set(tx.category, {
          category: tx.category,
          total: tx.amount,
          type: tx.transaction_type,
          items: [{
            amount: tx.amount,
            date: tx.date,
            detail: tx.originalDetail,
            originalLine: tx.originalLine
          }]
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [result]);

  const totals = useMemo(() => {
    if (!result) return { income: 0, expenses: 0, net: 0 };
    let inc = 0, exp = 0;
    result.recognized.forEach(tx => {
      if (tx.transaction_type === 'income') inc += tx.amount;
      else exp += tx.amount;
    });
    return { income: inc, expenses: exp, net: inc - exp };
  }, [result]);

  const hasData = result && result.recognized.length > 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-emerald-500/30">

      {/* SECTION 1: ENTRY STATE (ABOVE THE FOLD) */}
      <section className="min-h-screen flex flex-col items-center justify-center p-6 relative">
        <div className="w-full max-w-2xl flex flex-col items-center">
          <header className="text-center mb-8">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-neutral-500 mb-2">Flow Intelligence</h2>
            <h1 className="text-4xl font-black text-white tracking-tighter">Source Note</h1>
          </header>

          <div className="w-full relative group">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Paste Apple Note here..."
              className="w-full h-64 bg-neutral-900/40 p-8 font-mono text-sm border border-neutral-800 rounded-[2rem] outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/5 transition-all resize-none shadow-2xl"
            />
          </div>

          <button
            onClick={handleProcess}
            className="mt-8 px-12 py-4 bg-white text-black rounded-full font-black text-xs uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-xl hover:shadow-white/10"
          >
            PROCESS DATA
          </button>
        </div>

        {/* Bouncing Scroll Down Arrow */}
        {hasData && (
          <button
            onClick={scrollToDashboard}
            className="absolute bottom-12 flex flex-col items-center gap-2 group animate-bounce cursor-pointer"
          >
            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">See Analysis</span>
            <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-full group-hover:border-emerald-500/50 transition-colors">
              <ChevronDown className="w-6 h-6 text-white" />
            </div>
          </button>
        )}
      </section>

      {/* SECTION 2: DASHBOARD STATE (BELOW THE FOLD) */}
      {hasData && (
        <section
          ref={dashboardRef}
          className="min-h-screen border-t border-neutral-900 pt-12 pb-32 px-6 relative"
        >
          {/* Sticky Sub-header Context */}
          <div className="sticky top-0 z-50 py-4 -mt-12 mb-10 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5">
            <div className="max-w-3xl mx-auto flex justify-between items-center px-4 md:px-0">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Note Overview</span>
              <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-400">
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> IN</span>
                <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> OUT</span>
              </div>
            </div>
          </div>

          <div className="max-w-4xl mx-auto space-y-12">
            {/* Stats Cards Dashboard */}
            <div className="grid grid-cols-3 gap-4 md:gap-8">
              <StatCard label="Total In" val={totals.income} color="text-emerald-500" />
              <StatCard label="Total Out" val={totals.expenses} color="text-rose-500" />
              <StatCard label="Net Balance" val={totals.net} color="text-white" highlight />
            </div>

            {/* List of Aggregated Transactions */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 pl-4 border-l-2 border-neutral-800">Categories</h3>
              <div className="space-y-4">
                {groupedTransactions.map((group) => (
                  <TransactionCard
                    key={group.category}
                    group={group}
                    isExpanded={expandedCategory === group.category}
                    onToggle={() => setExpandedCategory(expandedCategory === group.category ? null : group.category)}
                  />
                ))}
              </div>
            </div>

            {/* Final Action */}
            <div className="pt-12 text-center">
              <button className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black text-sm uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/10 transition-all hover:scale-[1.01] active:scale-[0.99]">
                Confirm & Save to Database
              </button>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}

function TransactionCard({
  group,
  isExpanded,
  onToggle
}: {
  group: GroupedTransaction;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const isLending = group.category === "LEND TO";
  const isOthers = group.category === "OTHERS";

  return (
    <div
      className={`group rounded-[2rem] border transition-all duration-500 overflow-hidden ${isExpanded
        ? 'bg-neutral-900 border-neutral-700 shadow-2xl ring-1 ring-white/5'
        : 'bg-neutral-900/20 border-neutral-800 hover:bg-neutral-900/40 hover:border-neutral-700'
        } ${isLending ? 'border-l-4 border-l-blue-500' :
          isOthers ? 'border-l-4 border-l-amber-500' : ''
        }`}
    >
      {/* Header View */}
      <div
        onClick={onToggle}
        className="p-6 md:p-8 cursor-pointer flex justify-between items-center"
      >
        <div className="flex-1 flex items-center gap-4">
          <div className={`p-3 rounded-2xl bg-[#0a0a0a] border border-neutral-800 group-hover:border-neutral-600 transition-colors`}>
            <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          <h3 className="font-bold text-white text-xl md:text-2xl leading-tight uppercase tracking-tight">
            {group.category}
          </h3>
        </div>
        <div className={`font-mono font-black text-2xl md:text-3xl ${group.type === 'income' ? 'text-emerald-500' : 'text-white'
          }`}>
          {group.type === 'income' ? '+' : ''}₹{group.total.toLocaleString()}
        </div>
      </div>

      {/* Expanded Drill-down (Accordion) */}
      {isExpanded && (
        <div className="bg-black/60 border-t border-white/5 px-6 md:px-8 pb-8 pt-4 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-3">
            {group.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-4 px-6 rounded-2xl bg-neutral-900/40 border border-white/5 hover:border-white/10 transition-all hover:bg-neutral-800/40"
              >
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-6">
                    {item.date && (
                      <span className="text-[10px] font-black font-mono text-neutral-500 uppercase tracking-widest bg-black rounded-full px-3 py-1 w-fit border border-white/5">
                        {item.date}
                      </span>
                    )}
                    {item.detail && (
                      <span className="text-sm text-neutral-300 font-bold tracking-tight">
                        {item.detail}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`font-mono text-lg font-black ${group.type === 'income' ? 'text-emerald-400' : 'text-neutral-200'
                  }`}>
                  {group.type === 'income' ? '+' : ''}₹{item.amount.toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, val, color, highlight }: any) {
  return (
    <div className={`p-6 md:p-10 rounded-[2.5rem] border transition-all hover:scale-[1.02] ${highlight ? 'bg-neutral-900 border-neutral-700 shadow-2xl ring-1 ring-white/5' : 'bg-neutral-900/30 border-neutral-800'
      } text-center`}>
      <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-3">{label}</div>
      <div className={`text-2xl md:text-4xl font-black ${color} tracking-tight`}>₹{Math.abs(val).toLocaleString()}</div>
    </div>
  );
}