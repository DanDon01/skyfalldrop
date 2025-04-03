// Handles portal spawn conditions, animation, and exit logic

export class Portal {
    constructor(canvas, assets, threshold = 200) { // Added assets parameter
        this.canvas = canvas;
        this.assets = assets; // Store asset manager
        this.image = this.assets.getImage('portal'); // Get portal image
        this.active = false;
        this.position = { x: 0, y: 0 };

        // Define dimensions - adjust based on sprite or use fallback
        this.width = this.image ? this.image.width : 100; // Use image width or fallback
        this.height = this.image ? this.image.height : 50; // Use image height or fallback

        this.color = 'purple'; // Fallback color
        this.threshold = threshold;
    }

    spawn() {
        // Spawn portal at threshold
        // This method might not be needed if activation is based on score check
        // Kept for potential future use (e.g., timed appearance)
    }

    // Checks if the score meets the threshold and activates the portal
    checkAndActivate(currentScore) {
        if (!this.active && currentScore >= this.threshold) {
            this.active = true;
            // Position the portal at the bottom center
            this.position.x = this.canvas.width / 2 - this.width / 2;
            this.position.y = this.canvas.height - this.height - 20; // Slightly above bottom edge
            console.log(`Portal activated at score: ${currentScore}`); // Log activation
        }
    }

    update() {
        // Update portal animation (if any - simple for now)
        if (!this.active) return;
        // Example: Pulsating effect? Color change?
    }

    render(ctx) {
        // Render portal effect only if active
        if (!this.active) return;

        if (this.image) {
            // Draw the portal sprite
            ctx.drawImage(this.image, this.position.x, this.position.y, this.width, this.height);
            // Add animation/FX later (e.g., pulsing scale, rotation)
        } else {
            // Fallback: Draw a simple rectangle if image failed to load
            ctx.fillStyle = this.color;
            ctx.fillRect(this.position.x, this.position.y, this.width, this.height);
            console.warn("Portal image not loaded, drawing fallback rectangle.");
        }
    }

    // Method to check collision between the portal (rectangle) and the player (circle)
    checkCollisionWithPlayer(player) {
        // Only check if the portal is active
        if (!this.active) return false;

        // Find the closest point to the circle within the portal rectangle
        const closestX = Math.max(this.position.x, Math.min(player.x, this.position.x + this.width));
        const closestY = Math.max(this.position.y, Math.min(player.y, this.position.y + this.height));

        // Calculate the distance between the circle's center and this closest point
        const distanceX = player.x - closestX;
        const distanceY = player.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        // If the distance is less than the circle's radius squared, a collision occurred
        return distanceSquared < (player.radius * player.radius);
    }
}
