"use client";

import { motion, AnimatePresence } from "framer-motion";
import GlassCard from "./ui/GlassCard";
import CyberButton from "./ui/CyberButton";
import { useState, useEffect } from "react";

export default function ChallengeModal({ challenge, isOpen, onClose, onSolve, onHintUnlock }) {
    const [flag, setFlag] = useState("");
    const [feedback, setFeedback] = useState("");
    const [isSuccess, setIsSuccess] = useState(false);
    const [localHint, setLocalHint] = useState(null);
    const [hintError, setHintError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Reset state when challenge opens/changes
    useEffect(() => {
        if (challenge) {
            setFlag("");
            setFeedback("");
            setIsSuccess(false);
            setLocalHint(challenge.hint_unlocked ? challenge.hint : null);
            setHintError("");
            setIsSubmitting(false);
        }
    }, [challenge]);

    if (!isOpen || !challenge) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (isSubmitting) return; // Prevent double submission logic without visual disable

        const user = JSON.parse(localStorage.getItem('arise_user'));

        setIsSubmitting(true);
        setFeedback(""); // Clear previous feedback immediately

        try {
            const res = await fetch('/api/submit_flag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    challenge_id: challenge.id,
                    flag: flag
                })
            });
            const data = await res.json();

            if (data.correct) {
                setIsSuccess(true);
                setFeedback(data.message);

                // Update Local Storage with new stats
                const updatedUser = { ...user, score: data.new_score, rank: data.new_rank };
                localStorage.setItem('arise_user', JSON.stringify(updatedUser));

                if (onSolve) onSolve(challenge.id);
            } else {
                setIsSuccess(false);
                setFeedback(data.message);
            }
        } catch (err) {
            setFeedback("Transmission Failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const unlockHint = async () => {
        const user = JSON.parse(localStorage.getItem('arise_user'));
        try {
            const res = await fetch('/api/unlock_hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    challenge_id: challenge.id
                })
            });
            const data = await res.json();
            if (res.ok) {
                setLocalHint(data.hint);

                // Update Local Storage (deduct score)
                if (data.check_deducted) {
                    const updatedUser = { ...user, score: user.score - data.check_deducted };
                    localStorage.setItem('arise_user', JSON.stringify(updatedUser));
                }

                if (onHintUnlock) onHintUnlock(challenge.id, data.hint);
            } else {
                setHintError(data.error);
            }
        } catch (err) {
            setHintError("Hint System Offline");
        }
    };

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.8, y: 50, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.8, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-full max-w-2xl"
                >
                    <GlassCard className="relative border border-[var(--primary-blue)] !bg-black/90">
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 text-cyan-500 hover:text-white transition-colors"
                        >
                            ✖ CLOSE
                        </button>

                        <div className="mb-6 border-b border-cyan-500/30 pb-4">
                            <span className="text-xs tracking-[0.3em] text-[var(--neon-green)] uppercase block mb-1">
                                {challenge.category} // {challenge.points} PTS
                            </span>
                            <h2 className="text-2xl md:text-3xl font-bold font-[family-name:var(--font-orbitron)] text-white">
                                {challenge.title}
                            </h2>
                        </div>

                        <div className="prose prose-invert max-w-none text-cyan-100/80 mb-8 font-mono text-sm leading-relaxed">
                            {challenge.description}
                        </div>

                        {/* Hint Section */}
                        <div className="mb-8 p-4 bg-blue-900/10 border border-blue-500/20 rounded">
                            {!localHint ? (
                                <div className="flex items-center justify-between">
                                    <span className="text-xs tracking-widest text-cyan-500">NEED INTEL? COST: {challenge.hint_cost} PTS</span>
                                    <button
                                        onClick={unlockHint}
                                        className="text-xs border border-yellow-500/50 text-yellow-500 px-3 py-1 hover:bg-yellow-500/10 transition-colors"
                                    >
                                        UNLOCK HINT
                                    </button>
                                </div>
                            ) : (
                                <div className="text-sm text-yellow-400 font-mono">
                                    <span className="block text-[10px] uppercase opacity-50 mb-1">Decrypted Hint:</span>
                                    {localHint}
                                </div>
                            )}
                            {hintError && <div className="text-red-400 text-xs mt-2">{hintError}</div>}
                        </div>

                        <div className="space-y-4">
                            <input
                                type="text"
                                value={flag}
                                onChange={(e) => setFlag(e.target.value)}
                                placeholder="ENTER FLAG (e.g. ARISE{...})"
                                className="w-full bg-black/60 border border-cyan-500/30 p-4 text-white font-mono focus:border-[var(--primary-blue)] focus:outline-none focus:shadow-[0_0_15px_rgba(0,243,255,0.2)]"
                            />

                            <CyberButton onClick={handleSubmit} className="w-full">
                                {isSubmitting ? (
                                    <span className="animate-pulse tracking-widest">PROCESSING...</span>
                                ) : isSuccess ? (
                                    "TRANSMISSION CONFIRMED"
                                ) : (
                                    "SUBMIT FLAG"
                                )}
                            </CyberButton>

                            {feedback && (
                                <motion.div
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`text-center p-2 text-sm tracking-widest font-bold ${isSuccess ? "text-[var(--neon-green)]" : "text-red-500"
                                        }`}
                                >
                                    {feedback}
                                </motion.div>
                            )}
                        </div>
                    </GlassCard>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
