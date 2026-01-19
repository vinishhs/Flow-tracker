"use client";

import { useState, useMemo } from "react";
import { ArrowRight, Save, CheckCircle2, ChevronDown } from "lucide-react";
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

  const handleProcess = () => {
    if (!input.trim()) return;
    const data = parseAppleNote(input);
    setResult(data);
    setExpandedCategory(null); // Reset expansion on new process
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

  const toggleExpand = (category: string) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  return (
    <main className="flex h-screen bg-[#0a0a0a] text-white overflow-hidden">
      {/* Input Pane */}
      <div className="w-1/2 p-8 border-r border-neutral-800 flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500">Source Note</h2>
          <button
            onClick={handleProcess}
            className="px-8 py-2 bg-white text-black rounded-full font-bold text-xs hover:bg-neutral-200 transition-colors"
          >
            PROCESS DATA
          </button>
        </div>
        <textarea
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Paste Apple Note here..."
          className="flex-1 w-full bg-neutral-900/30 p-6 font-mono text-sm border border-neutral-800 rounded-2xl outline-none focus:border-neutral-600 transition-colors resize-none"
        />
      </div>

      {/* Preview Pane */}
      <div className="w-1/2 flex flex-col relative bg-black">
        <div className="p-8 grid grid-cols-3 gap-6 border-b border-neutral-900">
          <StatCard label="In" val={totals.income} color="text-emerald-500" />
          <StatCard label="Out" val={totals.expenses} color="text-rose-500" />
          <StatCard label="Net" val={totals.net} color="text-white" />
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-4 pb-32">
          {groupedTransactions.map((group) => (
            <TransactionCard
              key={group.category}
              group={group}
              isExpanded={expandedCategory === group.category}
              onToggle={() => toggleExpand(group.category)}
            />
          ))}
        </div>

        {result && (
          <div className="absolute bottom-0 w-full p-8 bg-gradient-to-t from-black via-black to-transparent">
            <button className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.3em] shadow-2xl transition-all">
              Confirm & Save to Database
            </button>
          </div>
        )}
      </div>
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
      className={`rounded-2xl border border-neutral-800 bg-neutral-900/20 transition-all overflow-hidden ${isLending ? 'border-l-4 border-l-blue-500' :
          isOthers ? 'border-l-4 border-l-amber-500' : ''
        }`}
    >
      {/* Main Card Header - Clickable */}
      <div
        onClick={onToggle}
        className="p-5 cursor-pointer hover:bg-neutral-900/40 transition-all"
      >
        <div className="flex justify-between items-center">
          <div className="flex-1 flex items-center gap-3">
            <h3 className="font-bold text-white text-lg leading-tight uppercase tracking-tight">
              {group.category}
            </h3>
            <ChevronDown
              className={`w-4 h-4 text-neutral-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''
                }`}
            />
          </div>
          <div className={`font-mono font-black text-xl ${group.type === 'income' ? 'text-emerald-500' : 'text-white'
            }`}>
            {group.type === 'income' ? '+' : ''}₹{group.total.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Expandable Detail Area */}
      {isExpanded && (
        <div className="bg-black/40 border-t border-neutral-800/50 px-5 pb-4 pt-2 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-2">
            {group.items.map((item, idx) => (
              <div
                key={idx}
                className="flex justify-between items-center py-2 px-3 rounded-lg bg-neutral-900/30 hover:bg-neutral-900/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {item.date && (
                      <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">
                        {item.date}
                      </span>
                    )}
                    {item.detail && (
                      <span className="text-xs text-neutral-400 font-medium">
                        {item.detail}
                      </span>
                    )}
                  </div>
                </div>
                <div className={`font-mono text-sm font-bold ${group.type === 'income' ? 'text-emerald-400' : 'text-neutral-300'
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

function StatCard({ label, val, color }: any) {
  return (
    <div className="bg-neutral-900/30 p-4 rounded-2xl border border-neutral-900 text-center">
      <div className="text-[10px] font-black text-neutral-600 uppercase tracking-widest mb-1">{label}</div>
      <div className={`text-xl font-black ${color}`}>₹{Math.abs(val).toLocaleString()}</div>
    </div>
  );
}