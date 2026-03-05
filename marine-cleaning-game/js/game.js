const DIFFICULTY_THRESHOLD = 50; // Increased threshold for scaling since score is x10

class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        // Set canvas to match the constrained container size, not full window
        this.width = 0;
        this.height = 0;

        this.score = 0;
        this.maxScore = 0;
        this.lives = 4; // Default
        this.difficultyLevel = 0;
        this.speedMultiplier = 1;

        this.isPlaying = false;
        this.isGameOver = false; // Add explicit game over flag
        this.items = [];
        this.spawnTimer = 0;
        this.spawnInterval = 60; // Frames

        // Asset loading checks
        this.bgImage = new Image();
        this.bgImage.src = 'assets/background.png';

        this.player = {
            x: 0,
            y: 0,
            width: 80,
            height: 60,
            color: '#8e44ad'
        };

        this.ui = {
            start: document.getElementById('start-screen'),
            gameOver: document.getElementById('game-over-screen'),
            gameWin: document.getElementById('game-win-screen'),
            score: document.getElementById('score'),
            lives: document.getElementById('lives'),
            finalScore: document.getElementById('final-score'),
        };

        this.setupEventListeners();
        window.addEventListener('resize', () => this.resize());
        this.resize();

        this.ui.start.addEventListener('click', () => {
            if (!this.isPlaying && !this.isGameOver) {
                this.startGame();
            }
        });

        // Parse Lives from URL
        const urlParams = new URLSearchParams(window.location.search);
        const livesParam = urlParams.get('lives');
        if (livesParam) {
            this.lives = parseInt(livesParam, 10);
        }
        this.updateLivesDisplay();

        this.loop = this.loop.bind(this);
        requestAnimationFrame(this.loop);
    }

    resize() {
        const container = document.getElementById('game-container');
        this.width = container.clientWidth;
        this.height = container.clientHeight;
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.player.y = this.height - 100;
        this.player.x = Math.min(Math.max(this.player.x, 0), this.width - this.player.width);
    }

    setupEventListeners() {
        // Touch events
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleInput(touch.clientX);
        }, { passive: false });

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handleInput(touch.clientX);
        }, { passive: false });

        // Mouse events
        this.canvas.addEventListener('mousemove', (e) => {
            this.handleInput(e.clientX);
        });
    }

    handleInput(clientX) {
        if (!this.isPlaying) return;
        const rect = this.canvas.getBoundingClientRect();
        const relativeX = clientX - rect.left;
        this.player.x = relativeX - this.player.width / 2;
        if (this.player.x < 0) this.player.x = 0;
        if (this.player.x > this.width - this.player.width) this.player.x = this.width - this.player.width;
    }

    startGame() {
        this.isPlaying = true;
        this.isGameOver = false;
        this.score = 0;
        this.maxScore = 0;
        this.difficultyLevel = 0;
        this.speedMultiplier = 1;
        this.items = [];

        this.ui.start.classList.add('hidden');
        this.ui.start.classList.remove('active');
        this.ui.gameOver.classList.add('hidden');
        this.ui.gameOver.classList.remove('active');
        this.ui.gameWin.classList.add('hidden');
        this.ui.gameWin.classList.remove('active');
        this.updateScore(0);
        this.updateLivesDisplay();
    }

    updateLivesDisplay() {
        let hearts = '';
        for (let i = 0; i < this.lives; i++) {
            hearts += '❤️';
        }
        this.ui.lives.textContent = hearts;
    }

    loseLife() {
        this.lives--;
        this.updateLivesDisplay();
        if (this.lives <= 0) {
            this.gameOver();
        }
    }

    gameOver() {
        this.isPlaying = false;
        this.isGameOver = true;
        this.ui.finalScore.textContent = Math.floor(this.score);
        this.ui.gameOver.classList.remove('hidden');
        this.ui.gameOver.classList.add('active');
    }

    gameWin() {
        this.isPlaying = false;
        this.isGameOver = true;
        this.ui.gameWin.classList.remove('hidden');
        this.ui.gameWin.classList.add('active');
    }

    updateScore(val) {
        this.score += val;

        if (this.score > this.maxScore) {
            this.maxScore = this.score;
        }

        // Win Condition
        if (this.score >= 100) {
            this.gameWin();
            return;
        }

        // Difficulty scaling
        const newLevel = Math.floor(this.maxScore / DIFFICULTY_THRESHOLD);
        if (newLevel > this.difficultyLevel) {
            this.difficultyLevel = newLevel;
            this.speedMultiplier = 1 + (this.difficultyLevel * 0.2);
        }

        this.ui.score.textContent = Math.floor(this.score);
    }

    spawnItem() {
        const type = Math.random() > 0.4 ? 'trash' : 'fish'; // 60% trash, 40% fish
        const size = 40;
        const x = Math.random() * (this.width - size);

        this.items.push({
            x: x,
            y: -size,
            size: size,
            type: type,
            speed: (Math.random() * 2 + 2) * this.speedMultiplier
        });
    }

    update() {
        if (!this.isPlaying) return;

        // Spawning
        this.spawnTimer++;
        if (this.spawnTimer > this.spawnInterval / this.speedMultiplier) {
            this.spawnItem();
            this.spawnTimer = 0;
        }

        // Updating items
        for (let i = this.items.length - 1; i >= 0; i--) {
            const item = this.items[i];
            item.y += item.speed;

            // Collision detection
            if (
                item.x < this.player.x + this.player.width &&
                item.x + item.size > this.player.x &&
                item.y < this.player.y + this.player.height &&
                item.y + item.size > this.player.y
            ) {
                // Collision!
                if (item.type === 'trash') {
                    this.updateScore(10); // +10 Points
                } else {
                    // Fish Penalty: -1 Life
                    this.loseLife();
                    // Optional: Small score penalty too?
                    // User asked for score penalty before, but Lives are standard now.
                    // Let's do both to be safe: -10 pts
                    this.updateScore(-10);
                }
                this.items.splice(i, 1);
                continue;
            }

            // Off screen
            if (item.y > this.height) {
                // Missed Item Logic
                if (item.type === 'trash') {
                    // Missed Trash: -10 Points
                    this.updateScore(-10);
                }
                this.items.splice(i, 1);
            }
        }
    }

    draw() {
        // Draw background
        if (this.bgImage.complete && this.bgImage.naturalWidth !== 0) {
            this.ctx.drawImage(this.bgImage, 0, 0, this.width, this.height);
        } else {
            const grad = this.ctx.createLinearGradient(0, 0, 0, this.height);
            grad.addColorStop(0, '#00a8cc');
            grad.addColorStop(1, '#003366');
            this.ctx.fillStyle = grad;
            this.ctx.fillRect(0, 0, this.width, this.height);
        }

        // Draw Player (Net)
        this.ctx.fillStyle = this.player.color;
        this.ctx.beginPath();
        this.ctx.arc(this.player.x + this.player.width / 2, this.player.y, this.player.width / 2, 0, Math.PI, false);
        this.ctx.lineTo(this.player.x, this.player.y);
        this.ctx.fill();
        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 3;
        this.ctx.stroke();

        // Draw Items
        for (const item of this.items) {
            if (item.type === 'trash') {
                this.ctx.fillStyle = '#555'; // Grey for trash
                this.ctx.fillRect(item.x + 10, item.y, item.size - 20, item.size);
            } else {
                this.ctx.fillStyle = '#f39c12'; // Orange for fish
                this.ctx.beginPath();
                this.ctx.ellipse(item.x + item.size / 2, item.y + item.size / 2, item.size / 2, item.size / 3, 0, 0, 2 * Math.PI);
                this.ctx.fill();
                this.ctx.beginPath();
                this.ctx.moveTo(item.x, item.y + item.size / 2);
                this.ctx.lineTo(item.x - 10, item.y + item.size / 2 - 10);
                this.ctx.lineTo(item.x - 10, item.y + item.size / 2 + 10);
                this.ctx.fill();
            }
        }
    }

    loop() {
        this.ctx.clearRect(0, 0, this.width, this.height);
        this.update();
        this.draw();
        requestAnimationFrame(this.loop);
    }
}

// Start the game when the window loads
window.onload = () => {
    const game = new Game();
};
