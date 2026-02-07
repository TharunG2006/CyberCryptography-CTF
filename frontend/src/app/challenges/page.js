"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/ui/GlassCard";
import ChallengeModal from "@/components/ChallengeModal";
import { motion } from "framer-motion";

const CATEGORIES = ["Easy", "Medium", "Hard", "Extreme"];

export default function ChallengesPage() {
    const [challenges, setChallenges] = useState([]);
    const [selectedChallenge, setSelectedChallenge] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch challenges on load
    useEffect(() => {
        async function fetchChallenges() {
            const user = JSON.parse(localStorage.getItem('arise_user'));
            if (!user) {
                window.location.href = '/login';
                return;
            }

            try {
                const res = await fetch(`/api/challenges?user_id=${user.id}`);
                const data = await res.json();
                setChallenges(data);

                // Artificial delay for "decrypting" effect
                setTimeout(() => setIsLoading(false), 800);
            } catch (e) {
                console.error("Failed to load missions");
            }
        }
        fetchChallenges();
    }, []); // Run once on mount

    const groupedChallenges = CATEGORIES.reduce((acc, cat) => {
        acc[cat] = challenges.filter(c => c.category === cat);
        return acc;
    }, {});

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[var(--background)] relative overflow-hidden">
                {/* Background Video for Loading */}
                <div className="absolute inset-0 z-0">
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover opacity-20"
                    >
                        <source src="/LW/monarch-of-shadows.1920x1080.mp4" type="video/mp4" />
                    </video>
                    <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-[var(--background)]"></div>
                </div>

                <div className="relative z-10 text-center space-y-4">
                    <div className="w-16 h-16 border-4 border-t-[var(--primary-blue)] border-r-transparent border-b-[var(--neon-green)] border-l-transparent rounded-full animate-spin mx-auto"></div>
                    <h2 className="text-xl neon-text tracking-widest animate-pulse">DECRYPTING MISSION FILES...</h2>
                </div>
            </div>
        );
    }

    const handleSolve = (challengeId) => {
        setChallenges(prev => prev.map(c =>
            c.id === challengeId ? { ...c, solved: true } : c
        ));
        // Also close modal after a short delay if desired, or let user close it
        // setSelectedChallenge(null); 
    };

    const handleHintUnlock = (challengeId, hintText) => {
        setChallenges(prev => prev.map(c =>
            c.id === challengeId ? { ...c, hint_unlocked: true, hint: hintText } : c
        ));
    };

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] pb-20">
            <Navbar />

            {/* Background Video/Effect */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover opacity-20"
                >
                    <source src="/LW/monarch-of-shadows.1920x1080.mp4" type="video/mp4" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-[var(--background)] via-transparent to-[var(--background)]"></div>
            </div>

            <main className="relative z-10 container mx-auto px-4 py-24 space-y-16">
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-2"
                >
                    <h1 className="text-5xl md:text-6xl font-bold font-[family-name:var(--font-orbitron)] tracking-widest text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        ACTIVE MISSIONS
                    </h1>
                    <p className="text-cyan-500/60 font-mono tracking-[0.5em] text-sm">
                        SELECT A TARGET TO ENGAGE
                    </p>
                </motion.div>

                {CATEGORIES.map((category, catIndex) => (
                    <div key={category} className="space-y-6">
                        <motion.div
                            initial={{ opacity: 0, x: -50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: false, amount: 0.1 }}
                            className="flex items-center gap-4"
                        >
                            <div className={`h-8 w-1 ${category === 'Easy' ? 'bg-green-400' :
                                category === 'Medium' ? 'bg-yellow-400' :
                                    category === 'Hard' ? 'bg-orange-500' : 'bg-red-600'
                                }`}></div>
                            <h2 className="text-3xl font-bold tracking-widest uppercase font-[family-name:var(--font-rajdhani)] text-white/90">
                                {category} SECTOR
                            </h2>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                        </motion.div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {groupedChallenges[category]?.map((challenge, index) => (
                                <motion.div
                                    key={challenge.id}
                                    initial="hidden"
                                    whileInView="visible"
                                    viewport={{ once: false, amount: 0.2 }}
                                    variants={{
                                        hidden: { opacity: 0, scale: 0.8, transition: { duration: 0.3 } },
                                        visible: { opacity: 1, scale: 1, transition: { delay: index * 0.1, duration: 0.5 } }
                                    }}
                                >
                                    <div onClick={() => !challenge.solved && setSelectedChallenge(challenge)}>
                                        <GlassCard
                                            className={`h-48 flex flex-col justify-between cursor-pointer border hover:border-[var(--primary-blue)] transition-all ${challenge.solved ? 'opacity-50 grayscale border-green-500/30 !bg-green-900/10' : 'border-white/5'
                                                }`}
                                            hoverEffect={!challenge.solved}
                                        >
                                            <div className="flex justify-between items-start">
                                                <span className="text-4xl font-bold text-white/10 font-[family-name:var(--font-orbitron)]">
                                                    {(index + 1).toString().padStart(2, '0')}
                                                </span>
                                                <span className="text-[var(--primary-blue)] font-mono text-sm border border-[var(--primary-blue)] px-2 py-0.5 rounded">
                                                    {challenge.points} PTS
                                                </span>
                                            </div>

                                            <h3 className="text-xl font-bold text-white tracking-wide mt-2">
                                                {challenge.title}
                                            </h3>

                                            <div className="mt-auto pt-4 flex justify-between items-center">
                                                <span className={`text-xs tracking-widest ${challenge.solved ? 'text-green-500' : 'text-cyan-500/60'}`}>
                                                    {challenge.solved ? 'MISSION ACCOMPLISHED' : 'STATUS: ACTIVE'}
                                                </span>
                                                {challenge.solved && (
                                                    <span className="text-green-400">✓</span>
                                                )}
                                            </div>
                                        </GlassCard>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                ))}
            </main>

            <ChallengeModal
                challenge={selectedChallenge}
                isOpen={!!selectedChallenge}
                onClose={() => setSelectedChallenge(null)}
                onSolve={handleSolve}
                onHintUnlock={handleHintUnlock}
            />
        </div>
    );
}
