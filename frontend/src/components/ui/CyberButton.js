"use client";

import { motion } from "framer-motion";

export default function CyberButton({ children, onClick, className = "" }) {
    return (
        <motion.button
            whileHover={{ scale: 1.05, boxShadow: "0 0 20px var(--primary-blue)" }}
            whileTap={{ scale: 0.95 }}
            onClick={onClick}
            className={`relative px-8 py-3 bg-transparent border border-[var(--primary-blue)] 
        text-[var(--primary-blue)] uppercase tracking-widest font-bold 
        transition-colors duration-300 hover:bg-[var(--primary-blue)] hover:text-black 
        ${className}`}
        >
            {children}
            {/* Decorative Corner Lines */}
            <span className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-[var(--primary-blue)]"></span>
            <span className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-[var(--primary-blue)]"></span>
            <span className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-[var(--primary-blue)]"></span>
            <span className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-[var(--primary-blue)]"></span>
        </motion.button>
    );
}
