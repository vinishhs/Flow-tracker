"use client";
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import { LogOut } from "lucide-react"

export function Navbar() {
    const pathname = usePathname();
    const { user, signOut, loading } = useAuth();

    if (pathname === "/") return null;

    return (
        <nav className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
            <Link href="/" className="flex items-center gap-2 font-black tracking-tighter uppercase text-white">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black italic text-black text-xl">F</div>
                <span>Flow</span>
            </Link>

            <div className="flex items-center gap-6">
                {!loading && user && (
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-neutral-500 lowercase tracking-tight hidden md:block">
                            {user.email}
                        </span>
                        <button
                            onClick={signOut}
                            className="flex items-center gap-2 px-2 py-1 rounded-xl border border-white/5 bg-white/5 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400 transition-all text-[9px] font-black uppercase tracking-widest text-neutral-400"
                            title="Sign Out"
                        >
                            <LogOut className="w-3 h-3" />
                            <span className="hidden sm:inline">Logout</span>
                        </button>
                    </div>
                )}
            </div>
        </nav>
    )
}
