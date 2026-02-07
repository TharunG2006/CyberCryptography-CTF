"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  return (
    <div className="flex items-center justify-center min-h-screen relative overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover z-0"
      >
        <source src="/LW/sung-jin-woo-2.1920x1080.mp4" type="video/mp4" />
      </video>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-0"></div>

      <div className="relative z-10 text-center space-y-8 p-4">
        <div className="space-y-4">
          <h1 className="text-5xl md:text-7xl font-bold neon-text animate-pulse tracking-tighter">
            PROTOCOL: ARISE
          </h1>
          <div className="h-1 w-64 mx-auto bg-gradient-to-r from-transparent via-[var(--primary-blue)] to-transparent opacity-80"></div>
          <p className="text-cyan-300 font-[family-name:var(--font-rajdhani)] text-xl tracking-[0.5em] animate-pulse">
            SYSTEM ONLINE
          </p>
        </div>

        <button
          onClick={() => {
            const user = localStorage.getItem('arise_user');
            router.push(user ? '/scoreboard' : '/login');
          }}
          className="group relative px-8 py-4 bg-transparent overflow-hidden"
        >
          <div className="absolute inset-0 w-full h-full border border-[var(--primary-blue)] opacity-50 group-hover:opacity-100 transition-opacity"></div>
          <div className="absolute inset-0 w-full h-full bg-[var(--primary-blue)]/10 group-hover:bg-[var(--primary-blue)]/20 transition-colors"></div>
          <span className="relative text-cyan-400 font-mono tracking-[0.2em] group-hover:text-white transition-colors">
            [ ESTABLISH LINK ]
          </span>
        </button>
      </div>
    </div>
  );
}
