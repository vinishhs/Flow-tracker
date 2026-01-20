"use client";

import { motion, AnimatePresence, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

interface DebtItem {
    name: string;
    total: number;
}

interface DebtLedgerProps {
    data: DebtItem[];
    isOpen: boolean;
    onClose: () => void;
}

export function DebtLedger({ data, isOpen, onClose }: DebtLedgerProps) {
    const [activeIndex, setActiveIndex] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!isOpen) return;
            if (e.key === "ArrowDown") {
                e.preventDefault();
                setActiveIndex((prev) => Math.min(prev + 1, data.length - 1));
            } else if (e.key === "ArrowUp") {
                e.preventDefault();
                setActiveIndex((prev) => Math.max(prev - 1, 0));
            } else if (e.key === "Escape") {
                onClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, data.length, onClose]);

    useEffect(() => {
        if (isOpen) {
            const activeElement = document.getElementById(`debt-item-${activeIndex}`);
            if (activeElement) {
                activeElement.scrollIntoView({ behavior: "smooth", block: "nearest" });
            }
        }
    }, [activeIndex, isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 overflow-hidden">
                    {/* Backdrop Blur */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    {/* Ledger Box */}
                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] max-h-[500px]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-[#0a0a0a] z-20 flex-shrink-0">
                            <div>
                                <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-blue-500 mb-1">Debt Ledger</h2>
                                <h3 className="text-2xl font-black text-white tracking-tighter">Who Owes Me?</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-3 bg-neutral-900 border border-neutral-800 rounded-full hover:border-white/20 transition-colors"
                                aria-label="Close"
                            >
                                <X className="w-5 h-5 text-neutral-400" />
                            </button>
                        </div>

                        {/* List with Gradients */}
                        <div className="relative flex-1 overflow-hidden min-h-0">
                            {/* Scroll Gradients */}
                            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#0a0a0a] to-transparent z-10 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-[#0a0a0a] to-transparent z-10 pointer-events-none" />

                            <div
                                ref={containerRef}
                                className="h-full overflow-y-auto px-6 py-8 space-y-3 custom-scrollbar overscroll-contain"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {data.map((item, index) => (
                                    <AnimatedListItem
                                        key={item.name}
                                        item={item}
                                        index={index}
                                        isActive={index === activeIndex}
                                    />
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}

function AnimatedListItem({ item, index, isActive }: { item: DebtItem; index: number; isActive: boolean }) {
    const ref = useRef(null);
    const isInView = useInView(ref, { once: true, margin: "-20px" });

    return (
        <motion.div
            ref={ref}
            id={`debt-item-${index}`}
            initial={{ scale: 0.7, opacity: 0 }}
            animate={isInView ? { scale: 1, opacity: 1 } : {}}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            className={`flex justify-between items-center p-5 rounded-2xl transition-all duration-300 ${isActive
                ? 'bg-blue-600/10 border border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                : 'bg-[#171717] border border-neutral-800 hover:border-neutral-700'
                }`}
        >
            <span className="text-lg font-bold text-white uppercase tracking-tight">{item.name}</span>
            <span className="font-mono text-xl font-black text-blue-400">
                ₹{item.total.toLocaleString()}
            </span>
        </motion.div>
    );
}
