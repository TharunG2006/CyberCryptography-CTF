document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('user'));

    if (!user || !user.id) {
        window.location.href = 'login.html';
        return;
    }

    const grid = document.getElementById('challenge-grid');
    const modal = document.getElementById('challenge-modal');
    const closeModal = document.querySelector('.close-modal');
    let currentChallengeId = null;

    // Ordered Categories
    const categories = ["Easy", "Medium", "Hard", "Extreme"];

    async function loadChallenges() {
        try {
            const response = await fetch(`/api/challenges?user_id=${user.id}`);
            const challenges = await response.json();

            grid.innerHTML = ''; // Clear existing

            // Group by Category
            const grouped = {};
            categories.forEach(cat => grouped[cat] = []);
            challenges.forEach(c => {
                if (grouped[c.category]) grouped[c.category].push(c);
            });

            // Render Sections
            for (const category of categories) {
                if (grouped[category].length === 0) continue;

                const section = document.createElement('div');
                section.className = 'difficulty-section';
                section.innerHTML = `<h3 class="section-title">${category.toUpperCase()}</h3>`;

                const boxContainer = document.createElement('div');
                boxContainer.className = 'box-container';

                grouped[category].forEach(c => {
                    const card = document.createElement('div');
                    card.className = `challenge-card ${c.solved ? 'solved' : ''} ${category.toLowerCase()}-border`;
                    card.innerHTML = `
                        <div class="card-header">
                            <span class="card-points">${c.points}</span>
                        </div>
                        <div class="card-title">${c.title}</div>
                        ${c.solved ? '<div class="solved-badge">SOLVED</div>' : ''}
                    `;
                    card.addEventListener('click', () => openChallenge(c));
                    boxContainer.appendChild(card);
                });

                section.appendChild(boxContainer);
                grid.appendChild(section);
            }

        } catch (error) {
            console.error("Failed to load challenges", error);
        }
    }

    async function openChallenge(challenge) {
        currentChallengeId = challenge.id;

        // Reset Modal
        document.getElementById('modal-title').innerText = challenge.title;
        document.getElementById('modal-category').innerText = challenge.category;
        document.getElementById('modal-points').innerText = `${challenge.points} PTS`;
        document.getElementById('modal-description').innerText = "Loading details...";
        document.getElementById('hint-display').classList.add('hidden');
        document.getElementById('submission-feedback').innerText = "";
        document.getElementById('flag-input').value = "";

        // Setup Hint Button
        const hintBtn = document.getElementById('unlock-hint-btn');
        const hintCost = document.getElementById('hint-cost');
        if (challenge.hint_unlocked) {
            hintBtn.style.display = 'none';
        } else {
            hintBtn.style.display = 'inline-block';
            hintCost.innerText = challenge.hint_cost;
        }

        modal.classList.add('active');

        // Fetch Details
        try {
            const res = await fetch(`/api/challenge_details?user_id=${user.id}&challenge_id=${challenge.id}`);
            const details = await res.json();

            document.getElementById('modal-description').innerText = details.description;

            if (details.hint) {
                // Hint already unlocked
                showHint(details.hint);
            }
        } catch (e) {
            document.getElementById('modal-description').innerText = "Error loading details.";
        }
    }

    function showHint(text) {
        const display = document.getElementById('hint-display');
        const btn = document.getElementById('unlock-hint-btn');
        display.innerText = `HINT: ${text}`;
        display.classList.remove('hidden');
        btn.style.display = 'none';
    }

    // Hint Unlock
    document.getElementById('unlock-hint-btn').addEventListener('click', async () => {
        if (!confirm("Are you sure? This will deduct points.")) return;

        try {
            const res = await fetch('/api/unlock_hint', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    challenge_id: currentChallengeId
                })
            });
            const data = await res.json();

            if (res.ok) {
                showHint(data.hint);
            } else {
                alert(data.error || "Failed to unlock hint");
            }
        } catch (e) {
            alert("Connection error");
        }
    });

    // Flag Submission
    document.getElementById('submit-flag-btn').addEventListener('click', async () => {
        const flag = document.getElementById('flag-input').value;
        const feedback = document.getElementById('submission-feedback');

        if (!flag) return;

        try {
            const res = await fetch('/api/submit_flag', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: user.id,
                    challenge_id: currentChallengeId,
                    flag: flag
                })
            });
            const data = await res.json();

            feedback.innerText = data.message;
            if (data.correct) {
                feedback.className = "feedback-text success";
                setTimeout(() => {
                    modal.classList.remove('active');
                    loadChallenges(); // Refresh grid state
                }, 1500);
            } else {
                feedback.className = "feedback-text error";
            }
        } catch (e) {
            feedback.innerText = "Error submitting flag";
        }
    });

    // Close Modal
    closeModal.addEventListener('click', () => modal.classList.remove('active'));
    window.addEventListener('click', (e) => {
        if (e.target === modal) modal.classList.remove('active');
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => {
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Init
    loadChallenges();
});
