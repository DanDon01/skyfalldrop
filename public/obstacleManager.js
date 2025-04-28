import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Obstacle } from './obstacle.js';

// Define the types of obstacles available
const OBSTACLE_TYPES = [
    {
        texture: 'textures/angel.png',
        speed: 1.5, // Horizontal speed
        range: 2.0, // Horizontal movement range (+/- from start X)
        baseHeight: 1.2 // Optional: Adjust base size if needed
    },
    {
        texture: 'textures/bird_crow.png',
        speed: 2.5,
        range: 3.0,
        baseHeight: 0.8
    },
    {
        texture: 'textures/flamingo.png',
        speed: 1.0,
        range: 1.5,
        baseHeight: 1.5
    },
    {
        texture: 'textures/plane_balloon.png',
        speed: 0.8,
        range: 4.0,
        baseHeight: 1.8
    },
    {
        texture: 'textures/plane_paper.png', // Corrected typo: paper
        speed: 3.0,
        range: 2.5,
        baseHeight: 0.7
    }
];

export class ObstacleManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.obstacles = []; // Array to hold active obstacles
        this.baseSpeed = 5; // Reduced from higher value to slow down obstacles
        this.speedVariation = 1.5; // Adds some variety to obstacle speeds
        this.spawnTimer = 0;
        this.spawnInterval = 0.8; // Reduced from likely ~1.5 to increase frequency
        this.baseSpawnY = -10;    // Initial Y position below the camera view
        this.despawnY = 15;     // Y position above camera view to remove obstacles
        this.horizontalSpawnPadding = 1.0; // Min distance from screen edge for spawning
    }

    // Calculate the horizontal boundaries for spawning
    getSpawnBounds() {
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        // Calculate visible height/width at Z=0 (where obstacles might be)
        // Note: This assumes obstacles are roughly at Z=0 relative to camera focus
        const height = 2 * Math.tan(vFOV / 2) * this.camera.position.z;
        const width = height * this.camera.aspect;
        const minX = (-width / 2) + this.horizontalSpawnPadding;
        const maxX = (width / 2) - this.horizontalSpawnPadding;
        return { minX, maxX };
    }

    spawnObstacle() {
        // 1. Choose a random obstacle type
        const typeIndex = Math.floor(Math.random() * OBSTACLE_TYPES.length);
        const type = OBSTACLE_TYPES[typeIndex];

        // 2. Determine spawn position
        const bounds = this.getSpawnBounds();
        const spawnX = THREE.MathUtils.randFloat(bounds.minX, bounds.maxX);
        // Spawn below the camera view, slightly randomized Y
        const spawnY = this.baseSpawnY - Math.random() * 5;
        const spawnZ = 0; // Spawn obstacles at Z=0 plane
        const initialPosition = new THREE.Vector3(spawnX, spawnY, spawnZ);

        // 3. Create and add the obstacle
        const newObstacle = new Obstacle(
            this.scene,
            type.texture,
            initialPosition,
            type.speed,
            type.range
            // We could pass baseHeight here if Obstacle constructor uses it
        );
        this.obstacles.push(newObstacle);

        console.log(`Spawned ${type.texture} at X: ${spawnX.toFixed(2)}`);
    }

    update(deltaTime, scrollSpeed) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Spawn new obstacles at regular intervals
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawnObstacle();
            this.spawnTimer = 0;
            
            // Gradually decrease spawn interval for difficulty progression
            this.spawnInterval = Math.max(0.6, this.spawnInterval - 0.01);
        }
        
        // Update existing obstacles
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obstacle = this.obstacles[i];
            
            // Skip update if obstacle or its mesh is null
            if (!obstacle || !obstacle.mesh) {
                console.warn("Skipping update for null obstacle or mesh");
                continue;
            }
            
            // Apply the reduced speed to obstacle movement
            const speedReductionFactor = 0.7; 
            obstacle.update(deltaTime, scrollSpeed * speedReductionFactor);
            
            // --- Despawn Check ---
            // Remove obstacles that have scrolled far enough above the screen
            if (obstacle.mesh.position.y > this.despawnY) {
                console.log(`Despawning obstacle at Y: ${obstacle.mesh.position.y.toFixed(2)}`);
                obstacle.removeFromScene();
                this.obstacles.splice(i, 1); // Remove from array
            }
        }
    }

    // Method for collision detection - return truly active obstacles with proper Z check
    getActiveObstacles() {
        // Return obstacles that are currently in the scene and have a mesh
        return this.obstacles.filter(obstacle => {
            if (!obstacle.mesh) return false;
            
            // Only include obstacles that are in view range and can interact with player
            // Check both that they're on screen and not too far back in Z
            return obstacle.mesh.position.y > this.baseSpawnY && 
                   obstacle.mesh.position.y < this.despawnY;
        });
    }

    // Method to clear all obstacles (e.g., on game reset)
    clearAllObstacles() {
        console.log("Clearing all obstacles...");
        this.obstacles.forEach(obstacle => obstacle.removeFromScene());
        this.obstacles = [];
        this.spawnTimer = 0; // Reset spawn timer as well
    }
} 