"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import GlassCard from "@/components/ui/GlassCard";
import CyberButton from "@/components/ui/CyberButton";
import { motion } from "framer-motion";

export default function RegisterPage() {
    const [formData, setFormData] = useState({
        username: "",
        email: "",
        country_code: "+91",
        contact: "",
        password: ""
    });
    const [status, setStatus] = useState({ message: "", type: "" });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const router = useRouter();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus({ message: "TRANSMITTING DATA...", type: "info" });

        // Basic validation
        if (!/^\d{10}$/.test(formData.contact)) {
            setStatus({ message: "INVALID CONTACT: MUST BE 10 DIGITS", type: "error" });
            setIsSubmitting(false);
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            const data = await res.json();

            if (res.ok) {
                setStatus({ message: "REGISTRATION SUCCESSFUL. REDIRECTING...", type: "success" });
                setTimeout(() => router.push("/login"), 2000);
            } else {
                setStatus({ message: `ERROR: ${data.error || 'FAILED'}`, type: "error" });
                setIsSubmitting(false);
            }
        } catch (err) {
            setStatus({ message: "SYSTEM UNREACHABLE", type: "error" });
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[var(--background)] overflow-hidden relative">
            <div className="fixed inset-0 pointer-events-none">
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
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse z-10"></div>
            </div>

            <main className="relative z-10 w-full max-w-lg p-4">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <GlassCard className="border-t-4 border-t-[var(--neon-green)]">
                        <header className="text-center mb-8">
                            <h1 className="text-3xl font-bold font-[family-name:var(--font-orbitron)] tracking-widest text-white">
                                SYSTEM <span className="text-[var(--neon-green)]">ACCESS</span>
                            </h1>
                            <p className="text-xs tracking-[0.3em] text-cyan-500/60 mt-2">
                                NEW OPERATIVE REGISTRATION
                            </p>
                        </header>

                        {status.message && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                className={`mb-6 p-3 text-center text-sm font-bold tracking-wider border ${status.type === 'error' ? 'text-red-500 border-red-500/30 bg-red-900/10' :
                                    status.type === 'success' ? 'text-[var(--neon-green)] border-green-500/30 bg-green-900/10' :
                                        'text-blue-400 border-blue-500/30 bg-blue-900/10'
                                    }`}
                            >
                                {status.message}
                            </motion.div>
                        )}

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-cyan-500/80 pl-1">Hunter Name</label>
                                <input
                                    type="text"
                                    required
                                    className="w-full bg-black/40 border border-[var(--glass-border)] p-3 text-white focus:border-[var(--neon-green)] focus:outline-none transition-colors"
                                    value={formData.username}
                                    onChange={e => setFormData({ ...formData, username: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-cyan-500/80 pl-1">Contact Frequency (Email)</label>
                                <input
                                    type="email"
                                    required
                                    className="w-full bg-black/40 border border-[var(--glass-border)] p-3 text-white focus:border-[var(--neon-green)] focus:outline-none transition-colors"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-cyan-500/80 pl-1">Secure Line</label>
                                <div className="flex gap-2">
                                    <select
                                        className="bg-black/40 border border-[var(--glass-border)] p-3 text-white focus:border-[var(--neon-green)] focus:outline-none w-24"
                                        value={formData.country_code}
                                        onChange={e => setFormData({ ...formData, country_code: e.target.value })}
                                        disabled={isSubmitting}
                                    >
                                        <option value="+91">+91</option>
                                        <option value="+1">+1</option>
                                        <option value="+44">+44</option>
                                        <option value="+81">+81</option>
                                    </select>
                                    <input
                                        type="tel"
                                        required
                                        maxLength="10"
                                        placeholder="10 Digits"
                                        className="flex-1 bg-black/40 border border-[var(--glass-border)] p-3 text-white focus:border-[var(--neon-green)] focus:outline-none transition-colors"
                                        value={formData.contact}
                                        onChange={e => setFormData({ ...formData, contact: e.target.value })}
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-[10px] uppercase tracking-widest text-cyan-500/80 pl-1">Access Key</label>
                                <input
                                    type="password"
                                    required
                                    className="w-full bg-black/40 border border-[var(--glass-border)] p-3 text-white focus:border-[var(--neon-green)] focus:outline-none transition-colors"
                                    value={formData.password}
                                    onChange={e => setFormData({ ...formData, password: e.target.value })}
                                    disabled={isSubmitting}
                                />
                            </div>

                            <div className="pt-4">
                                <CyberButton className="w-full !border-[var(--neon-green)] !text-[var(--neon-green)] hover:!bg-[var(--neon-green)]" disabled={isSubmitting}>
                                    {isSubmitting ? (
                                        <span className="flex items-center gap-2 justify-center">
                                            <span className="animate-spin">⟳</span> INITIATING...
                                        </span>
                                    ) : (
                                        "INITIATE AWAKENING"
                                    )}
                                </CyberButton>
                            </div>
                        </form>

                        <div className="mt-6 text-center">
                            <Link href="/login" className="text-xs text-white/50 hover:text-white tracking-widest transition-colors">
                                ALREADY AWAKENED? LOGIN
                            </Link>
                        </div>
                    </GlassCard>
                </motion.div>
            </main>
        </div>
    );
}
