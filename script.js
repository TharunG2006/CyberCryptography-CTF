document.addEventListener('DOMContentLoaded', () => {
    console.log("SYSTEM > PROTOCOL INITIATED");

    // Animate the HP/MP bars on load (only if they exist)
    const hpBar = document.querySelector('.bar-fill.hp');
    const mpBar = document.querySelector('.bar-fill.mp');

    if (hpBar && mpBar) {
        // Reset widths first
        const targetHp = hpBar.style.width;
        const targetMp = mpBar.style.width;
        hpBar.style.width = '0%';
        mpBar.style.width = '0%';

        setTimeout(() => {
            hpBar.style.transition = 'width 1.5s ease-out';
            mpBar.style.transition = 'width 1.5s ease-out';
            hpBar.style.width = targetHp;
            mpBar.style.width = targetMp;
        }, 500);
    }

    // Quest interaction
    const quests = document.querySelectorAll('.quest-item');
    quests.forEach(quest => {
        quest.addEventListener('click', () => {
            const status = quest.querySelector('.quest-status');
            const name = quest.querySelector('.quest-name').innerText;

            if (status.classList.contains('locked')) {
                showSystemMessage("ERROR: LEVEL TOO LOW", true);
                return;
            }

            if (status.innerText === 'INCOMPLETE') {
                status.innerText = 'ACCEPTED';
                status.style.color = 'var(--primary-blue)';
                showSystemMessage(`QUEST ACCEPTED: ${name}`);
            } else if (status.innerText === 'ACCEPTED') {
                // Simulate completion check or link
                showSystemMessage(`NAVIGATING TO: ${name} ...`);
            }
        });
    });

    // Random System Messages
    const systemAlertConfig = [
        "DUNGEON BREAK DETECTED",
        "NEW QUEST ARRIVED",
        "PLAYER STATUS UPDATED"
    ];

    setInterval(() => {
        const randomMsg = systemAlertConfig[Math.floor(Math.random() * systemAlertConfig.length)];
        // Ideally we would update the alert ticker, but let's keep it static for now to not be annoying
    }, 10000);
});

function showSystemMessage(text, isError = false) {
    // Create a temporary popup
    const msg = document.createElement('div');
    msg.style.position = 'fixed';
    msg.style.bottom = '20px';
    msg.style.right = '20px';
    msg.style.background = isError ? 'rgba(255, 0, 0, 0.2)' : 'rgba(3, 90, 166, 0.9)';
    msg.style.border = `1px solid ${isError ? '#ff3333' : '#2de2e6'}`;
    msg.style.color = '#fff';
    msg.style.padding = '15px 25px';
    msg.style.fontFamily = "'Orbitron', sans-serif";
    msg.style.zIndex = '1000';
    msg.style.boxShadow = '0 0 15px rgba(0,0,0,0.5)';
    msg.style.backdropFilter = 'blur(5px)';
    msg.style.transform = 'translateY(100px)';
    msg.style.transition = 'transform 0.3s ease-out';

    msg.innerText = text;

    document.body.appendChild(msg);

    // Trigger animation
    requestAnimationFrame(() => {
        msg.style.transform = 'translateY(0)';
    });

    // Remove after 3 seconds
    setTimeout(() => {
        msg.style.transform = 'translateY(100px)';
        setTimeout(() => msg.remove(), 300);
    }, 3000);
}
