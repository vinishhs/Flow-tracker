"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Zap, Sparkles, Loader2 } from "lucide-react";
import { toast, Toaster } from "sonner";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSignUp, setIsSignUp] = useState(false);
    const supabase = createClient();
    const router = useRouter();

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            if (isSignUp) {
                const { error } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        emailRedirectTo: `${window.location.origin}/auth/callback`,
                    },
                });
                if (error) throw error;
                toast.success("Check your email to confirm your account!");
            } else {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;
                router.push("/");
                router.refresh();
            }
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center p-6 font-sans">
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[10%] right-[-5%] w-[30%] h-[30%] bg-blue-500/10 blur-[100px] rounded-full" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-10 backdrop-blur-xl shadow-2xl">
                    <div className="flex flex-col items-center mb-10">
                        <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center font-black italic text-black text-2xl mb-6 shadow-lg shadow-emerald-500/20">F</div>
                        <h1 className="text-3xl font-black tracking-tighter uppercase mb-2">Welcome to Flow</h1>
                        <p className="text-neutral-500 text-sm font-bold uppercase tracking-widest text-center">
                            Master your money with<br />Intelligence
                        </p>
                    </div>

                    <form onSubmit={handleAuth} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-4">Email Address</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="name@example.com"
                                required
                                className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-neutral-700"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-neutral-500 ml-4">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                required
                                className="w-full bg-neutral-900/50 border border-white/5 rounded-2xl px-6 py-4 text-sm outline-none focus:border-emerald-500/50 transition-all placeholder:text-neutral-700"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all hover:scale-[1.02] active:scale-[0.98] shadow-xl shadow-emerald-500/10 flex items-center justify-center gap-2"
                        >
                            {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : (isSignUp ? "Create Account" : "Sign In")}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => setIsSignUp(!isSignUp)}
                            className="text-[10px] font-black uppercase tracking-widest text-neutral-500 hover:text-white transition-colors"
                        >
                            {isSignUp ? "Already have an account? Sign In" : "Don't have an account? Sign Up"}
                        </button>
                    </div>
                </div>

                <div className="mt-10 flex items-center justify-center gap-8 text-neutral-600">
                    <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Instant Parser</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Sparkles className="w-3 h-3" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Ghost Logic</span>
                    </div>
                </div>
            </motion.div>
            <Toaster position="bottom-center" theme="dark" />
        </div>
    );
}
