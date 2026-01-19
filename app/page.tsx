"use client";

import { useState, useMemo } from "react";
import { ArrowRight, Save, CheckCircle2 } from "lucide-react";
import { parseAppleNote, TransactionData, ProcessResult } from "@/lib/services/parser";

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ProcessResult | null>(null);

  const handleProcess = () => {
    if (!input.trim()) return;
    const data = parseAppleNote(input);
    setResult(data);
  };

  // Group transactions by category and sum amounts
  const groupedTransactions = useMemo(() => {
    if (!result) return [];

    const categoryMap = new Map<string, { category: string; amount: number; type: 'income' | 'expense' }>();

    result.recognized.forEach(tx => {
      const existing = categoryMap.get(tx.category);
      if (existing) {
        existing.amount += tx.amount;
      } else {
        categoryMap.set(tx.category, {
          category: tx.category,
          amount: tx.amount,
          type: tx.transaction_type
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
          {groupedTransactions.map((tx) => (
            <TransactionCard key={tx.category} tx={tx} />
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

function TransactionCard({ tx }: { tx: { category: string; amount: number; type: 'income' | 'expense' } }) {
  const isLending = tx.category === "LEND TO";
  const isOthers = tx.category === "OTHERS";

  return (
    <div className={`p-5 rounded-2xl border border-neutral-800 bg-neutral-900/20 hover:bg-neutral-900/40 transition-all ${isLending ? 'border-l-4 border-l-blue-500' : isOthers ? 'border-l-4 border-l-amber-500' : ''}`}>
      <div className="flex justify-between items-center">
        <div className="flex-1">
          <h3 className="font-bold text-white text-lg leading-tight uppercase tracking-tight">
            {tx.category}
          </h3>
        </div>
        <div className={`font-mono font-black text-xl ${tx.type === 'income' ? 'text-emerald-500' : 'text-white'}`}>
          {tx.type === 'income' ? '+' : ''}₹{tx.amount.toLocaleString()}
        </div>
      </div>
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