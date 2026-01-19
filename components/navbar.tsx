import Link from "next/link"
import { ThemeToggle } from "./theme-toggle"
import { Activity } from "lucide-react"

export function Navbar() {
    return (
        <nav className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white/80 dark:bg-neutral-950/80 backdrop-blur-md px-4 md:px-8 flex items-center justify-between sticky top-0 z-50">
            <Link href="/" className="flex items-center gap-2 font-bold text-xl tracking-tighter">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center text-white">
                    <Activity size={20} />
                </div>
                <span>Flow</span>
            </Link>

            <div className="flex items-center gap-4">
                <ThemeToggle />
            </div>
        </nav>
    )
}
