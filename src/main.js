import { Player } from './player.js';
import { Background } from './background.js'; // Already imported
import { ObstacleManager } from './obstacles.js';
import { ScoreManager } from './score.js';
import { Portal } from './portal.js';
import { Controls } from './controls.js';
import { TouchControls } from './controls-touch.js';
import { SnapshotManager } from './snapshot.js';
import { Assets } from './assets.js'; // Already imported
import { UI } from './ui.js';

class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.player = null;
        this.controls = null;
        this.touchControls = null;
        this.scoreManager = null;
        this.obstacleManager = null;
        this.portal = null;
        this.snapshotManager = null;
        this.assets = null;
        this.background = null;
        this.ui = null; // Initialize UI reference
        this.isLoading = true;
        this.init();
    }

    async init() {
        this.isLoading = true;
        this.renderLoadingScreen();

        // Initialize asset manager first
        this.assets = new Assets();
        await this.assets.loadAll(); // Wait for assets to load

        // Initialize other game components AFTER assets are loaded
        this.resize(); // Initial resize
        this.controls = new Controls();
        this.touchControls = new TouchControls(this.canvas);
        // Instantiate UI before ScoreManager as it's needed in constructor
        this.ui = new UI(this.canvas);
        this.scoreManager = new ScoreManager(this.assets, this.ui); // Pass assets and ui
        this.obstacleManager = new ObstacleManager(this.canvas, this.assets);
        this.portal = new Portal(this.canvas, this.assets);
        this.snapshotManager = new SnapshotManager(this);
        this.background = new Background(this.canvas, this.assets);
        this.player = new Player(this.canvas, this.assets);
        // Link UI and Snapshot Manager
        if (this.ui && this.snapshotManager) {
            this.ui.setSnapshotManager(this.snapshotManager);
        }

        window.addEventListener('resize', () => this.resize());
        // this.addSnapshotTriggerListener(); // Remove temporary key listener
        this.addInteractionListener();

        this.isLoading = false;
        this.tryStartMusic(); // Attempt to start music after loading
        this.startGameLoop();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        // Optional: Adjust player position or other elements on resize if needed
        if (this.ui) {
            this.ui.resizeButton(); // Reposition UI elements like buttons
        }
        if (this.player) {
            // Example: Keep player centered horizontally on resize
            this.player.x = this.canvas.width / 2;
            // Prevent player from being pushed off-screen vertically
            if (this.player.y > this.canvas.height - this.player.radius) {
                this.player.y = this.canvas.height - this.player.radius;
            }
        }
    }

    update(rawDeltaTime) { // Rename parameter to avoid confusion
        // Get effective delta time (accounts for slow-mo)
        const deltaTime = this.snapshotManager ? this.snapshotManager.getEffectiveDeltaTime(rawDeltaTime) : rawDeltaTime;

        // Update game state using effective deltaTime
        if (this.background) {
            // Pass player's base speed or a fixed value for parallax reference
            this.background.update(deltaTime, this.player ? this.player.velocity.y : 5);
        }
        if (this.player && this.controls && this.touchControls) {
            this.player.update(this.controls, this.touchControls, deltaTime);
        }
        if (this.scoreManager) {
            this.scoreManager.update(deltaTime);
        }
        if (this.obstacleManager) {
            this.obstacleManager.update(deltaTime);
        }
        if (this.portal) {
            this.portal.update(deltaTime);
            if (this.scoreManager) {
                this.portal.checkAndActivate(this.scoreManager.getScore());
            }
        }
        if (this.snapshotManager) {
            this.snapshotManager.update(rawDeltaTime); // Update snapshot manager with raw time
        }

        // Check for collisions after updating positions (using raw positions, not affected by slow-mo rendering)
        this.checkCollisions(); // Checks player vs obstacles

        // Check for portal collision and handle exit
        this.checkPortalCollision();

        // Update UI (score display and message timers)
        if (this.ui) {
            if (this.scoreManager) {
                this.ui.updateScore(this.scoreManager.getScore());
            }
            this.ui.update(deltaTime); // Update message timers etc.
        }

        // Update other components later
    }

    renderLoadingScreen() {
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = 'white';
        this.ctx.font = '24px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText('Loading Assets...', this.canvas.width / 2, this.canvas.height / 2);
    }

    render() {
        // Show loading screen if assets aren't ready
        if (this.isLoading || !this.assets || !this.assets.loaded) {
            this.renderLoadingScreen();
            return; // Don't render the game yet
        }

        // Clear the canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        // Render background first
        if (this.background) {
            this.background.render(this.ctx);
        } else {
            // Fallback solid color if background fails
            this.ctx.fillStyle = '#87CEEB'; // Sky blue
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        }

        // Render other game elements on top
        if (this.player) {
            this.player.render(this.ctx);
        }
        if (this.obstacleManager) {
            this.obstacleManager.render(this.ctx);
        }
        if (this.portal) {
            this.portal.render(this.ctx);
        }
        // Render score milestone effects (on top of game, below main UI)
        if (this.scoreManager) {
            this.scoreManager.render(this.ctx, this.canvas.width, this.canvas.height);
        }
        // Render main UI (like score) last so it's on top
        if (this.ui) {
            this.ui.render(this.ctx);
        }
    }

    checkCollisions() {
        if (!this.player || !this.obstacleManager) return;

        // Iterate through obstacles and check collision with player
        for (let i = this.obstacleManager.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacleManager.obstacles[i];
            if (this.obstacleManager.checkCollisionWithPlayer(obstacle, this.player)) {
                // console.log("Collision detected!"); // Keep or remove log as needed

                // Trigger collision responses
                if (this.scoreManager) {
                    this.scoreManager.handleCollision();
                }
                if (this.player) {
                    this.player.handleCollision();
                }
                if (this.assets) {
                    this.assets.playSound('sfx_hit'); // Play hit sound
                }

                // Remove the collided obstacle
                this.obstacleManager.obstacles.splice(i, 1);
            }
        }
    }

    checkPortalCollision() {
        if (!this.player || !this.portal || !this.portal.active) return;

        if (this.portal.checkCollisionWithPlayer(this.player)) {
            console.log("Player entered the portal!");
            if (this.assets) {
                this.assets.playSound('sfx_portal'); // Play portal sound
            }
            // Stop the game loop? (Optional)
            // this.stopGameLoop(); // Need to implement this if desired

            // Redirect to another URL (placeholder)
            // In a real scenario, this could be another game or a results page
            window.location.href = "https://example.com/next-game"; // Placeholder URL
        }
    }

    // addSnapshotTriggerListener() { ... removed ... }

    addInteractionListener() {
        // Try to play music on the first user interaction (click/touch)
        // This helps bypass browser autoplay restrictions
        const startAudio = () => {
            this.tryStartMusic();
            // Remove the listener after the first interaction
            this.canvas.removeEventListener('click', startAudio);
            this.canvas.removeEventListener('touchstart', startAudio);
        };
        this.canvas.addEventListener('click', startAudio, { once: true });
        this.canvas.addEventListener('touchstart', startAudio, { once: true });
    }

    tryStartMusic() {
        if (this.assets && this.assets.loaded) {
            const music = this.assets.getAudio('background_music');
            if (music && music.paused) { // Check if music exists and is paused
                music.play().catch(e => console.error("Error playing background music:", e));
            }
        }
    }

    // Optional: Method to stop the game loop if needed
    // stopGameLoop() {
    //     if (this.animationFrameId) {
    //         cancelAnimationFrame(this.animationFrameId);
    //         this.animationFrameId = null;
    //         console.log("Game loop stopped.");
    //     }
    // }


    startGameLoop() {
        let lastTime = 0;
        // Store the animation frame ID so we can cancel it if needed
        this.animationFrameId = null;
        const gameLoop = (timestamp) => {
            // If the loop was stopped, don't continue
            // if (!this.animationFrameId) return;

            const deltaTime = timestamp - lastTime;
            lastTime = timestamp;

            this.update(deltaTime); // Pass deltaTime
            this.render();
            this.animationFrameId = requestAnimationFrame(gameLoop); // Store the ID
        };
        this.animationFrameId = requestAnimationFrame(gameLoop); // Start the loop and store ID
    }
}

// Ensure the DOM is ready before starting the game
window.addEventListener('load', () => {
    new Game();
});
