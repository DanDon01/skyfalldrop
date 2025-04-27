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
        // Removed activeMilestone and milestoneTimer as rendering is handled by UI
    }

    update(deltaTime) {
        // Update score based on time
        this.timeAccumulator += deltaTime;

        // Check if 0.2 seconds (200ms) has passed
        const scoreInterval = 200; // ms
        if (this.timeAccumulator >= scoreInterval) {
            const intervalsPassed = Math.floor(this.timeAccumulator / scoreInterval);
            // Adjust points added per interval if needed, e.g., SCORE_PER_SECOND / 5
            const pointsPerInterval = SCORE_PER_SECOND / 5; // = 2 points per 0.2s
            this.score += intervalsPassed * pointsPerInterval;
            this.timeAccumulator %= scoreInterval; // Keep remainder
            this.checkMilestone();
        }

        // Removed milestone display timer logic
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
                // this.triggerMilestoneEffect(milestone.image); // Image flash handled by UI if needed
                console.log(`Milestone reached: ${milestone.score}`);
                if (this.assets) {
                    this.assets.playSound('sfx_milestone'); // Play sound
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

    // triggerMilestoneEffect removed - visual effect handled by UI

    // render method removed - rendering handled by UI

    getScore() {
        return this.score;
    }
}
