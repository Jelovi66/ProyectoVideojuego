const gameArea = document.getElementById('game-area');
const scoreElement = document.getElementById('score');
const livesElement = document.getElementById('lives');
const gameOverModal = document.getElementById('game-over-modal');
const gameWinModal = document.getElementById('game-win-modal');

let score = 0;
// URL Params
const urlParams = new URLSearchParams(window.location.search);
let lives = parseInt(urlParams.get('lives')) || 4;
const winScore = 100;

const emojis = ['🧑', '👩', '👴', '👵', '👨‍🦽', '👩‍🦽', '🧑‍🦯', '👩‍👧', '👨‍👦'];
let gameInterval;
let spawnRate = 1200;
let personDuration = 2000;
let isGameOver = false;

function initGame() {
    updateLivesDisplay();
    if (lives <= 0) {
        endGame(false);
        return;
    }
    startGameLoop();
}

function updateLivesDisplay() {
    if (lives < 0) lives = 0;
    livesElement.textContent = '❤️'.repeat(lives) + '💔'.repeat(4 - lives);
}

function startGameLoop() {
    gameInterval = setTimeout(spawnPerson, spawnRate);
}

function spawnPerson() {
    if (isGameOver) return;

    const person = document.createElement('div');
    person.classList.add('person');
    person.textContent = emojis[Math.floor(Math.random() * emojis.length)];

    // Position
    const maxX = gameArea.clientWidth - 50;
    const maxY = gameArea.clientHeight - 50;
    const x = Math.random() * maxX;
    const y = Math.random() * maxY;

    person.style.left = `${x}px`;
    person.style.top = `${y}px`;

    let helped = false;

    person.addEventListener('mousedown', (e) => {
        if (helped || isGameOver) return;
        helped = true;
        giveMoney(person, e.clientX, e.clientY);
    });

    // Para pantallas táctiles
    person.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (helped || isGameOver) return;
        helped = true;
        const touch = e.touches[0];
        giveMoney(person, touch.clientX, touch.clientY);
    }, { passive: false });

    gameArea.appendChild(person);

    // Remove logic
    setTimeout(() => {
        if (!isGameOver && gameArea.contains(person)) {
            gameArea.removeChild(person);
            if (!helped) {
                loseLife();
            }
        }
    }, personDuration);

    // Next spawn
    spawnRate = Math.max(500, spawnRate - 10); // gets faster
    gameInterval = setTimeout(spawnPerson, spawnRate);
}

function giveMoney(personElement, clientX, clientY) {
    if (isGameOver) return;

    // Play money animation
    const rect = personElement.getBoundingClientRect();
    const areaRect = gameArea.getBoundingClientRect();

    const moneyAnim = document.createElement('div');
    moneyAnim.textContent = '💸';
    moneyAnim.classList.add('money-animation');
    moneyAnim.style.left = `${rect.left - areaRect.left + 10}px`;
    moneyAnim.style.top = `${rect.top - areaRect.top - 10}px`;
    gameArea.appendChild(moneyAnim);

    setTimeout(() => {
        if (gameArea.contains(moneyAnim)) {
            gameArea.removeChild(moneyAnim);
        }
    }, 1000);

    // Update score
    score += 10;
    scoreElement.textContent = score;

    // Remove person
    personElement.style.transform = 'scale(0)';
    setTimeout(() => {
        if (gameArea.contains(personElement)) {
            gameArea.removeChild(personElement);
        }
    }, 200);

    if (score >= winScore) {
        endGame(true);
    }
}

function loseLife() {
    if (isGameOver) return;
    lives--;
    updateLivesDisplay();

    // Visual feedback for losing life
    gameArea.style.backgroundColor = '#ffcdd2';
    setTimeout(() => {
        gameArea.style.backgroundColor = '#fff0f5';
    }, 200);

    if (lives <= 0) {
        endGame(false);
    }
}

function endGame(won) {
    isGameOver = true;
    clearTimeout(gameInterval);

    if (won) {
        gameWinModal.classList.remove('hidden');
    } else {
        gameOverModal.classList.remove('hidden');
    }
}

function goHome() {
    window.location.href = '../eco-games-hub/index.html';
}

function nextLevel() {
    window.location.href = '../greenpeace-forest-game/index.html?lives=' + lives;
}

// Start
initGame();
