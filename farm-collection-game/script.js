document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const scoreDisplay = document.getElementById('score');
    const livesDisplay = document.getElementById('lives');

    let score = 0;
    let lives = 4;
    let isGameOver = false;
    let items = []; // Track DOM elements
    const MAX_ITEMS = 8;

    // --- Init ---
    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const livesParam = urlParams.get('lives');
        if (livesParam) {
            lives = parseInt(livesParam, 10);
        }
        updateLivesDisplay();
        startSpawner();

        // Add drop listeners to crate
        const crate = document.getElementById('crate');
        // Simple dragover allow
        crate.addEventListener('dragover', (e) => e.preventDefault());
        crate.addEventListener('drop', (e) => {
            e.preventDefault();
            // This is for native drag/drop, but we built custom touch/mouse drag.
            // Keeping it simple with custom logic below.
        });
    }

    function updateLivesDisplay() {
        let hearts = '';
        for (let i = 0; i < lives; i++) {
            hearts += '❤️';
        }
        livesDisplay.textContent = hearts;
    }

    // --- Spawner Logic ---
    function startSpawner() {
        // Initial spawn
        spawnItem();

        // Loop
        setInterval(() => {
            if (!isGameOver && items.length < MAX_ITEMS) {
                spawnItem();
            }
        }, 1500); // Spawn every 1.5s
    }

    function spawnItem() {
        const itemEl = document.createElement('div');
        itemEl.classList.add('item');

        // Randomize Type
        // 40% Egg, 40% Milk, 20% Bad Egg
        const rand = Math.random();
        let type = 'egg'; // class name
        let content = '🥚';

        if (rand < 0.4) {
            type = 'egg';
            content = '🥚';
        } else if (rand < 0.8) {
            type = 'milk';
            content = '🥛';
        } else {
            type = 'bad-egg';
            content = '🥚'; // Visual difference in CSS
        }

        itemEl.classList.add(type);
        itemEl.textContent = content; // Just emoji content for now
        itemEl.dataset.type = type;

        // Random Position
        // Ensure within game area
        const maxLeft = gameArea.clientWidth - 70;
        const maxTop = gameArea.clientHeight - 70;

        itemEl.style.left = `${Math.floor(Math.random() * maxLeft)}px`;
        itemEl.style.top = `${Math.floor(Math.random() * maxTop)}px`;

        gameArea.appendChild(itemEl);
        items.push(itemEl);

        // Attach interactive events
        addDragEvents(itemEl);
    }

    // --- Drag Logic ---
    let draggedElement = null;
    let dragGhost = null;
    let offsetX = 0;
    let offsetY = 0;

    function addDragEvents(el) {
        el.addEventListener('mousedown', startDrag);
        el.addEventListener('touchstart', startDrag, { passive: false });
    }

    function startDrag(e) {
        if (isGameOver) return;
        e.preventDefault();

        const el = e.target;
        if (!el.classList.contains('item')) return;

        draggedElement = el;

        // Get touch/click coords
        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        // Create ghost for visual dragging
        dragGhost = el.cloneNode(true);
        dragGhost.classList.add('drag-item');
        dragGhost.style.left = `${clientX}px`;
        dragGhost.style.top = `${clientY}px`;
        dragGhost.style.opacity = '0.8';
        dragGhost.style.zIndex = '1000';
        document.body.appendChild(dragGhost);

        // Hide original
        el.style.opacity = '0';

        // Listen for move
        document.addEventListener('mousemove', moveDrag);
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchmove', moveDrag, { passive: false });
        document.addEventListener('touchend', endDrag);
    }

    function moveDrag(e) {
        if (!dragGhost) return;

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        dragGhost.style.left = `${clientX}px`;
        dragGhost.style.top = `${clientY}px`;
    }

    function endDrag(e) {
        if (!dragGhost) return;

        // Check drop target
        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        // Hide ghost momentarily to check element below
        dragGhost.style.display = 'none';
        const elementBelow = document.elementFromPoint(clientX, clientY);
        const crate = elementBelow ? elementBelow.closest('.crate') : null;

        if (crate) {
            processItem(draggedElement);
        } else {
            // Return to field (reset)
            draggedElement.style.opacity = '1';
        }

        // Cleanup
        dragGhost.remove();
        dragGhost = null;
        draggedElement = null;

        document.removeEventListener('mousemove', moveDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', moveDrag);
        document.removeEventListener('touchend', endDrag);
    }

    function processItem(el) {
        // Remove from DOM and Array
        el.remove();
        items = items.filter(i => i !== el);

        const type = el.dataset.type;

        if (type === 'bad-egg') {
            loseLife();
            showFloatingText("🤢 -1 Vida", '#ff5252');
        } else {
            gainScore();
            showFloatingText("+10", '#fff');
        }
    }

    function gainScore() {
        score += 10;
        scoreDisplay.textContent = score;

        if (score >= 100) {
            winGame();
        }
    }

    function loseLife() {
        lives--;
        updateLivesDisplay();

        if (lives <= 0) {
            gameOver();
        }
    }

    function showFloatingText(text, color) {
        const crate = document.getElementById('crate');
        const rect = crate.getBoundingClientRect();

        const div = document.createElement('div');
        div.textContent = text;
        div.style.position = 'fixed';
        div.style.left = `${rect.left + rect.width / 2}px`;
        div.style.top = `${rect.top}px`;
        div.style.transform = 'translateX(-50%)';
        div.style.color = color;
        div.style.fontWeight = 'bold';
        div.style.fontSize = '24px';
        div.style.pointerEvents = 'none';
        div.style.transition = 'all 0.5s ease-out';
        div.style.zIndex = '3000';
        div.style.textShadow = '1px 1px 2px black';

        document.body.appendChild(div);

        // Animation
        requestAnimationFrame(() => {
            div.style.transform = 'translate(-50%, -50px)';
            div.style.opacity = '0';
        });

        setTimeout(() => div.remove(), 500);
    }

    function winGame() {
        isGameOver = true;
        document.getElementById('game-win-modal').classList.remove('hidden');
    }

    function gameOver() {
        isGameOver = true;
        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    // Make it global so the HTML button can see it
    window.nextLevel = function () {
        // Pass lives to the next game (Marine Cleaning)
        window.location.href = `../marine-cleaning-game/index.html?lives=${lives}`;
    };

    // Global nav functions
    window.nextLevel = function () {
        window.location.href = `../marine-cleaning-game/index.html?lives=${lives}`;
    };

    init();
});
