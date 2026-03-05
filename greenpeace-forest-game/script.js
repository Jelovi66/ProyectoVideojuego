document.addEventListener('DOMContentLoaded', () => {
    const gameArea = document.getElementById('game-area');
    const scoreDisplay = document.getElementById('score');
    const livesDisplay = document.getElementById('lives');
    const waterSource = document.getElementById('water-source');

    let score = 0;
    let lives = 4;
    let isGameOver = false;
    let fires = []; // Track fire elements
    const MAX_FIRES = 6;

    // --- Init ---
    function init() {
        const urlParams = new URLSearchParams(window.location.search);
        const livesParam = urlParams.get('lives');
        if (livesParam) {
            lives = parseInt(livesParam, 10);
        }
        updateLivesDisplay();
        startSpawner();

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

    // --- Fire Spawner Logic ---
    function startSpawner() {
        spawnFire();

        setInterval(() => {
            if (!isGameOver && fires.length < MAX_FIRES) {
                spawnFire();
            }
        }, 2000); // New fire every 2s
    }

    function spawnFire() {
        const fireEl = document.createElement('div');
        fireEl.classList.add('fire');
        fireEl.textContent = '🔥';

        const maxLeft = gameArea.clientWidth - 80;
        const maxTop = gameArea.clientHeight - 80;

        fireEl.style.left = `${Math.max(10, Math.floor(Math.random() * maxLeft))}px`;
        fireEl.style.top = `${Math.max(10, Math.floor(Math.random() * maxTop))}px`;

        gameArea.appendChild(fireEl);

        const fireObj = {
            el: fireEl,
            timer: setTimeout(() => {
                if (!isGameOver && fires.includes(fireObj)) {
                    fireBurnedOut(fireObj);
                }
            }, 10000) // 10 seconds to extinguish before it deals damage
        };

        fires.push(fireObj);
    }

    function fireBurnedOut(fireObj) {
        // Fire dealt damage
        fireObj.el.remove();
        fires = fires.filter(f => f !== fireObj);
        loseLife();
        showFloatingText("🔥 ¡Bosque Dañado!", '#ff5252', fireObj.el.style.left, fireObj.el.style.top);
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

        // Find if we dropped on a fire
        let hitFire = false;
        const elementBelow = document.elementFromPoint(clientX, clientY);
        const hitEl = elementBelow ? (elementBelow.classList.contains('fire') ? elementBelow : elementBelow.closest('.fire')) : null;

        if (hitEl) {
            const fireObj = fires.find(f => f.el === hitEl);
            if (fireObj) {
                extinguishFire(fireObj);
            }
        }

        dragGhost.remove();
        dragGhost = null;

        document.removeEventListener('mousemove', moveDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchmove', moveDrag);
        document.removeEventListener('touchend', endDrag);
    }

    function extinguishFire(fireObj) {
        clearTimeout(fireObj.timer);
        fireObj.el.remove();
        fires = fires.filter(f => f !== fireObj);

        gainScore();
        showFloatingText("✅ +10", '#29b6f6', fireObj.el.style.left, fireObj.el.style.top);
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

    function showFloatingText(text, color, left, top) {
        const div = document.createElement('div');
        div.textContent = text;
        div.style.position = 'absolute';
        div.style.left = left || '50%';
        div.style.top = top || '50%';
        div.style.transform = 'translate(-50%, -50%)';
        div.style.color = color;
        div.style.fontWeight = 'bold';
        div.style.fontSize = '24px';
        div.style.pointerEvents = 'none';
        div.style.transition = 'all 0.5s ease-out';
        div.style.zIndex = '3000';
        div.style.textShadow = '1px 1px 2px #fff';

        gameArea.appendChild(div);

        requestAnimationFrame(() => {
            div.style.transform = 'translate(-50%, -100px)';
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

    window.goHome = function () {
        window.location.href = '../eco-games-hub/index.html';
    };

    window.nextLevel = function () {
        // Game 5 logic: After Game 5, game is complete. Or go back to hub if there's no Game 6
        window.location.href = '../eco-games-hub/index.html';
    }

    init();
});
