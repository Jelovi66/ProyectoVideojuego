document.addEventListener('DOMContentLoaded', () => {
    const hydrationDisplay = document.getElementById('hydration');
    const livesDisplay = document.getElementById('lives');
    const waterSource = document.getElementById('water-source');
    const waterLevelEl = document.getElementById('water-level');
    const fieldArea = document.getElementById('field-area');

    let hydration = 20;
    let lives = 4;
    let isGameOver = false;
    let gameInterval;

    // --- Init ---
    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const livesParam = urlParams.get('lives');
        if (livesParam) {
            lives = parseInt(livesParam, 10);
        }
        updateLivesDisplay();
        updateHydrationDisplay();
        startGameLoop();

        // Spawn drag from water source
        addWaterSourceEvents();
    }

    function updateLivesDisplay() {
        let hearts = '';
        for (let i = 0; i < lives; i++) {
            hearts += '❤️';
        }
        livesDisplay.textContent = hearts;
    }

    function updateHydrationDisplay() {
        hydrationDisplay.textContent = hydration;
        waterLevelEl.style.height = `${hydration}%`;

        // Change field color slightly based on hydration
        if (hydration < 30) {
            fieldArea.style.backgroundColor = '#8d6e63'; // dry
        } else if (hydration < 70) {
            fieldArea.style.backgroundColor = '#795548'; // mid
        } else {
            fieldArea.style.backgroundColor = '#5d4037'; // wet
        }
    }

    // --- Game Loop ---
    function startGameLoop() {
        gameInterval = setInterval(() => {
            if (isGameOver) return;

            hydration -= 3;
            if (hydration <= 0) {
                hydration = 0;
                loseLife();
            }
            updateHydrationDisplay();
        }, 1500); // Pierde 3% cada 1.5 segundos
    }

    // --- Drag Water Logic ---
    let dragGhost = null;

    function addWaterSourceEvents() {
        waterSource.addEventListener('mousedown', startDrag);
        waterSource.addEventListener('touchstart', startDrag, { passive: false });
    }

    function startDrag(e) {
        if (isGameOver) return;
        e.preventDefault();

        const clientX = e.touches ? e.touches[0].clientX : e.clientX;
        const clientY = e.touches ? e.touches[0].clientY : e.clientY;

        dragGhost = document.createElement('div');
        dragGhost.textContent = '💧';
        dragGhost.classList.add('drag-item');
        dragGhost.style.left = `${clientX}px`;
        dragGhost.style.top = `${clientY}px`;
        document.body.appendChild(dragGhost);

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

        const clientX = e.changedTouches ? e.changedTouches[0].clientX : e.clientX;
        const clientY = e.changedTouches ? e.changedTouches[0].clientY : e.clientY;

        dragGhost.style.display = 'none';

        // Check if dropped on field
        const elementBelow = document.elementFromPoint(clientX, clientY);
        const isField = elementBelow && (elementBelow.id === 'field-area' || elementBelow.id === 'water-level' || elementBelow.classList.contains('field-text'));

        if (isField) {
            waterField(clientX, clientY);
        }

        dragGhost.remove();
        dragGhost = null;

        document.removeEventListener('mousemove', moveDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', moveDrag);
        document.removeEventListener('touchend', endDrag);
    }

    function waterField(x, y) {
        hydration += 10;
        if (hydration > 100) hydration = 100;
        updateHydrationDisplay();

        showFloatingText("💦 +10%", '#29b6f6', `${x}px`, `${y}px`);

        if (hydration >= 100) {
            winGame();
        }
    }

    function loseLife() {
        lives--;
        updateLivesDisplay();

        const rect = fieldArea.getBoundingClientRect();
        showFloatingText("🍂 ¡Árbol seco!", '#ff5252', `${rect.left + rect.width / 2}px`, `${rect.top + rect.height / 2}px`);

        if (lives <= 0) {
            gameOver();
        } else {
            // Dar otra oportunidad
            hydration = 20;
            updateHydrationDisplay();
        }
    }

    function showFloatingText(text, color, left, top) {
        const div = document.createElement('div');
        div.textContent = text;
        div.style.position = 'absolute';
        div.style.left = left;
        div.style.top = top;
        div.style.transform = 'translate(-50%, -50%)';
        div.style.color = color;
        div.style.fontWeight = 'bold';
        div.style.fontSize = '24px';
        div.style.pointerEvents = 'none';
        div.style.transition = 'all 0.5s ease-out';
        div.style.zIndex = '3000';
        div.style.textShadow = '1px 1px 2px #fff';

        document.body.appendChild(div);

        requestAnimationFrame(() => {
            div.style.transform = 'translate(-50%, -100px)';
            div.style.opacity = '0';
        });

        setTimeout(() => div.remove(), 500);
    }

    function winGame() {
        isGameOver = true;
        clearInterval(gameInterval);
        document.getElementById('game-win-modal').classList.remove('hidden');
    }

    function gameOver() {
        isGameOver = true;
        clearInterval(gameInterval);
        document.getElementById('game-over-modal').classList.remove('hidden');
    }

    window.goHome = function () {
        window.location.href = '../eco-games-hub/index.html';
    };

    window.nextLevel = function () {
        window.location.href = '../eco-games-hub/index.html';
    };

    init();
});
