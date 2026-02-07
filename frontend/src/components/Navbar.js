"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <nav
            className="fixed top-0 left-0 w-full z-50 flex justify-center"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            <motion.div
                initial={{ y: -50, opacity: 0.8 }}
                animate={{ y: isOpen ? -100 : 0, opacity: isOpen ? 0 : 1 }}
                transition={{ duration: 0.3 }}
                onClick={() => setIsOpen(!isOpen)}
                className="absolute top-0 bg-[var(--background)] border-x border-b border-[var(--primary-blue)] px-8 py-1 rounded-b-xl shadow-[0_0_15px_rgba(0,243,255,0.3)] cursor-pointer z-50 neon-text text-sm tracking-[0.2em] font-bold"
            >
                ACCESS SYSTEM
            </motion.div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        transition={{ type: "spring", stiffness: 120, damping: 20 }}
                        className="w-full min-h-[6rem] bg-black/95 backdrop-blur-xl border-b border-[var(--primary-blue)] shadow-[0_10px_30px_rgba(0,243,255,0.2)] flex flex-col md:flex-row items-center justify-center gap-6 md:gap-12 z-40 py-6 md:py-0"
                    >
                        <NavLink href="/scoreboard">SCOREBOARD</NavLink>
                        <NavLink href="/challenges">MISSIONS</NavLink>

                        {/* Divider - Hidden on mobile, visible on desktop */}
                        <div className="hidden md:block w-px h-10 bg-[var(--glass-border)]"></div>
                        {/* Divider - Visible on mobile, hidden on desktop */}
                        <div className="md:hidden w-10 h-px bg-[var(--glass-border)]"></div>

                        <button
                            onClick={() => {
                                localStorage.removeItem('arise_user');
                                window.location.href = '/login';
                            }}
                            className="text-red-400 hover:text-red-500 font-bold tracking-widest transition-colors duration-300"
                        >
                            LOGOUT
                        </button>

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-4 right-4 md:hidden text-cyan-500"
                        >
                            ✖
                        </button>

                        {/* Desktop Close Area (Clicking outside/bottom to close could be added, but a distinct close button is safer for mobile) */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="hidden md:block absolute bottom-2 text-[10px] text-cyan-500/50 hover:text-cyan-500 uppercase tracking-widest"
                        >
                            [ CLOSE MENU ]
                        </button>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}

function NavLink({ href, children }) {
    return (
        <Link href={href} className="relative group text-[var(--foreground)] hover:text-[var(--primary-blue)] transition-colors duration-300 text-lg font-bold tracking-widest">
            {children}
            <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-[var(--primary-blue)] transition-all duration-300 group-hover:w-full group-hover:shadow-[0_0_10px_var(--primary-blue)]"></span>
        </Link>
    );
}
