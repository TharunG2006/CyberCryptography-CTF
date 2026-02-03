const { useState, useEffect } = React;

/* --- Components --- */

const SystemAlert = ({ message }) => {
    if (!message) return null;
    return (
        <div
            style={{
                position: 'fixed', bottom: '20px', right: '20px',
                background: 'rgba(3, 90, 166, 0.9)', border: '1px solid #2de2e6',
                color: '#fff', padding: '15px 25px', fontFamily: "'Orbitron', sans-serif",
                zIndex: 1000, boxShadow: '0 0 15px rgba(0,0,0,0.5)',
                backdropFilter: 'blur(5px)', animation: 'fadeIn 0.3s ease-out'
            }}
        >
            {message}
        </div>
    );
};

const Header = ({ user, logout }) => (
    <header className="system-header fade-in">
        <div className="system-alert">
            <span className="alert-icon">!</span>
            <span className="alert-text">LIVE SYSTEM RANKINGS</span>
        </div>
        <h1>HUNTER <span className="arise-text">ASSOCIATION</span></h1>
        <p className="subtitle">Official Hunter Rankings</p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '5px' }}>
                <span style={{ color: 'var(--primary-blue)', fontFamily: 'var(--font-heading)' }}>
                    WELCOME, {user ? user.username.toUpperCase() : 'GUEST'}
                </span>
                <button
                    onClick={logout}
                    className="system-btn"
                    style={{ width: 'auto', padding: '5px 10px', fontSize: '0.8rem', border: '1px solid #ff3333', color: '#ff3333' }}
                >
                    LOGOUT
                </button>
            </div>
        </div>
    </header>
);

const PlayerStatus = ({ user, rank }) => {
    const [hp, setHp] = useState(0);
    const [mp, setMp] = useState(0);

    useEffect(() => {
        setTimeout(() => setHp(100), 500); // Animation only
        setTimeout(() => setMp(85), 600);
    }, []);

    return (
        <section className="panel status-panel slide-in-left" style={{ animationDelay: '0.2s' }}>
            <h2 className="panel-title">YOUR STATUS</h2>
            <div className="status-content">
                <InfoRow label="NAME" value={user ? user.username : "GUEST"} />
                <div className="info-row">
                    <span className="label">RANK</span>
                    <span className="value" style={{ color: getRankColor(rank), fontSize: '1.2rem' }}>{rank}-RANK</span>
                </div>
                <InfoRow label="TITLE" value={user ? "Awakened" : "None"} />
            </div>
        </section>
    );
};

const InfoRow = ({ label, value }) => (
    <div className="info-row">
        <span className="label">{label}</span>
        <span className="value">{value}</span>
    </div>
);

const getRankColor = (rank) => {
    switch (rank) {
        case 'S': return '#ffd700'; // Gold
        case 'A': return '#c0c0c0'; // Silver
        case 'B': return '#cd7f32'; // Bronze
        case 'C': return '#00ff00';
        case 'D': return '#00ffff';
        default: return '#ffffff';
    }
}

const Leaderboard = ({ players }) => (
    <section className="panel leaderboard-panel slide-in-right" style={{ animationDelay: '0.4s' }}>
        <h2 className="panel-title">TOP HUNTERS</h2>
        <table className="leaderboard-table">
            <thead>
                <tr>
                    <th>RANK</th>
                    <th>HUNTER</th>
                    <th>CLASS</th>
                    <th>SCORE</th>
                </tr>
            </thead>
            <tbody>
                {players.length === 0 ? (
                    <tr><td colSpan="4" style={{ textAlign: 'center' }}>NO HUNTERS REGISTERED</td></tr>
                ) : (
                    players.map((p, i) => (
                        <tr key={i}>
                            <td className={`rank-${i + 1}`}>{i + 1}</td>
                            <td>{p.username}</td>
                            <td style={{ color: getRankColor(p.hunter_rank), fontWeight: 'bold' }}>{p.hunter_rank}-RANK</td>
                            <td>{p.score}</td>
                        </tr>
                    ))
                )}
            </tbody>
        </table>
    </section>
);

/* --- Main App Container --- */

const App = () => {
    const [user, setUser] = useState(null);
    const [leaderboard, setLeaderboard] = useState([]);
    const [msg, setMsg] = useState(null);

    const showMessage = (text) => {
        setMsg(text);
        setTimeout(() => setMsg(null), 3000);
    };

    useEffect(() => {
        // Authenticate
        const storedUser = localStorage.getItem('arise_user');
        if (!storedUser) {
            window.location.href = 'login.html';
            return;
        }
        setUser(JSON.parse(storedUser));

        // Fetch Leaderboard
        fetchLeaderboard();
    }, []);

    const fetchLeaderboard = async () => {
        try {
            const res = await fetch('/api/leaderboard');
            const data = await res.json();
            if (res.ok) {
                // process ranks logic
                const rankings = data.map(p => ({
                    ...p,
                    hunter_rank: calculateRank(p.score)
                }));
                setLeaderboard(rankings);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const calculateRank = (score) => {
        if (score >= 3000) return 'S';
        if (score >= 1500) return 'A';
        if (score >= 800) return 'B';
        if (score >= 400) return 'C';
        if (score >= 100) return 'D';
        return 'E';
    };

    const handleLogout = () => {
        localStorage.removeItem('arise_user');
        window.location.href = 'login.html';
    };

    if (!user) return null; // Wait for redirect or load

    return (
        <div className="main-interface">
            {msg && <SystemAlert message={msg} />}
            <Header user={user} logout={handleLogout} />
            <div className="grid-layout">
                <PlayerStatus user={user} rank={calculateRank(user.score || 0)} />
                {/* Could add QuestList back here if needed or replace it entirely with Scoreboard focus. 
                    I'll keep it simple for now and just show leaderboard prominent. 
                    Wait, grid layout expects 2 columns usually. I'll make Leaderboard full width or 2 cols. */}
                <Leaderboard players={leaderboard} />
            </div>

        </div>
    );
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
