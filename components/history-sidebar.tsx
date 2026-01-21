"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, History, Calendar } from "lucide-react";

export interface HistoricalNote {
    id: string;
    created_at: string;
    net_balance: number;
    raw_text: string;
}

interface HistorySidebarProps {
    isOpen: boolean;
    onClose: () => void;
    history: HistoricalNote[];
    activeNoteId: string | null;
    onLoad: (id: string) => void;
}

export function HistorySidebar({ isOpen, onClose, history, activeNoteId, onLoad }: HistorySidebarProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
                    />

                    {/* Sidebar */}
                    <motion.div
                        initial={{ x: "-100%" }}
                        animate={{ x: 0 }}
                        exit={{ x: "-100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="fixed left-0 top-0 bottom-0 w-full max-w-[350px] bg-[#0a0a0a] border-r border-white/5 z-[101] shadow-2xl flex flex-col"
                    >
                        <header className="p-6 border-b border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <History className="w-5 h-5 text-emerald-500" />
                                <h2 className="text-sm font-black uppercase tracking-[0.2em] text-white">History</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-neutral-900 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5 text-neutral-500" />
                            </button>
                        </header>

                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                            {history.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-50">
                                    <History className="w-12 h-12 mb-4 text-neutral-800" />
                                    <p className="text-xs font-bold uppercase tracking-widest text-neutral-500">No records found</p>
                                    <p className="text-[10px] mt-2 text-neutral-600">Save your first note to see history here.</p>
                                </div>
                            ) : (
                                history.map((note) => (
                                    <NoteCard
                                        key={note.id}
                                        note={note}
                                        isActive={activeNoteId === note.id}
                                        onLoad={() => {
                                            onLoad(note.id);
                                            onClose();
                                        }}
                                    />
                                ))
                            )}
                        </div>

                        <footer className="p-6 border-t border-white/5">
                            <p className="text-[9px] font-black uppercase tracking-widest text-neutral-600 text-center">
                                Showing last {history.length} snapshots
                            </p>
                        </footer>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

function NoteCard({ note, isActive, onLoad }: { note: HistoricalNote; isActive: boolean; onLoad: () => void }) {
    const date = new Date(note.created_at);
    const formattedDate = date.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
    });

    return (
        <button
            onClick={onLoad}
            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group ${isActive
                ? "bg-emerald-500/10 border-emerald-500/30"
                : "bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-900/60"
                }`}
        >
            <div className="flex items-center gap-3">
                <Calendar className={`w-3.5 h-3.5 ${isActive ? 'text-emerald-500' : 'text-neutral-500'}`} />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] transition-colors ${isActive ? 'text-white' : 'text-neutral-400 group-hover:text-white'}`}>
                    {formattedDate}
                </span>
            </div>
        </button>
    );
}
