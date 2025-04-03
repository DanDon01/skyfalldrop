// Manages score tracking, milestones, and score-based events

const SCORE_PER_SECOND = 10;
const MILESTONE_DISPLAY_DURATION = 1500; // ms
const MILESTONE_MESSAGES = { // Map score to message text
    1000: "1K!",
    5000: "5K Club!",
    10000: "10K!",
    25000: "25K Legend!"
};

export class ScoreManager {
    constructor(assets, ui) { // Added ui parameter
        this.assets = assets;
        this.ui = ui; // Store UI manager reference
        this.score = 0;
        // Store milestones with image names and reached status
        this.milestones = [
            { score: 1000, image: 'milestone_flash_1k', reached: false },
            { score: 5000, image: 'milestone_flash_5k', reached: false },
            { score: 10000, image: 'milestone_flash_10k', reached: false },
            { score: 25000, image: 'milestone_flash_25k', reached: false },
        ];
        this.timeAccumulator = 0;
        this.activeMilestone = null;
        this.milestoneTimer = 0; // Timer for how long to display it
    }

    update(deltaTime) {
        // Update score based on time
        this.timeAccumulator += deltaTime;

        // Check if a second has passed
        if (this.timeAccumulator >= 1000) {
            const secondsPassed = Math.floor(this.timeAccumulator / 1000);
            this.score += secondsPassed * SCORE_PER_SECOND;
            this.timeAccumulator %= 1000;
            this.checkMilestone(); // Check after score update
        }

        // Update milestone display timer
        if (this.milestoneTimer > 0) {
            this.milestoneTimer -= deltaTime;
            if (this.milestoneTimer <= 0) {
                this.activeMilestone = null; // Hide milestone flash
            }
        }
    }

    handleCollision() {
        // Reduce score on collision
        this.score -= 100;
        // Ensure score doesn't go below zero (optional, but good practice)
        if (this.score < 0) {
            this.score = 0;
        }
        // console.log(`Collision! Score reduced to: ${this.score}`); // Optional log
    }

    checkMilestone() {
        for (const milestone of this.milestones) {
            if (!milestone.reached && this.score >= milestone.score) {
                milestone.reached = true;
                this.triggerMilestoneEffect(milestone.image); // Trigger image flash
                console.log(`Milestone reached: ${milestone.score}`);
                if (this.assets) {
                    this.assets.playSound('sfx_milestone');
                }
                // Show text message via UI manager
                const messageText = MILESTONE_MESSAGES[milestone.score] || `${milestone.score}!`;
                if (this.ui) {
                    this.ui.showMessage(messageText); // Use default duration from UI
                }
                break;
            }
        }
    }

    triggerMilestoneEffect(imageName) {
        const image = this.assets.getImage(imageName);
        if (image) {
            this.activeMilestone = image;
            this.milestoneTimer = MILESTONE_DISPLAY_DURATION;
        } else {
            console.warn(`Milestone image not found: ${imageName}`);
        }
    }

    render(ctx, canvasWidth, canvasHeight) { // Added render method and canvas dimensions
        // Draw active milestone flash (e.g., centered)
        if (this.activeMilestone && this.milestoneTimer > 0) {
            const imgWidth = this.activeMilestone.width;
            const imgHeight = this.activeMilestone.height;
            const x = canvasWidth / 2 - imgWidth / 2;
            const y = canvasHeight / 4 - imgHeight / 2; // Position near top-center

            // Optional: Add fade effect based on timer?
            // ctx.globalAlpha = Math.min(1, this.milestoneTimer / 500); // Example fade out

            ctx.drawImage(this.activeMilestone, x, y, imgWidth, imgHeight);

            // ctx.globalAlpha = 1.0; // Reset alpha
        }
    }

    getScore() {
        return this.score;
    }
}
