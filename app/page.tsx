"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { ChevronDown, BarChart3, Link as LinkIcon, Loader2, History as HistoryIcon } from "lucide-react";
import { parseAppleNote, ProcessResult, TransactionData } from "@/lib/services/parser";
import { AnalyticsDonut } from "@/components/analytics-donut";
import { DebtLedger } from "@/components/debt-ledger";
import { HistorySidebar, HistoricalNote } from "@/components/history-sidebar";
import { supabase } from "@/lib/supabase";
import { Toaster, toast } from "sonner";

interface GroupedTransaction {
  category: string;
  total: number;
  type: 'income' | 'expense';
  items: Array<{
    amount: number;
    date?: string;
    detail?: string;
    originalLine?: string;
    personName?: string;
  }>;
}

export default function Home() {
  const [input, setInput] = useState("");
  const [result, setResult] = useState<ProcessResult | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isLedgerOpen, setIsLedgerOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [history, setHistory] = useState<HistoricalNote[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const [hasNewSaves, setHasNewSaves] = useState(false);

  const dashboardRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  const handleProcess = () => {
    if (!input.trim()) return;
    const data = parseAppleNote(input);
    setResult(data);
    setExpandedCategory(null); // Reset expansion on new process
  };

  const scrollToDashboard = () => {
    dashboardRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const scrollToChart = () => {
    chartRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  // 1. Reconciliation Logic (Running Balances)
  const reconciliation = useMemo(() => {
    if (!result) return { perPerson: new Map<string, { lent: number, received: number }>(), totalSettled: 0 };

    const perPerson = new Map<string, { lent: number, received: number }>();

    result.recognized.forEach(tx => {
      const name = (tx.recipientName || tx.senderName)?.toLowerCase().trim();
      if (!name) return;

      const current = perPerson.get(name) || { lent: 0, received: 0 };
      if (tx.category === "LEND TO") current.lent += tx.amount;
      if (tx.category === "Money In") current.received += tx.amount;
      perPerson.set(name, current);
    });

    let totalSettled = 0;
    perPerson.forEach(data => {
      totalSettled += Math.min(data.lent, data.received);
    });

    return { perPerson, totalSettled };
  }, [result]);

  // Nested aggregation: group by category and preserve individual items
  const groupedTransactions = useMemo(() => {
    if (!result) return [];

    const categoryMap = new Map<string, GroupedTransaction>();

    result.recognized.forEach(tx => {
      const personName = (tx.recipientName || tx.senderName)?.toLowerCase().trim();
      const existing = categoryMap.get(tx.category);
      const itemData = {
        amount: tx.amount,
        date: tx.date,
        detail: tx.originalDetail,
        originalLine: tx.originalLine,
        personName
      };

      if (existing) {
        existing.total += tx.amount;
        existing.items.push(itemData);
      } else {
        categoryMap.set(tx.category, {
          category: tx.category,
          total: tx.amount,
          type: tx.transaction_type,
          items: [itemData]
        });
      }
    });

    return Array.from(categoryMap.values());
  }, [result]);

  // Expenses only for the Donut Chart
  const expenseGroups = useMemo(() => {
    return groupedTransactions.filter(g => g.type === 'expense');
  }, [groupedTransactions]);

  const debtData = useMemo(() => {
    if (!result) return [];

    // 1. Identify unique names in LEND TO only
    const debtorNames = new Set<string>();
    result.recognized.forEach(tx => {
      if (tx.category === "LEND TO" && tx.recipientName) {
        debtorNames.add(tx.recipientName.toLowerCase().trim());
      }
    });

    const debts = new Map<string, { lent: number, received: number }>();
    const nameMap = new Map<string, string>(); // normalized -> original

    result.recognized.forEach(tx => {
      const rawName = tx.recipientName || tx.senderName;
      if (!rawName) return;
      const normalized = rawName.toLowerCase().trim();

      // Only process if they are in the debtorNames set
      if (!debtorNames.has(normalized)) return;

      if (!nameMap.has(normalized)) nameMap.set(normalized, rawName);

      const current = debts.get(normalized) || { lent: 0, received: 0 };
      if (tx.category === "LEND TO") current.lent += tx.amount;
      if (tx.category === "Money In") current.received += tx.amount;
      debts.set(normalized, current);
    });

    return Array.from(debts.entries()).map(([normalized, data]) => ({
      name: nameMap.get(normalized) || normalized,
      total: data.lent,
      received: data.received,
      balance: data.lent - data.received
    })).sort((a, b) => b.balance - a.balance);
  }, [result]);

  const totals = useMemo(() => {
    if (!result) return { income: 0, expenses: 0, net: 0, settled: 0 };
    let inc = 0, exp = 0;
    result.recognized.forEach(tx => {
      if (tx.transaction_type === 'income') inc += tx.amount;
      else exp += tx.amount;
    });

    const settled = reconciliation.totalSettled;
    // Adjusted displays
    return {
      income: inc - settled,
      expenses: exp - settled,
      net: inc - exp,
      settled
    };
  }, [result, reconciliation]);

  const handleSaveRecords = async () => {
    if (!result || result.recognized.length === 0) return;

    setIsSaving(true);
    try {
      // 1. Fallback user_id (using 'all zeros' UUID as requested)
      const userId = '00000000-0000-0000-0000-000000000000';

      // 2. Insert master record using settled/adjusted totals
      const { data: note, error: noteError } = await supabase
        .from('financial_notes')
        .insert({
          user_id: userId,
          raw_text: input,
          total_in: totals.income,
          total_out: totals.expenses,
          net_balance: totals.net,
          settled_amount: totals.settled
        })
        .select('id')
        .single();

      if (noteError) throw noteError;

      // 3. Prepare individual transactions
      const transactionsToInsert = result.recognized.map(tx => {
        // Parse date: "17 Jan" -> "2026-01-17" (using 2026 as current year)
        let txDate = new Date();
        if (tx.date) {
          const dateStr = `${tx.date} 2026`;
          txDate = new Date(dateStr);
        }

        // Map LEND TO to 'lending' enum type
        const typeMapping = tx.category === "LEND TO" ? 'lending' : tx.transaction_type;

        return {
          user_id: userId,
          note_id: note.id,
          amount: tx.amount,
          transaction_type: typeMapping,
          category: tx.category,
          sub_category: tx.originalDetail,
          recipient_name: tx.recipientName,
          sender_name: tx.senderName,
          transaction_date: txDate.toISOString(),
          fingerprint: `${tx.originalLine}-${Date.now()}-${Math.random()}`
        };
      });

      // 4. Batch insert detail records
      const { error: txError } = await supabase
        .from('transactions')
        .insert(transactionsToInsert);

      if (txError) throw txError;

      toast.success("Records archived successfully");
      setInput(""); // Clear input as per requirements
      setResult(null); // Reset dashboard
      fetchHistory(); // Refresh history
      setHasNewSaves(true);
    } catch (error: any) {
      console.error("Save failed:", error);
      toast.error(error.message || "Failed to save records");
    } finally {
      setIsSaving(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('financial_notes')
        .select('id, created_at, net_balance, raw_text')
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setHistory(data || []);
    } catch (error) {
      console.error("Error fetching history:", error);
    }
  };

  const loadHistoricalNote = async (noteId: string) => {
    try {
      // 1. Fetch the note raw text
      const note = history.find(n => n.id === noteId);
      if (note) setInput(note.raw_text);

      // 2. Fetch transactions
      const { data: dbTransactions, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('note_id', noteId);

      if (error) throw error;

      // 3. Reconstruct TransactionData
      const recognized: TransactionData[] = dbTransactions.map(tx => ({
        amount: Number(tx.amount),
        category: tx.category,
        transaction_type: tx.transaction_type === 'lending' ? 'expense' : tx.transaction_type,
        recipientName: tx.recipient_name,
        senderName: tx.sender_name,
        originalDetail: tx.sub_category,
        date: new Date(tx.transaction_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
        originalLine: tx.fingerprint.split('-')[0], // Approximation
      }));

      setResult({ recognized, unrecognized: [] });
      setActiveNoteId(noteId);
      toast.success("Snapshot loaded");
    } catch (error: any) {
      console.error("Error loading note:", error);
      toast.error("Failed to load snapshot");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const [hoveredPerson, setHoveredPerson] = useState<string | null>(null);

  const hasData = result && result.recognized.length > 0;

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-emerald-500/30 overflow-x-hidden">
      {/* Sidebar Overlay */}
      <HistorySidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        history={history}
        activeNoteId={activeNoteId}
        onLoad={loadHistoricalNote}
      />

      {/* Floating History Toggle */}
      <div className="fixed top-8 left-8 z-[90]">
        <button
          onClick={() => {
            setIsSidebarOpen(true);
            setHasNewSaves(false);
          }}
          className="p-4 bg-neutral-900 border border-white/5 rounded-full hover:border-emerald-500/50 transition-all shadow-2xl group relative"
        >
          <HistoryIcon className="w-5 h-5 text-white group-hover:text-emerald-500 transition-colors" />
          {hasNewSaves && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-emerald-500 border-4 border-[#0a0a0a] rounded-full animate-pulse" />
          )}
        </button>
      </div>

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

        {/* Paired Bouncing Navigation Buttons */}
        {hasData && (
          <div className="absolute bottom-12 flex items-center gap-12 md:gap-20">
            {/* 1. See Analysis (Dashboard Scroll) */}
            <button
              onClick={scrollToDashboard}
              className="flex flex-col items-center gap-2 group animate-bounce cursor-pointer transition-all hover:scale-110"
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity">See Analysis</span>
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-full group-hover:border-emerald-500/50 transition-colors shadow-2xl">
                <ChevronDown className="w-6 h-6 text-white" />
              </div>
            </button>

            {/* 2. Quick Insights (Chart Scroll) */}
            <button
              onClick={scrollToChart}
              className="flex flex-col items-center gap-2 group animate-bounce cursor-pointer [animation-delay:200ms] transition-all hover:scale-110"
            >
              <span className="text-[9px] font-black uppercase tracking-widest text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">Quick Insights</span>
              <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-full group-hover:border-blue-500/50 transition-colors shadow-2xl">
                <BarChart3 className="w-6 h-6 text-white" />
              </div>
            </button>
          </div>
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
              <div className="flex items-center gap-6">
                {debtData.length > 0 && (
                  <button
                    onClick={() => setIsLedgerOpen(true)}
                    className="text-[10px] font-black uppercase tracking-widest text-blue-400 px-4 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full hover:bg-blue-500/20 transition-all shadow-[0_0_15px_rgba(59,130,246,0.2)]"
                  >
                    Who Owes Me?
                  </button>
                )}
                <div className="flex items-center gap-4 text-[10px] font-bold text-neutral-400">
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500" /> IN</span>
                  <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500" /> OUT</span>
                </div>
              </div>
            </div>
          </div>

          <div className="max-w-3xl mx-auto space-y-16">
            {/* Stats Cards Dashboard */}
            <div className="grid grid-cols-3 gap-4 md:gap-6">
              <StatCard label="Total In" val={totals.income} color="text-emerald-500" />
              <StatCard label="Total Out" val={totals.expenses} color="text-rose-500" />
              <StatCard label="Net Balance" val={totals.net} color="text-white" highlight />
            </div>

            {/* List of Aggregated Transactions */}
            <div className="space-y-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 pl-4 border-l-2 border-neutral-800">Categories</h3>
              <div className="space-y-3">
                {groupedTransactions.map((group) => (
                  <TransactionCard
                    key={group.category}
                    group={group}
                    isExpanded={expandedCategory === group.category}
                    onToggle={() => setExpandedCategory(expandedCategory === group.category ? null : group.category)}
                    reconciliation={reconciliation}
                    hoveredPerson={hoveredPerson}
                    setHoveredPerson={setHoveredPerson}
                  />
                ))}
              </div>
            </div>

            {/* ANALYTICS SECTION */}
            <div ref={chartRef} className="pt-12 animate-in fade-in slide-in-from-bottom-8 duration-1000">
              <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-600 pl-4 border-l-2 border-neutral-800 mb-8">Visual Breakdown</h3>
              <AnalyticsDonut data={expenseGroups} />
            </div>

            {/* Final Action */}
            <div className="pt-8 text-center pb-20">
              <button
                onClick={handleSaveRecords}
                disabled={isSaving || !hasData}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 disabled:scale-100 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.4em] shadow-2xl shadow-emerald-500/10 transition-all hover:scale-[1.01] active:scale-[0.99] group"
              >
                <span className="flex items-center justify-center gap-2">
                  {isSaving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> SAVING...
                    </>
                  ) : (
                    <>
                      SAVE RECORDS <BarChart3 className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </div>
            <Toaster position="bottom-right" theme="dark" />
          </div>

          <DebtLedger
            data={debtData}
            isOpen={isLedgerOpen}
            onClose={() => setIsLedgerOpen(false)}
          />
        </section>
      )}
    </main>
  );
}

// --- Transaction Card Component ---

function TransactionCard({
  group,
  isExpanded,
  onToggle,
  reconciliation,
  hoveredPerson,
  setHoveredPerson
}: {
  group: GroupedTransaction;
  isExpanded: boolean;
  onToggle: () => void;
  reconciliation: any;
  hoveredPerson: string | null;
  setHoveredPerson: (name: string | null) => void;
}) {
  const isLending = group.category === "LEND TO";
  const isOthers = group.category === "OTHERS";

  return (
    <div
      className={`group rounded-[1.5rem] border transition-all duration-500 overflow-hidden ${isExpanded
        ? 'bg-neutral-900 border-neutral-700 shadow-2xl ring-1 ring-white/5'
        : 'bg-neutral-900/20 border-neutral-800 hover:bg-neutral-900/40 hover:border-neutral-700'
        } ${isLending ? 'border-l-4 border-l-blue-500' :
          isOthers ? 'border-l-4 border-l-amber-500' : ''
        }`}
    >
      {/* Header View */}
      <div
        onClick={onToggle}
        className="p-5 md:p-6 cursor-pointer flex justify-between items-center"
      >
        <div className="flex-1 flex items-center gap-4">
          <div className={`p-2.5 rounded-xl bg-[#0a0a0a] border border-neutral-800 group-hover:border-neutral-600 transition-colors`}>
            <ChevronDown className={`w-4 h-4 text-neutral-500 transition-transform duration-500 ${isExpanded ? 'rotate-180' : ''}`} />
          </div>
          <h3 className="font-bold text-white text-lg md:text-xl leading-tight uppercase tracking-tight">
            {group.category}
          </h3>
        </div>
        <div className={`font-mono font-black text-xl md:text-2xl ${group.type === 'income' ? 'text-emerald-500' : 'text-white'
          }`}>
          {group.type === 'income' ? '+' : ''}₹{group.total.toLocaleString()}
        </div>
      </div>

      {/* Expanded Drill-down (Accordion) */}
      {isExpanded && (
        <div className="bg-black/60 border-t border-white/5 px-5 md:px-6 pb-6 pt-3 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="space-y-2">
            {group.items.map((item, idx) => {
              const personName = item.personName;
              const recon = personName ? reconciliation.perPerson.get(personName) : null;
              const isSettled = recon && Math.min(recon.lent, recon.received) > 0;
              const isFullySettled = recon && recon.lent === recon.received;
              const isHighlighted = personName && hoveredPerson === personName;

              return (
                <div
                  key={idx}
                  onMouseEnter={() => personName && setHoveredPerson(personName)}
                  onMouseLeave={() => setHoveredPerson(null)}
                  className={`flex justify-between items-center py-[7px] px-[15px] rounded-xl border transition-all duration-300 ${isHighlighted ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-800/40'}`}
                >
                  <div className="flex-1">
                    <div className="flex flex-col md:flex-row md:items-center gap-1 md:gap-5">
                      <div className="flex items-center gap-2">
                        {item.date && (
                          <span className="text-[9px] font-black font-mono text-neutral-500 uppercase tracking-widest bg-black rounded-full px-2.5 py-0.5 w-fit border border-white/5">
                            {item.date}
                          </span>
                        )}
                        {isSettled && (
                          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                            <LinkIcon className="w-2.5 h-2.5 text-emerald-500" />
                            <span className="text-[8px] font-black uppercase tracking-tighter text-emerald-500">
                              {isFullySettled ? 'Settled' : 'Partial'}
                            </span>
                          </div>
                        )}
                      </div>
                      {item.detail && (
                        <span className="text-xs text-neutral-300 font-bold tracking-tight">
                          {item.detail}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className={`font-mono text-sm font-black ${group.type === 'income' ? 'text-emerald-400' : 'text-neutral-200'
                    }`}>
                    {group.type === 'income' ? '+' : ''}₹{item.amount.toLocaleString()}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, val, color, highlight }: any) {
  return (
    <div className={`p-5 md:p-8 rounded-[2rem] border transition-all hover:scale-[1.02] ${highlight ? 'bg-neutral-900 border-neutral-700 shadow-2xl ring-1 ring-white/5' : 'bg-neutral-900/30 border-neutral-800'
      } text-center`}>
      <div className="text-[10px] font-black text-neutral-500 uppercase tracking-[0.3em] mb-2">{label}</div>
      <div className={`text-xl md:text-3xl font-black ${color} tracking-tight`}>₹{Math.abs(val).toLocaleString()}</div>
    </div>
  );
}