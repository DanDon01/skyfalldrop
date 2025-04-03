// Handles spawning and management of obstacles (birds, planes, balloons)

const OBSTACLE_TYPES = [
    { name: 'bird_pigeon', fallbackWidth: 40, fallbackHeight: 30 },
    { name: 'bird_crow', fallbackWidth: 50, fallbackHeight: 40 },
    { name: 'plane_paper', fallbackWidth: 30, fallbackHeight: 20 },
    { name: 'plane_jet', fallbackWidth: 80, fallbackHeight: 40 },
    { name: 'plane_balloon', fallbackWidth: 60, fallbackHeight: 80 },
];

export class ObstacleManager {
    constructor(canvas, assets) { // Added assets parameter
        this.canvas = canvas;
        this.assets = assets; // Store asset manager
        this.obstacles = [];
        this.spawnTimer = 0;
        this.spawnInterval = 1500; // Spawn every 1.5 seconds (adjust as needed)
    }

    spawn() {
        // Select a random obstacle type
        const typeIndex = Math.floor(Math.random() * OBSTACLE_TYPES.length);
        const type = OBSTACLE_TYPES[typeIndex];
        const image = this.assets.getImage(type.name);

        // Determine dimensions
        const width = image ? image.width : type.fallbackWidth;
        const height = image ? image.height : type.fallbackHeight;

        // Spawn position and speed
        const x = Math.random() * (this.canvas.width - width); // Adjust spawn based on width
        const y = -height; // Start just above the screen based on height
        const velocityY = 2 + Math.random() * 3; // Random downward speed

        this.obstacles.push({
            x,
            y,
            width,
            height,
            velocityY,
            image, // Store image reference
            type: type.name, // Store type name for potential future use
            color: 'red' // Fallback color
        });
    }

    update(deltaTime) { // Added deltaTime parameter
        // Update obstacle positions and check collisions
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawn();
            this.spawnTimer = 0; // Reset timer
            // Optional: Randomize next spawn interval slightly
            // this.spawnInterval = 1000 + Math.random() * 1000;
        }

        // Update positions and remove off-screen obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obs = this.obstacles[i];
            obs.y += obs.velocityY; // Move down

            // Remove if off-screen
            if (obs.y > this.canvas.height) {
                this.obstacles.splice(i, 1);
            }
        }

        // Collision detection will be handled in the main game loop or a dedicated collision system
    }

    // Method to check collision between a single obstacle and the player (circle)
    checkCollisionWithPlayer(obstacle, player) {
        // Find the closest point to the circle within the rectangle
        const closestX = Math.max(obstacle.x, Math.min(player.x, obstacle.x + obstacle.width));
        const closestY = Math.max(obstacle.y, Math.min(player.y, obstacle.y + obstacle.height));

        // Calculate the distance between the circle's center and this closest point
        const distanceX = player.x - closestX;
        const distanceY = player.y - closestY;
        const distanceSquared = (distanceX * distanceX) + (distanceY * distanceY);

        // If the distance is less than the circle's radius squared, a collision occurred
        return distanceSquared < (player.radius * player.radius);
    }

    render(ctx) {
        // Render active obstacles
        this.obstacles.forEach(obs => {
            if (obs.image) {
                // Draw the obstacle sprite
                ctx.drawImage(obs.image, obs.x, obs.y, obs.width, obs.height);
            } else {
                // Fallback: Draw a simple rectangle if image failed to load
                ctx.fillStyle = obs.color;
                ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
                // console.warn(`Obstacle image ${obs.type} not loaded, drawing fallback.`);
            }
        });
    }
}
