// Player class handles movement, collision detection, and trail rendering for the falling player character

export class Player {
    constructor(canvas, assets) { // Added assets parameter
        this.canvas = canvas;
        this.assets = assets; // Store asset manager
        this.image = this.assets.getImage('player'); // Get player image

        // Define dimensions - adjust these based on the actual sprite size
        this.width = this.image ? this.image.width : 40; // Use image width or fallback
        this.height = this.image ? this.image.height : 40; // Use image height or fallback

        this.x = canvas.width / 2 - this.width / 2; // Center based on width
        this.y = canvas.height / 3; // Initial vertical position
        this.velocity = { x: 0, y: 5 };
        // Keep radius for circle collision, might need refinement for sprite collision
        this.radius = Math.max(this.width, this.height) / 2;
        this.trail = [];
        this.color = 'white'; // Default/fallback color
        this.moveSpeed = 7;
        // Collision Flash properties
        this.isFlashing = false;
        this.flashDuration = 150; // ms
        this.flashTimer = 0;
        this.flashColor = 'orange';
        // Trail properties
        this.trailMaxLength = 15; // Max number of points in the trail
        this.trailColor = 'rgba(255, 255, 255, 0.5)'; // Semi-transparent white
        this.trailPointInterval = 2; // Add point every N frames/updates
        this.updateCounter = 0; // Counter for interval
    }

    update(controls, touchControls, deltaTime) { // Added touchControls parameter
        // Basic falling physics
        this.y += this.velocity.y; // Consider using deltaTime for frame-independent physics later if needed

        // Keep player within bounds (simple example, might need refinement)
        if (this.y + this.radius > this.canvas.height) {
            this.y = this.canvas.height - this.radius;
            // Optional: Stop falling or handle bottom boundary
        }
        if (this.y - this.radius < 0) {
            this.y = this.radius;
        }

        // Handle horizontal movement based on controls (keyboard and touch)
        this.handleMovement(controls, touchControls);

        // Keep player within horizontal bounds
        if (this.x - this.radius < 0) {
            this.x = this.radius;
        }
        if (this.x + this.radius > this.canvas.width) {
            this.x = this.canvas.width - this.radius;
        }

        // Update flash timer
        if (this.isFlashing) {
            this.flashTimer -= deltaTime;
            if (this.flashTimer <= 0) {
                this.isFlashing = false;
            }
        }

        this.updateTrail(deltaTime); // Pass deltaTime if needed for timing
    }

    handleMovement(controls, touchControls) {
        // Check either keyboard OR touch controls for movement
        if (controls.left || touchControls.left) {
            this.x -= this.moveSpeed;
        }
        if (controls.right || touchControls.right) {
            this.x += this.moveSpeed;
        }
    }

    handleCollision() {
        // Simple bounce effect: reverse vertical velocity slightly
        this.velocity.y *= -0.5;

        // Trigger visual flash
        this.isFlashing = true;
        this.flashTimer = this.flashDuration;

        // Optional: Add temporary invincibility?
    }

    updateTrail(deltaTime) {
        this.updateCounter++;
        if (this.updateCounter >= this.trailPointInterval) {
            this.updateCounter = 0;
            // Add current position to the beginning of the trail array
            this.trail.unshift({ x: this.x, y: this.y });

            // Limit trail length
            if (this.trail.length > this.trailMaxLength) {
                this.trail.pop(); // Remove the oldest point
            }
        }
    }

    render(ctx) {
        // Save context state
        ctx.save();

        if (this.isFlashing) {
            // Apply flash effect (e.g., tint or overlay)
            // Simple approach: draw sprite slightly transparent then overlay color
            // More complex: use filters or blend modes if needed
            // For fallback circle, just change fillStyle
        }

        if (this.image) {
            // Draw the player sprite
            if (this.isFlashing) {
                 // Example: Draw semi-transparent sprite then color overlay
                 // This is basic; a shader/filter would be better for tinting
                 ctx.globalAlpha = 0.6;
                 ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
                 ctx.globalAlpha = 0.4; // Overlay alpha
                 ctx.fillStyle = this.flashColor;
                 ctx.fillRect(this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
                 ctx.globalAlpha = 1.0; // Reset alpha
            } else {
                 ctx.drawImage(this.image, this.x - this.width / 2, this.y - this.height / 2, this.width, this.height);
            }
        } else {
            // Fallback: Draw a simple circle
            ctx.beginPath();
            const fallbackRadius = Math.max(this.width, this.height) / 2; // Use calculated radius
            ctx.arc(this.x, this.y, fallbackRadius, 0, Math.PI * 2);
            ctx.fillStyle = this.isFlashing ? this.flashColor : this.color; // Use flash color if flashing
            ctx.fill();
            ctx.closePath();
            // console.warn("Player image not loaded, drawing fallback circle."); // Keep warning minimal
        }

        // Restore context state
        ctx.restore();

        // Render the trail
        this.renderTrail(ctx);
    }

    renderTrail(ctx) {
        ctx.save();
        for (let i = 0; i < this.trail.length; i++) {
            const point = this.trail[i];
            const ratio = (this.trail.length - i) / this.trail.length; // 1 for newest, 0 for oldest

            // Example: Draw fading circles
            ctx.beginPath();
            ctx.arc(point.x, point.y, this.radius * ratio * 0.5, 0, Math.PI * 2); // Size decreases
            ctx.fillStyle = `rgba(255, 255, 255, ${0.5 * ratio})`; // Opacity decreases
            ctx.fill();
            ctx.closePath();

            // Alternative: Draw a line? (More complex to make look good)
        }
        ctx.restore();
    }
}
