"use client";

import Tilt from "react-parallax-tilt";

export default function GlassCard({ children, className = "", hoverEffect = true }) {
    const CardContent = (
        <div
            className={`glass-panel p-6 rounded-none relative overflow-hidden group ${className}`}
        >
            {/* Scanning Line Effect */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[rgba(0,243,255,0.05)] to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000"></div>

            {children}
        </div>
    );

    if (hoverEffect) {
        return (
            <Tilt
                tiltMaxAngleX={5}
                tiltMaxAngleY={5}
                perspective={1000}
                scale={1.02}
                transitionSpeed={1000}
                className="h-full"
            >
                {CardContent}
            </Tilt>
        );
    }

    return CardContent;
}
