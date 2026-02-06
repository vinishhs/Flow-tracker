"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, History, Calendar, Trash2 } from "lucide-react";

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
    onDelete: (id: string) => void;
}

export function HistorySidebar({ isOpen, onClose, history, activeNoteId, onLoad, onDelete }: HistorySidebarProps) {
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

                    {/* Sidebar Card */}
                    <motion.div
                        initial={{ x: "-110%", opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: "-110%", opacity: 0 }}
                        transition={{ type: "spring", damping: 28, stiffness: 220 }}
                        className="fixed left-6 top-6 bottom-6 w-full max-w-[320px] bg-neutral-900/80 border border-white/10 rounded-[2.5rem] backdrop-blur-3xl z-[101] shadow-[0_0_50px_rgba(0,0,0,0.5)] flex flex-col overflow-hidden"
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
                                        onDelete={() => onDelete(note.id)}
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

function NoteCard({ note, isActive, onLoad, onDelete }: { note: HistoricalNote; isActive: boolean; onLoad: () => void; onDelete: () => void }) {
    const date = new Date(note.created_at);
    const formattedDate = date.toLocaleDateString('en-IN', {
        month: 'short',
        year: 'numeric'
    });

    return (
        <div
            onClick={onLoad}
            className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 group flex items-center justify-between cursor-pointer ${isActive
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
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    onDelete();
                }}
                className="p-2 text-neutral-600 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                title="Delete History"
            >
                <Trash2 className="w-3.5 h-3.5" />
            </button>
        </div>
    );
}
