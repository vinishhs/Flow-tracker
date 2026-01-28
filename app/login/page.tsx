"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { toast, Toaster } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Mail, Lock, Eye, EyeOff, Sparkles } from "lucide-react";

type AuthMode = "signin" | "signup";

export default function LoginPage() {
    const [mode, setMode] = useState<AuthMode>("signin");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const router = useRouter();

    // Email validation
    const isValidEmail = (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    // Password strength calculation
    const getPasswordStrength = (pwd: string): { level: number; label: string; color: string } => {
        if (pwd.length < 6) return { level: 0, label: "Weak", color: "bg-rose-500" };
        if (pwd.length < 10) return { level: 1, label: "Medium", color: "bg-yellow-500" };
        if (/[0-9]/.test(pwd) && /[^a-zA-Z0-9]/.test(pwd)) {
            return { level: 2, label: "Strong", color: "bg-emerald-500" };
        }
        return { level: 1, label: "Medium", color: "bg-yellow-500" };
    };

    const passwordStrength = getPasswordStrength(password);

    const handleAuth = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isValidEmail(email)) {
            toast.error("Please enter a valid email address");
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            return;
        }

        if (mode === "signup" && password !== confirmPassword) {
            toast.error("Passwords don't match");
            return;
        }

        setLoading(true);

        try {
            if (mode === "signin") {
                const { data, error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });

                if (error) throw error;

                toast.success("Welcome back!");
                router.push("/");
            } else {
                const { data, error } = await supabase.auth.signUp({
                    email,
                    password,
                });

                if (error) throw error;

                toast.success("Account created! Welcome to Flow!");
                router.push("/");
            }
        } catch (error: any) {
            toast.error(error.message || "Authentication failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-6 bg-[#0a0a0a] text-white relative overflow-hidden">
            {/* Animated Background Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 via-transparent to-blue-500/5 animate-pulse" />

            {/* Floating Orbs */}
            <div className="absolute top-20 left-20 w-72 h-72 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse [animation-delay:1s]" />

            <Toaster position="top-center" theme="dark" />

            {/* Auth Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 w-full max-w-md"
            >
                {/* Logo/Header */}
                <div className="text-center mb-8">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.2 }}
                        className="inline-flex items-center gap-2 mb-4"
                    >
                        <Sparkles className="w-8 h-8 text-emerald-500" />
                        <h1 className="text-4xl font-black text-white tracking-tighter">Flow</h1>
                    </motion.div>
                    <p className="text-sm text-neutral-400 font-medium">
                        Track your finances with intelligence
                    </p>
                </div>

                {/* Glassmorphic Card */}
                <div className="relative backdrop-blur-xl bg-neutral-900/40 border border-white/10 rounded-[2rem] p-8 shadow-2xl">
                    {/* Glow Effect */}
                    <div className="absolute -inset-[1px] bg-gradient-to-br from-emerald-500/20 via-transparent to-blue-500/20 rounded-[2rem] -z-10 blur-sm" />

                    {/* Mode Toggle */}
                    <div className="flex gap-2 mb-8 p-1 bg-black/40 rounded-full">
                        <button
                            onClick={() => setMode("signin")}
                            className={`flex-1 py-3 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${mode === "signin"
                                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                                    : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            Sign In
                        </button>
                        <button
                            onClick={() => setMode("signup")}
                            className={`flex-1 py-3 px-6 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${mode === "signup"
                                    ? "bg-emerald-500 text-black shadow-lg shadow-emerald-500/30"
                                    : "text-neutral-400 hover:text-white"
                                }`}
                        >
                            Sign Up
                        </button>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleAuth} className="space-y-5">
                        {/* Email Field */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2 pl-4">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="you@example.com"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div>
                            <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2 pl-4">
                                Password
                            </label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••"
                                    className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-12 py-4 text-sm focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                            </div>

                            {/* Password Strength Indicator (Signup only) */}
                            <AnimatePresence>
                                {mode === "signup" && password.length > 0 && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="mt-3 px-4"
                                    >
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-500">
                                                Strength
                                            </span>
                                            <span className={`text-[10px] font-bold uppercase tracking-wider ${passwordStrength.level === 2 ? 'text-emerald-500' : passwordStrength.level === 1 ? 'text-yellow-500' : 'text-rose-500'}`}>
                                                {passwordStrength.label}
                                            </span>
                                        </div>
                                        <div className="h-1.5 bg-black/40 rounded-full overflow-hidden">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${((passwordStrength.level + 1) / 3) * 100}%` }}
                                                className={`h-full ${passwordStrength.color} transition-all`}
                                            />
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Confirm Password (Signup only) */}
                        <AnimatePresence>
                            {mode === "signup" && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: "auto" }}
                                    exit={{ opacity: 0, height: 0 }}
                                >
                                    <label className="block text-xs font-black uppercase tracking-wider text-neutral-500 mb-2 pl-4">
                                        Confirm Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            className="w-full bg-black/40 border border-white/10 rounded-2xl pl-12 pr-4 py-4 text-sm focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all outline-none"
                                            required
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-6 py-4 bg-emerald-600 hover:bg-emerald-500 disabled:bg-neutral-800 disabled:text-neutral-500 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:scale-100"
                        >
                            {loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    {mode === "signin" ? "Signing In..." : "Creating Account..."}
                                </span>
                            ) : (
                                <span>{mode === "signin" ? "Sign In" : "Create Account"}</span>
                            )}
                        </button>
                    </form>

                    {/* Footer Note */}
                    <p className="mt-6 text-center text-xs text-neutral-500">
                        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
                        <button
                            onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                            className="text-emerald-500 hover:text-emerald-400 font-bold transition-colors"
                        >
                            {mode === "signin" ? "Sign up" : "Sign in"}
                        </button>
                    </p>
                </div>
            </motion.div>
        </main>
    );
}
