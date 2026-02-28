'use client';
import { useState, useEffect } from 'react';

export default function AdminPortal() {
    const [status, setStatus] = useState(null);
    const [adminKey, setAdminKey] = useState('');
    const [users, setUsers] = useState([]);
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const [isUsersLoading, setIsUsersLoading] = useState(false);

    useEffect(() => {
        fetchStatus();
    }, []);

    // Background auto-refresh for operative data (15s)
    useEffect(() => {
        if (users.length > 0 && adminKey) {
            const interval = setInterval(fetchUsers, 15000);
            return () => clearInterval(interval);
        }
    }, [users.length, adminKey]);

    const fetchUsers = async () => {
        if (!adminKey) {
            setMessage('ERROR: ADMIN_KEY REQUIRED FOR DATA SYNC');
            return;
        }
        setIsUsersLoading(true);
        try {
            const res = await fetch(`/api/admin/users?admin_key=${adminKey}`);
            const data = await res.json();
            if (res.ok) {
                setUsers(data);
                setMessage('SUCCESS: OPERATIVE DATA SYNCHRONIZED');
            } else {
                setMessage(`DENIED: ${data.error}`);
            }
        } catch (err) {
            setMessage('CRITICAL: DATA_SYNC_FAILURE');
        } finally {
            setIsUsersLoading(false);
        }
    };

    const exportToCSV = () => {
        if (users.length === 0) {
            setMessage('ERROR: NO DATA TO EXPORT');
            return;
        }

        const headers = ["Username", "Email", "Contact", "Score", "Class", "Violations", "Verified", "Last Mission"];
        const rows = users.map(u => [
            u.username,
            u.email,
            u.contact,
            u.score,
            u.rank,
            u.tab_switches || 0,
            u.is_verified ? "YES" : "NO",
            u.last_solve_at ? new Date(u.last_solve_at).toLocaleString() : "---"
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map(r => r.map(field => `"${String(field).replace(/"/g, '""')}"`).join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `operative_mission_data_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setMessage('SUCCESS: MISSION DATA EXPORTED');
    };

    const fetchStatus = async () => {
        try {
            const res = await fetch('/api/site-status');
            const data = await res.json();
            setStatus(data.event_locked);
            setLoading(false);
        } catch (err) {
            console.error('Failed to fetch status', err);
            setLoading(false);
        }
    };

    const handleToggle = async (lock) => {
        if (!adminKey) {
            setMessage('ERROR: ADMIN_KEY REQUIRED');
            return;
        }

        try {
            const res = await fetch('/api/admin/toggle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ admin_key: adminKey, lock: lock })
            });
            const data = await res.json();
            if (res.ok) {
                setStatus(data.event_locked);
                setMessage(`SUCCESS: SYSTEM ${data.event_locked ? 'ENCRYPTED' : 'DECRYPTED'}`);
            } else {
                setMessage(`DENIED: ${data.error}`);
            }
        } catch (err) {
            setMessage('CRITICAL: CONNECTION_FAILURE');
        }
    };

    if (loading) return <div className="min-h-screen bg-[#050914] text-[#2de2e6] flex items-center justify-center">INITIALIZING NEURAL LINK...</div>;

    return (
        <div className="min-h-screen bg-[#050914] text-[#e0e6ed] p-8 font-mono relative overflow-hidden">
            {/* Background Grid */}
            <div className="absolute inset-0 opacity-10 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#2de2e6 1px, transparent 1px), linear-gradient(90deg, #2de2e6 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>

            <div className="max-w-4xl mx-auto relative z-10">
                <header className="mb-12 border-l-4 border-[#ff003c] pl-6 py-2">
                    <h1 className="text-4xl font-bold text-[#ff003c] tracking-tighter uppercase italic">Hunter Master Control Panel</h1>
                    <p className="text-[#8b9bb4] mt-1 text-sm">COORDINATE: ARISE // LEVEL 4 ACCESS</p>
                </header>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Status Card */}
                    <div className="bg-[#0a0f1e] border border-[#2de2e6] p-8 shadow-[0_0_20px_rgba(45,226,230,0.1)]">
                        <h2 className="text-[#2de2e6] uppercase font-bold mb-4 tracking-widest text-sm">System Frequency</h2>
                        <div className={`text-6xl font-black mb-4 ${status ? 'text-[#ff003c]' : 'text-[#2de2e6]'}`}>
                            {status ? 'ENCRYPTED' : 'DECRYPTED'}
                        </div>
                        <p className="text-[#8b9bb4] text-xs leading-relaxed">
                            {status
                                ? "Missions are currently locked. Operatives can register but cannot access data protocols."
                                : "Systems are standard. All operatives have authorized access to data protocols."}
                        </p>
                    </div>

                    {/* Controls Card */}
                    <div className="bg-[#0a0f1e] border border-[#2de2e6] p-8">
                        <h2 className="text-[#2de2e6] uppercase font-bold mb-6 tracking-widest text-sm">Authorization</h2>
                        <input
                            type="password"
                            placeholder="ADMIN ACCESS KEY"
                            value={adminKey}
                            onChange={(e) => setAdminKey(e.target.value)}
                            className="w-full bg-[#050914] border border-[#2de2e6]/30 p-4 text-[#2de2e6] mb-6 focus:border-[#2de2e6] outline-none placeholder:text-[#2de2e6]/20 transition-all"
                        />

                        <div className="space-y-4">
                            <button
                                onClick={() => handleToggle(true)}
                                className={`w-full py-4 font-bold border-2 transition-all ${status ? 'border-[#ff003c]/30 text-[#ff003c]/30 cursor-not-allowed' : 'border-[#ff003c] text-[#ff003c] hover:bg-[#ff003c] hover:text-[#000] shadow-[0_0_15px_rgba(255,0,60,0.2)]'}`}
                            >
                                INITIATE SYSTEM LOCK
                            </button>
                            <button
                                onClick={() => handleToggle(false)}
                                className={`w-full py-4 font-bold border-2 transition-all ${!status ? 'border-[#2de2e6]/30 text-[#2de2e6]/30 cursor-not-allowed' : 'border-[#2de2e6] text-[#2de2e6] hover:bg-[#2de2e6] hover:text-[#000] shadow-[0_0_15px_rgba(45,226,230,0.2)]'}`}
                            >
                                AUTHORIZE SYSTEM DECRYPT
                            </button>
                        </div>

                        {message && (
                            <div className="mt-8 p-4 bg-[#050914] border-l-2 border-[#2de2e6] text-[#2de2e6] text-xs font-bold font-sans">
                                [OOS] &gt; {message}
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8">
                    <div className="flex flex-wrap items-center gap-4 mb-4">
                        <button
                            onClick={fetchUsers}
                            className="flex items-center gap-2 text-xs font-bold text-[#2de2e6] hover:text-white transition-colors uppercase tracking-[0.2em]"
                            disabled={isUsersLoading}
                        >
                            {isUsersLoading ? '♻ SYNCHRONIZING...' : '⌬ LOAD OPERATIVE DATA'}
                        </button>

                        {users.length > 0 && (
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 text-xs font-bold text-green-500 hover:text-green-400 transition-colors uppercase tracking-[0.2em] border border-green-500/30 px-3 py-1 bg-green-500/5"
                            >
                                ⌬ EXCEL EXPORT
                            </button>
                        )}
                    </div>

                    {users.length > 0 && (
                        <div className="bg-[#0a0f1e] border border-[#2de2e6]/20 overflow-x-auto">
                            <table className="w-full text-left text-xs font-sans">
                                <thead className="bg-[#111827] text-[#2de2e6] uppercase tracking-wider border-b border-[#2de2e6]/20">
                                    <tr>
                                        <th className="p-4 font-bold">Operative</th>
                                        <th className="p-4 font-bold">Email</th>
                                        <th className="p-4 font-bold">Contact</th>
                                        <th className="p-4 font-bold text-right">Score</th>
                                        <th className="p-4 font-bold text-center">Class</th>
                                        <th className="p-4 font-bold text-center">Violations</th>
                                        <th className="p-4 font-bold text-center">Status</th>
                                        <th className="p-4 font-bold text-right">Last Mission</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#2de2e6]/10">
                                    {users.map((user, i) => (
                                        <tr key={i} className="hover:bg-[#2de2e6]/5 transition-colors">
                                            <td className="p-4 font-bold text-white">{user.username}</td>
                                            <td className="p-4 text-[#8b9bb4]">{user.email}</td>
                                            <td className="p-4 text-[#8b9bb4] font-mono">{user.contact}</td>
                                            <td className="p-4 text-right font-bold text-[#2de2e6]">{user.score}</td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-sm font-bold ${user.rank === 'S' ? 'bg-green-500/10 text-green-500' :
                                                    user.rank === 'A' ? 'bg-yellow-500/10 text-yellow-500' :
                                                        'bg-cyan-500/10 text-cyan-500'
                                                    }`}>
                                                    {user.rank}
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                <span className={`px-2 py-1 rounded-sm font-bold ${user.tab_switches > 5 ? 'bg-red-500/10 text-red-500' :
                                                    user.tab_switches > 0 ? 'bg-orange-500/10 text-orange-400' :
                                                        'text-[#8b9bb4]'
                                                    }`}>
                                                    {user.tab_switches || 0} TABS
                                                </span>
                                            </td>
                                            <td className="p-4 text-center">
                                                {user.is_verified ? (
                                                    <span className="text-green-500 text-[10px] tracking-tighter">● VERIFIED</span>
                                                ) : (
                                                    <span className="text-red-500 text-[10px] tracking-tighter">○ UNVERIFIED</span>
                                                )}
                                            </td>
                                            <td className="p-4 text-right text-[10px] text-[#8b9bb4] font-mono">
                                                {user.last_solve_at ? new Date(user.last_solve_at).toLocaleString() : '---'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <footer className="mt-12 pt-8 border-t border-[#2de2e6]/10 text-center">
                    <p className="text-[#8b9bb4] text-[10px] uppercase tracking-[0.3em]">Protocol Arise // Admin Terminal // Do Not Disclose</p>
                </footer>
            </div>
        </div>
    );
}
