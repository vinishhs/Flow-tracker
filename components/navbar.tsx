"use client";

import { useAuth } from "@/lib/auth-context";
import { LogOut, User, Activity } from "lucide-react";
import Link from "next/link";

export function Navbar() {
    const { user, signOut } = useAuth();

    return (
        <nav className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                    <Activity size={20} />
                </div>
                <span>Flow</span>
            </Link>

            <div className="flex items-center gap-4">
                {user && (
                    <>
                        <div className="flex items-center gap-2 px-4 py-2 bg-neutral-900/50 border border-white/5 rounded-full">
                            <User className="w-4 h-4 text-emerald-500" />
                            <span className="text-sm text-neutral-300 font-medium">{user.email}</span>
                        </div>
                        <button
                            onClick={signOut}
                            className="p-2 bg-neutral-900/50 border border-white/5 rounded-full hover:border-rose-500/50 hover:bg-rose-500/10 transition-all group"
                            title="Logout"
                        >
                            <LogOut className="w-4 h-4 text-white group-hover:text-rose-500 transition-colors" />
                        </button>
                    </>
                )}
            </div>
        </nav>
    );
}
