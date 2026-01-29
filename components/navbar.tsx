"use client";
import Link from "next/link"
import { usePathname } from "next/navigation"

export function Navbar() {
    const pathname = usePathname();
    if (pathname === "/") return null;

    return (
        <nav className="h-16 border-b border-neutral-800 bg-neutral-950/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
            <Link href="/" className="flex items-center gap-2 font-black tracking-tighter uppercase text-white">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center font-black italic text-black text-xl">F</div>
                <span>Flow</span>
            </Link>

            <div className="flex items-center gap-4">
                {/* Theme toggle removed as per request */}
            </div>
        </nav>
    )
}
