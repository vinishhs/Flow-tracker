"use client";

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useInView } from 'framer-motion';
import { X } from 'lucide-react';

interface DebtItem {
    name: string;
    total: number; // This is total lent
    received: number;
    balance: number;
}

interface DebtLedgerProps {
    data: DebtItem[];
    isOpen: boolean;
    onClose: () => void;
}

const AnimatedItem = ({ children, delay = 0, index, onMouseEnter, onClick, isShifting }: any) => {
    const ref = useRef(null);
    const inView = useInView(ref, { amount: 0.5, once: false });

    return (
        <motion.div
            ref={ref}
            data-index={index}
            onMouseEnter={onMouseEnter}
            onClick={onClick}
            initial={{ scale: 0.7, opacity: 0, x: 0 }}
            animate={{
                scale: inView ? 1 : 0.7,
                opacity: inView ? 1 : 0,
                x: isShifting ? 100 : 0
            }}
            transition={{
                duration: isShifting ? 0.3 : 0.4,
                delay: isShifting ? 0 : delay,
                type: "spring",
                damping: 25,
                stiffness: 120
            }}
            className="mb-4 cursor-pointer"
        >
            {children}
        </motion.div>
    );
};

export function DebtLedger({ data, isOpen, onClose }: DebtLedgerProps) {
    const listRef = useRef<HTMLDivElement>(null);
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const [keyboardNav, setKeyboardNav] = useState(false);
    const [topGradientOpacity, setTopGradientOpacity] = useState(0);
    const [bottomGradientOpacity, setBottomGradientOpacity] = useState(1);
    const [isShifting, setIsShifting] = useState(false);

    // Entrance shift & Body scroll lock
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            // Trigger the shift animation once when opened
            setIsShifting(true);
            const timer = setTimeout(() => setIsShifting(false), 300);
            return () => {
                clearTimeout(timer);
                document.body.style.overflow = 'unset';
            };
        } else {
            document.body.style.overflow = 'unset';
            setIsShifting(false);
        }
    }, [isOpen]);

    const handleItemMouseEnter = useCallback((index: number) => {
        setSelectedIndex(index);
    }, []);

    const handleItemClick = useCallback((index: number) => {
        setSelectedIndex(index);
    }, []);

    const handleScroll = useCallback((e: any) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        setTopGradientOpacity(Math.min(scrollTop / 50, 1));
        const bottomDistance = scrollHeight - (scrollTop + clientHeight);
        setBottomGradientOpacity(scrollHeight <= clientHeight ? 0 : Math.min(bottomDistance / 50, 1));
    }, []);


    useEffect(() => {
        if (!isOpen) return;
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowDown' || (e.key === 'Tab' && !e.shiftKey)) {
                e.preventDefault();
                setKeyboardNav(true);
                setSelectedIndex(prev => Math.min(prev + 1, data.length - 1));
            } else if (e.key === 'ArrowUp' || (e.key === 'Tab' && e.shiftKey)) {
                e.preventDefault();
                setKeyboardNav(true);
                setSelectedIndex(prev => Math.max(prev - 1, 0));
            } else if (e.key === 'Enter') {
                if (selectedIndex >= 0 && selectedIndex < data.length) {
                    e.preventDefault();
                    // Action for selection if needed
                }
            } else if (e.key === 'Escape') {
                onClose();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [data, selectedIndex, isOpen, onClose]);

    useEffect(() => {
        if (!keyboardNav || selectedIndex < 0 || !listRef.current) return;
        const container = listRef.current;
        const selectedItem = container.querySelector(`[data-index="${selectedIndex}"]`) as HTMLElement;
        if (selectedItem) {
            const extraMargin = 50;
            const containerScrollTop = container.scrollTop;
            const containerHeight = container.clientHeight;
            const itemTop = selectedItem.offsetTop;
            const itemBottom = itemTop + selectedItem.offsetHeight;

            if (itemTop < containerScrollTop + extraMargin) {
                container.scrollTo({ top: itemTop - extraMargin, behavior: 'smooth' });
            } else if (itemBottom > containerScrollTop + containerHeight - extraMargin) {
                container.scrollTo({
                    top: itemBottom - containerHeight + extraMargin,
                    behavior: 'smooth'
                });
            }
        }
        setKeyboardNav(false);
    }, [selectedIndex, keyboardNav]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-hidden">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-md"
                    />

                    <motion.div
                        initial={{ scale: 0.7, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 0.7, opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="relative w-full max-w-lg bg-[#0a0a0a] border border-neutral-800 rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col h-[80vh] max-h-[500px]"
                    >
                        {/* Header */}
                        <div className="p-8 border-b border-neutral-800 flex justify-between items-center bg-[#0a0a0a] z-50 flex-shrink-0">
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
                        <div className="relative flex-1 overflow-hidden">
                            <div
                                ref={listRef}
                                onScroll={handleScroll}
                                className="h-full overflow-y-auto px-6 py-8 custom-scrollbar overscroll-contain"
                                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                            >
                                {data.map((item, index) => (
                                    <AnimatedItem
                                        key={index}
                                        delay={index * 0.05}
                                        index={index}
                                        isShifting={isShifting}
                                        onMouseEnter={() => handleItemMouseEnter(index)}
                                        onClick={() => handleItemClick(index)}
                                    >
                                        <div className={`flex justify-between items-center p-5 rounded-2xl transition-all duration-300 border ${selectedIndex === index
                                            ? 'bg-blue-600/10 border-blue-500/50 shadow-[0_0_20px_rgba(59,130,246,0.1)]'
                                            : 'bg-[#171717] border-neutral-800 hover:border-neutral-700'
                                            } ${item.balance === 0 ? 'opacity-60' : ''}`}>
                                            <div className="flex flex-col">
                                                <span className={`text-lg font-bold uppercase tracking-tight ${item.balance === 0 ? 'text-neutral-500 line-through' : 'text-white'}`}>
                                                    {item.name}
                                                </span>
                                                {item.received > 0 && (
                                                    <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">
                                                        {item.balance === 0 ? 'Fully Cleared' : `Repaid ₹${item.received.toLocaleString()}`}
                                                    </span>
                                                )}
                                            </div>
                                            <span className={`font-mono text-xl font-black ${item.balance === 0 ? 'text-emerald-500' : 'text-blue-400'}`}>
                                                ₹{item.balance.toLocaleString()}
                                            </span>
                                        </div>
                                    </AnimatedItem>
                                ))}
                            </div>

                            {/* Gradients */}
                            <div
                                className="absolute top-0 left-0 right-0 h-[50px] bg-gradient-to-b from-[#0a0a0a] to-transparent pointer-events-none transition-opacity duration-300 z-10"
                                style={{ opacity: topGradientOpacity }}
                            />
                            <div
                                className="absolute bottom-0 left-0 right-0 h-[80px] bg-gradient-to-t from-[#0a0a0a] to-transparent pointer-events-none transition-opacity duration-300 z-10"
                                style={{ opacity: bottomGradientOpacity }}
                            />
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
