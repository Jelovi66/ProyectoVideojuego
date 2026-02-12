document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const scoreDisplay = document.getElementById('score');
    const livesDisplay = document.getElementById('lives');
    const finalScoreDisplay = document.getElementById('final-score');
    const modal = document.getElementById('game-over-modal');
    const haystack = document.getElementById('haystack');

    let score = 0;
    let lives = 4;
    let isGameOver = false;
    let spawnInterval;
    let cows = []; // Array to track cow objects
    let difficultyMultiplier = 1;

    // --- Game Constants ---
    const INITIAL_SPAWN_RATE = 2000; // ms
    const MIN_SPAWN_RATE = 800;
    const HUNGER_DURATION = 10000; // Time (ms) for a cow to starve

    // --- Init ---
    function init() {
        // Read lives from URL
        const urlParams = new URLSearchParams(window.location.search);
        const livesParam = urlParams.get('lives');
        if (livesParam) {
            lives = parseInt(livesParam, 10);
        }
        updateLivesDisplay();
        startGame();
    }

    function updateLivesDisplay() {
        let hearts = '';
        for (let i = 0; i < lives; i++) {
            hearts += '❤️';
        }
        livesDisplay.textContent = hearts;
    }

    // --- Drag & Drop Logic ---
    let draggedItem = null;

    // Mouse Events for Haystack
    haystack.addEventListener('mousedown', startDrag);
    haystack.addEventListener('touchstart', startDrag, { passive: false });

    function startDrag(e) {
        if (isGameOver) return;
        e.preventDefault();

        // Create a visual drag item
        draggedItem = document.createElement('div');
        draggedItem.textContent = '🌿';
        draggedItem.classList.add('drag-item');
        document.body.appendChild(draggedItem);

        moveDragItem(e);

        document.addEventListener('mousemove', moveDragItem);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', moveDragItem, { passive: false });
        document.addEventListener('touchend', endDrag);
    }

    function moveDragItem(e) {
        if (!draggedItem) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        draggedItem.style.left = `${clientX}px`;
        draggedItem.style.top = `${clientY}px`;
    }

    function endDrag(e) {
        if (!draggedItem) return;

        // Get drop coordinates
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        // Hide dragged item momentarily to see what's underneath
        draggedItem.style.display = 'none';
        const elementBelow = document.elementFromPoint(clientX, clientY);
        draggedItem.style.display = 'block';

        // Check if we dropped on a cow
        const cowElement = elementBelow ? elementBelow.closest('.cow') : null;

        if (cowElement) {
            feedCow(cowElement);
        }

        // Cleanup
        draggedItem.remove();
        draggedItem = null;
        document.removeEventListener('mousemove', moveDragItem);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', moveDragItem);
        document.removeEventListener('touchend', endDrag);
    }

    // --- Game Logic ---

    function startGame() {
        console.log("Starting game...");
        // Reset state (except lives if we want to persist retries? No, standard is reset or passed)
        // User asked: "cada vez que falles te quita 1 vida" -> implies retry with -1 life?
        // Or continues running? "si no alimentas... pierdes" -> usually means game over.
        // But here: "te quita 1 vida y cuando se termina el juego pasa al siguiente con las vidas con las que acabo el anterior"
        // Interpretation: 
        // 1. In-game: If cow dies, -1 life. Game continues.
        // 2. If lives == 0: Game Over.
        // 3. If win: Go to next game with current lives.

        score = 0;
        isGameOver = false;
        difficultyMultiplier = 1;
        scoreDisplay.textContent = score;
        modal.classList.add('hidden');
        gameArea.innerHTML = '';
        cows = [];

        // We do NOT reset lives here, because they are passed in via URL or maintained.
        if (lives <= 0) {
            // Should not happen if redirected properly, but safe guard
            lives = 4;
        }
        updateLivesDisplay();

        // Start Spawner
        scheduleNextCow(INITIAL_SPAWN_RATE);
    }

    function scheduleNextCow(delay) {
        if (isGameOver) return;
        setTimeout(() => {
            if (isGameOver) return;
            spawnCow();

            // Increase difficulty: Spawn faster as score increases
            let nextDelay = Math.max(MIN_SPAWN_RATE, INITIAL_SPAWN_RATE - (score * 50));
            scheduleNextCow(nextDelay);
        }, delay);
    }

    function spawnCow() {
        const cowEl = document.createElement('div');
        cowEl.classList.add('cow');

        // Random Position Logic
        const maxLeft = gameArea.clientWidth - 90; // 80px width + margin safety
        const maxTop = gameArea.clientHeight - 90; // 80px height + margin safety

        const randomLeft = Math.floor(Math.random() * maxLeft);
        const randomTop = Math.floor(Math.random() * maxTop);

        cowEl.style.left = `${randomLeft}px`;
        cowEl.style.top = `${randomTop}px`;

        // Hunger Bar
        const hungerBar = document.createElement('div');
        hungerBar.classList.add('hunger-bar');
        const hungerFill = document.createElement('div');
        hungerFill.classList.add('hunger-fill');
        hungerBar.appendChild(hungerFill);
        cowEl.appendChild(hungerBar);

        gameArea.appendChild(cowEl);

        const cowData = {
            id: Date.now() + Math.random(),
            element: cowEl,
            hungerFill: hungerFill,
            spawnTime: Date.now(),
            maxHungerTime: HUNGER_DURATION
        };

        cows.push(cowData);

        // Start hunger timer for this cow
        requestAnimationFrame(() => updateCowHunger(cowData));
    }

    function updateCowHunger(cowData) {
        if (isGameOver || !cowData.element.parentElement) return;

        const imgTime = Date.now() - cowData.spawnTime;
        const hungerPercent = 100 - (imgTime / cowData.maxHungerTime * 100);

        if (hungerPercent <= 0) {
            // Starved!
            cowData.hungerFill.style.width = '0%';
            loseLife(cowData);
        } else {
            cowData.hungerFill.style.width = `${hungerPercent}%`;

            // Visual warning
            if (hungerPercent < 30) {
                cowData.element.classList.add('hungry');
            } else {
                cowData.element.classList.remove('hungry');
            }

            requestAnimationFrame(() => updateCowHunger(cowData));
        }
    }

    function loseLife(cowData) {
        // Remove the dead cow
        if (cowData.element.parentElement) {
            cowData.element.remove();
        }
        // Remove from array
        const index = cows.indexOf(cowData);
        if (index > -1) {
            cows.splice(index, 1);
        }

        lives--;
        updateLivesDisplay();

        // Feedback
        const feedback = document.createElement('div');
        feedback.textContent = "💔";
        feedback.style.position = 'fixed';
        feedback.style.left = '50%';
        feedback.style.top = '50%';
        feedback.style.fontSize = '100px';
        feedback.style.transform = 'translate(-50%, -50%)';
        feedback.style.zIndex = '3000';
        document.body.appendChild(feedback);
        setTimeout(() => feedback.remove(), 500);

        if (lives <= 0) {
            triggerGameOver();
        }
    }

    function feedCow(cowEl) {
        // Find cow data
        const cowIndex = cows.findIndex(c => c.element === cowEl);
        if (cowIndex !== -1) {
            const cow = cows[cowIndex];

            // Reset hunger
            cow.spawnTime = Date.now();
            cow.element.classList.remove('hungry');

            // Visual feedback
            const originalText = "🐮"; // Pseudo element content hack or just class switch
            cow.element.classList.add('eating');
            setTimeout(() => cow.element.classList.remove('eating'), 200);

            // Update Score
            score += 10;
            scoreDisplay.textContent = score;

            if (score >= 100) {
                gameWin();
            }

            // Optional: Remove cow if fed? No, let's keep them like Tamagotchis for a bit, 
            // OR remove them to clear space. 
            // Let's remove them to prevent overcrowding and make it about "serving customers".
            // CHANGE: Remove cow after feeding to keep the board clean?
            // User request: "alimentar vacas" - usually implies keeping them alive.
            // BUT, screens fill up. Let's make them disappear happy and spawn a new one later.

            showConfetti(cowEl);

            // Remove cow logic
            cowEl.remove();
            cows.splice(cowIndex, 1);
        }
    }

    function triggerGameOver() {
        if (isGameOver) return;
        isGameOver = true;
        finalScoreDisplay.textContent = score;
        modal.classList.add('hidden'); // Hide game over modal if it was shown by lives
        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    function gameWin() {
        if (isGameOver) return;
        isGameOver = true;
        document.getElementById('game-win-modal').classList.remove('hidden');
        // Stop spawning
        cows.forEach(c => c.element.remove());
        cows = [];
        showConfetti(document.body); // Big confetti

        // Update win modal text or button if needed to show "Next Level"
        // For now, reload acts as replay, but user wants "pass to next".
        // Use a placeholder button for next level
    }

    function showConfetti(element) {
        // Simple visual pop
        const rect = element.getBoundingClientRect();
        const feedback = document.createElement('div');
        feedback.textContent = "+10";
        feedback.style.position = 'fixed';
        feedback.style.left = `${rect.left + 20}px`;
        feedback.style.top = `${rect.top}px`;
        feedback.style.color = '#fff';
        feedback.style.fontWeight = 'bold';
        feedback.style.fontSize = '20px';
        feedback.style.pointerEvents = 'none';
        feedback.style.transition = 'all 0.5s';
        document.body.appendChild(feedback);

        requestAnimationFrame(() => {
            feedback.style.transform = 'translateY(-50px)';
            feedback.style.opacity = '0';
        });

        setTimeout(() => feedback.remove(), 500);
    }

    // Make it global so the HTML button can see it
    window.nextLevel = function () {
        // Since there is no "next game" yet, we loop this one but preserve lives
        // to demonstrate the mechanic of passing lives to the next level.
        // In the future, change this URL to the actual next game.
        window.location.href = `index.html?lives=${lives}`;
    };

    // Start on load
    init();
});
