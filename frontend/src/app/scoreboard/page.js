"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import GlassCard from "@/components/ui/GlassCard";
import { motion } from "framer-motion";

export default function ScoreboardPage() {
    const [board, setBoard] = useState([]);
    const [userRank, setUserRank] = useState(null);

    useEffect(() => {
        async function fetchLeaderboard() {
            try {
                const res = await fetch("/api/leaderboard");
                if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

                const data = await res.json();

                // DATA FORMAT FIX: Server returns array directly [ ... ] 
                // but some versions returned { leaderboard: [...] }
                // This handles both cases safely.
                const leaderboardData = Array.isArray(data) ? data : (data.leaderboard || []);

                if (Array.isArray(leaderboardData)) {
                    setBoard(leaderboardData);

                    // Check local user for highlighting
                    const storedUser = localStorage.getItem('arise_user');
                    if (storedUser) {
                        try {
                            const parsedUser = JSON.parse(storedUser);
                            const myEntry = leaderboardData.find(p => p.username === parsedUser.username);
                            if (myEntry) setUserRank(myEntry.rank);
                        } catch (e) { console.error("JSON Parse Error", e); }
                    }
                } else {
                    console.error("Invalid leaderboard data format:", data);
                    setBoard([]);
                }
            } catch (e) {
                console.error("Failed to load leaderboard:", e);
                setBoard([]);
            }
        }
        fetchLeaderboard();
    }, []);

    // Safety check to ensure we always map over an array
    const displayBoard = Array.isArray(board) ? board : [];

    const [currentUser, setCurrentUser] = useState(null);

    useEffect(() => {
        // Load user data on client mount
        const storedUser = localStorage.getItem('arise_user');
        if (storedUser) {
            try {
                setCurrentUser(JSON.parse(storedUser));
            } catch (e) { console.error("JSON Parse Error", e); }
        }
    }, []);

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] overflow-hidden">
            <Navbar />

            {/* Background Ambience */}
            <div className="fixed inset-0 pointer-events-none">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="absolute inset-0 w-full h-full object-cover z-0 opacity-40"
                >
                    <source src="/LW/sung-jin-woo-2.1920x1080.mp4" type="video/mp4" />
                </video>
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px] animate-pulse z-10"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-cyan-900/20 rounded-full blur-[120px] animate-pulse z-10"></div>
            </div>

            <main className="relative z-10 container mx-auto px-4 py-24">
                <motion.h1
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-6xl text-center font-bold tracking-widest neon-text mb-12 font-[family-name:var(--font-orbitron)]"
                >
                    GLOBAL RANKINGS
                </motion.h1>

                <div className="max-w-4xl mx-auto space-y-4">
                    {/* Header Row */}
                    <div className="grid grid-cols-[0.5fr_2fr_1fr] md:grid-cols-[0.5fr_3fr_1fr_1fr] gap-4 px-6 py-2 text-cyan-500/60 uppercase tracking-widest text-xs font-bold border-b border-cyan-500/20 mb-4">
                        <span>Rank</span>
                        <span>Operative</span>
                        <span className="text-right">Score</span>
                        <span className="text-right hidden md:block">Class</span>
                    </div>

                    {displayBoard.length === 0 && (
                        <div className="text-center text-cyan-500/50 py-8 font-mono tracking-widest">
                            NO DATA AVAILABLE OR SYSTEM OFFLINE
                        </div>
                    )}

                    {displayBoard.map((player, index) => (
                        <motion.div
                            key={player.username || index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.05 }}
                        >
                            <GlassCard
                                className={`flex flex-col justify-center !p-1 !bg-black/30 border-l-4 ${index === 0 ? "border-l-[var(--neon-green)] shadow-[0_0_15px_rgba(0,255,65,0.2)]" :
                                    index === 1 ? "border-l-yellow-400" :
                                        index === 2 ? "border-l-orange-500" : "border-l-[var(--primary-blue)]"
                                    }`}
                                hoverEffect={false}
                            >
                                <div className="grid grid-cols-[0.5fr_2fr_1fr] md:grid-cols-[0.5fr_3fr_1fr_1fr] gap-4 px-6 py-4 items-center">
                                    <span className="font-bold text-2xl font-[family-name:var(--font-orbitron)] text-white/50">#{index + 1}</span>
                                    <div className="flex flex-col">
                                        <span className="font-bold text-lg tracking-wider text-white truncate max-w-[150px] md:max-w-none">{player.username}</span>
                                        {index === 0 && <span className="text-[10px] text-[var(--neon-green)] tracking-widest">TOP OPERATIVE</span>}
                                    </div>
                                    <span className="text-right font-mono text-cyan-300">{player.score} PTS</span>
                                    <span className={`text-right font-bold hidden md:block ${player.rank === 'S' ? 'text-[var(--neon-green)]' :
                                        player.rank === 'A' ? 'text-yellow-400' :
                                            player.rank === 'B' ? 'text-cyan-400' : 'text-gray-400'
                                        }`}>
                                        [{player.rank}]
                                    </span>
                                </div>
                            </GlassCard>
                        </motion.div>
                    ))}
                </div>
            </main>

            {/* Personal Scoreboard Footer */}
            {currentUser && (() => {
                // Try to find live data in board, else fallback to storage
                const liveData = displayBoard.find(u => u.username === currentUser.username);
                const displayScore = liveData ? liveData.score : currentUser.score;
                const displayRank = liveData ? liveData.rank : currentUser.rank;
                const displayIndex = liveData ? displayBoard.indexOf(liveData) + 1 : 'N/A';

                return (
                    <motion.div
                        initial={{ y: 100 }}
                        animate={{ y: 0 }}
                        className="fixed bottom-0 left-0 right-0 bg-black/80 backdrop-blur-md border-t border-[var(--primary-blue)] p-4 z-50 shadow-[0_-5px_20px_rgba(0,243,255,0.1)]"
                    >
                        <div className="container mx-auto flex items-center justify-between max-w-4xl px-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full border-2 border-[var(--neon-green)] flex items-center justify-center bg-[var(--neon-green)]/10 font-bold text-[var(--neon-green)] font-mono">
                                    {displayRank}
                                </div>
                                <div>
                                    <div className="text-xs text-cyan-500/60 tracking-widest uppercase">OPERATIVE</div>
                                    <div className="text-white font-bold tracking-wider">{currentUser.username}</div>
                                </div>
                            </div>

                            <div className="flex items-center gap-8">
                                <div className="text-right hidden sm:block">
                                    <div className="text-xs text-cyan-500/60 tracking-widest uppercase">CLASS</div>
                                    <motion.div
                                        key={displayRank}
                                        initial={{ scale: 1.5, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        className={`font-mono font-bold text-xl ${displayRank === 'S' ? 'text-[var(--neon-green)] drop-shadow-[0_0_8px_rgba(0,255,65,0.8)]' :
                                            displayRank === 'A' ? 'text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.5)]' :
                                                'text-cyan-400'
                                            }`}
                                    >
                                        {displayRank}-TIER
                                    </motion.div>
                                </div>
                                <div className="text-right hidden md:block">
                                    <div className="text-xs text-cyan-500/60 tracking-widest uppercase">GLOBAL RANK</div>
                                    <div className="text-white font-mono font-bold text-lg">#{displayIndex}</div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xs text-cyan-500/60 tracking-widest uppercase">SCORE</div>
                                    <div className="text-[var(--primary-blue)] font-mono font-bold text-2xl">{displayScore}</div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                );
            })()}
        </div>
    );
}
