import { Player } from './player.js';
import { Background } from './background.js';
import { ObstacleManager } from './obstacles.js';
import { ScoreManager } from './score.js';
import { Portal } from './portal.js';
import { Controls } from './controls.js';
import { SnapshotManager } from './snapshot.js';
import { Assets } from './assets.js';
import { UI } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.init();
    }

    init() {
        // Initialize game components
        this.resize();
        window.addEventListener('resize', () => this.resize());
        this.startGameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    startGameLoop() {
        const gameLoop = () => {
            this.update();
            this.render();
            requestAnimationFrame(gameLoop);
        };
        gameLoop();
    }
}

new Game();
