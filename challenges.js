document.addEventListener('DOMContentLoaded', () => {
    const user = JSON.parse(localStorage.getItem('arise_user'));

    if (!user || !user.id) {
        window.location.href = 'login.html';
        return;
    }

    const grid = document.getElementById('challenge-grid');
    const modal = document.getElementById('challenge-modal');
    const closeModal = document.querySelector('.close-modal');
    let currentChallengeId = null;
    let allChallenges = []; // Store challenges globally to update after hint unlock

    // Ordered Categories
    const categories = ["Easy", "Medium", "Hard", "Extreme"];

    async function loadChallenges() {
        // Overlay is visible by default in HTML

        try {
            const response = await fetch(`/api/challenges?user_id=${user.id}`);
            const challenges = await response.json();
            allChallenges = challenges; // Store globally for later updates

            // Artificial delay to let the typing animation finish if data loads too fast
            await new Promise(r => setTimeout(r, 2000));

            const loader = document.getElementById('mission-loader');
            if (loader) {
                loader.classList.add('fade-out');
                setTimeout(() => loader.remove(), 1000); // Remove from DOM after transition
            }

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
                    // Only make clickable if not solved
                    if (!c.solved) {
                        card.addEventListener('click', () => openChallenge(c));
                        card.style.cursor = 'pointer';
                    } else {
                        card.style.cursor = 'not-allowed';
                        card.style.opacity = '0.7';
                    }
                    boxContainer.appendChild(card);
                });

                section.appendChild(boxContainer);
                grid.appendChild(section);
            }

        } catch (error) {
            console.error("Failed to load challenges", error);
        }
    }

    function openChallenge(challenge) {
        currentChallengeId = challenge.id;

        // Reset Modal with Data (Now Instant!)
        document.getElementById('modal-title').innerText = challenge.title;
        document.getElementById('modal-category').innerText = challenge.category;
        document.getElementById('modal-points').innerText = `${challenge.points} PTS`;
        document.getElementById('modal-description').innerText = challenge.description || "No description available."; // Use pre-loaded description

        // Clear and hide hint display to prevent old hints from showing
        const hintDisplay = document.getElementById('hint-display');
        hintDisplay.innerText = '';
        hintDisplay.classList.add('hidden');
        document.getElementById('submission-feedback').innerText = "";
        document.getElementById('flag-input').value = "";

        // Setup Hint Button
        const hintBtn = document.getElementById('unlock-hint-btn');
        const hintCost = document.getElementById('hint-cost');

        if (challenge.hint_unlocked) {
            hintBtn.style.display = 'none';
            // Show hint immediately if unlocked
            showHint(challenge.hint);
        } else {
            hintBtn.style.display = 'inline-block';
            hintCost.innerText = challenge.hint_cost;
        }

        modal.classList.add('active');
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
                // Update the challenge in the global array so hint persists on reopen
                const challenge = allChallenges.find(c => c.id === currentChallengeId);
                if (challenge) {
                    challenge.hint = data.hint;
                    challenge.hint_unlocked = true;
                }
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

                // Update Local User Data
                if (data.new_score !== undefined) user.score = data.new_score;

                if (data.new_rank && data.new_rank !== user.rank) {
                    alert(`⚠️ SYSTEM ALERT: RANK UPGRADED TO [ ${data.new_rank}-RANK ]`);
                    user.rank = data.new_rank;
                }

                // Save updated user state
                localStorage.setItem('arise_user', JSON.stringify(user));

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
        localStorage.removeItem('arise_user');
        window.location.href = 'login.html';
    });

    // Init
    loadChallenges();
});
