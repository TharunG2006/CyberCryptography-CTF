"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import CyberButton from "@/components/ui/CyberButton";
import { motion } from "framer-motion";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    // Check for verification status from URL
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('verified') === 'true') {
            setError("IDENTITY CONFIRMED. SYSTEM ACCESS GRANTED.");
            // Optional: change color to green for success message (handled below logic)
        } else if (params.get('error') === 'invalid_token') {
            setError("INVALID OR EXPIRED FREQUENCY TOKEN.");
        }
    }, []);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const res = await fetch("/api/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ username, password }),
            });
            const data = await res.json();

            if (res.ok) {
                localStorage.setItem("arise_user", JSON.stringify(data.user));
                router.push("/scoreboard");
            } else {
                setError(data.error);
                setIsSubmitting(false);
            }
        } catch (err) {
            setError("System Unreachable");
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
            <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
            >
                <source src="/LW/login-bg.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-black/60 z-0"></div>

            <div className="relative z-10 w-full max-w-md p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <GlassCard className="border-t-4 border-t-[var(--primary-blue)]">
                        <h2 className="text-3xl text-center mb-8 font-[family-name:var(--font-orbitron)] font-bold tracking-widest neon-text">
                            SYSTEM ACCESS
                        </h2>

                        {error && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                className={`mb-4 text-center border p-2 text-sm tracking-wider ${error.includes("CONFIRMED") ? "text-[var(--neon-green)] bg-green-900/20 border-[var(--neon-green)]" : "text-red-500 bg-red-900/20 border-red-500/50"
                                    }`}
                            >
                                {error.includes("CONFIRMED") ? "✔ " : "⚠ "} {error}
                            </motion.div>
                        )}

                        <form onSubmit={handleLogin} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-cyan-400/80 pl-1">Codename</label>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-black/40 border border-[var(--glass-border)] p-3 text-cyan-100 focus:outline-none focus:border-[var(--primary-blue)] focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all placeholder:text-white/20"
                                    placeholder="ENTER ID"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-xs uppercase tracking-[0.2em] text-cyan-400/80 pl-1">Passcode</label>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-black/40 border border-[var(--glass-border)] p-3 text-cyan-100 focus:outline-none focus:border-[var(--primary-blue)] focus:shadow-[0_0_15px_rgba(0,243,255,0.2)] transition-all placeholder:text-white/20"
                                    placeholder="ENTER KEY"
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="pt-4 flex justify-center">
                                <CyberButton className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2">
                                            <span className="animate-spin">⟳</span> ACCESSING...
                                        </span>
                                    ) : (
                                        "AUTHENTICATE"
                                    )}
                                </CyberButton>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <Link href="/register" className="text-xs text-cyan-500 hover:text-cyan-300 tracking-widest transition-colors">
                                REGISTER NEW PROTOCOL ID
                            </Link>
                        </div>
                    </GlassCard>
                </motion.div>
            </div>
        </div>
    );
}
