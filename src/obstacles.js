import * as THREE from 'three';

// Obstacle types mapping name to properties
const OBSTACLE_TYPES = {
    'bird_pigeon':   { fallbackWidth: 5, fallbackHeight: 4, movesHorizontally: true, minSpeedX: 15, maxSpeedX: 30 },
    'bird_crow':     { fallbackWidth: 6, fallbackHeight: 5, movesHorizontally: true, minSpeedX: 20, maxSpeedX: 35 },
    'plane_paper':   { fallbackWidth: 4, fallbackHeight: 2, movesHorizontally: true, minSpeedX: 5, maxSpeedX: 15 }, // Slower horizontal drift
    'plane_jet':     { fallbackWidth: 10, fallbackHeight: 4, movesHorizontally: true, minSpeedX: 40, maxSpeedX: 70 }, // Faster
    'plane_balloon': { fallbackWidth: 7, fallbackHeight: 9, movesHorizontally: false }, // Balloons just float up
};
const OBSTACLE_NAMES = Object.keys(OBSTACLE_TYPES);

export class ObstacleManager {
    constructor(scene, assets) {
        this.scene = scene;
        this.assets = assets;
        this.obstacles = []; // Array to hold { mesh, boundingBox, velocityX }
        this.spawnTimer = 0;
        this.spawnInterval = 0.8; // Spawn more frequently (adjust)
        this.spawnArea = { x: 100, z: 50 }; // Width/Depth range for spawning
        this.spawnHeight = -150; // Y-position below the player view to spawn obstacles
        this.worldScrollSpeed = 25; // Base upward speed for all obstacles (adjust for feel)
    }

    spawn() {
        // Select a random obstacle type name
        const typeName = OBSTACLE_NAMES[Math.floor(Math.random() * OBSTACLE_NAMES.length)];
        const typeInfo = OBSTACLE_TYPES[typeName];
        const texture = this.assets.getTexture(typeName);
        let velocityX = 0;

        // Determine horizontal velocity if applicable
        if (typeInfo.movesHorizontally) {
            const speedRange = typeInfo.maxSpeedX - typeInfo.minSpeedX;
            velocityX = (Math.random() * speedRange + typeInfo.minSpeedX) * (Math.random() < 0.5 ? 1 : -1); // Random direction
        }

        // Determine geometry and material (Using PlaneGeometry for all sprites)
        const aspect = texture ? texture.image.width / texture.image.height : typeInfo.fallbackWidth / typeInfo.fallbackHeight;
        // Use a consistent reference for size (e.g., height) and calculate width based on aspect ratio
        const height = typeInfo.fallbackHeight;
        const width = height * aspect;

        const geometry = new THREE.PlaneGeometry(width, height);
        const material = new THREE.MeshBasicMaterial({
            map: texture || null,
            transparent: true, // Assume PNGs with transparency
            alphaTest: 0.1,    // Adjust if needed based on textures
            side: THREE.DoubleSide, // Render both sides just in case
            color: texture ? 0xffffff : 0xff0000 // White tint if texture exists, red fallback
        });
        const mesh = new THREE.Mesh(geometry, material);

        // Set initial position (below screen)
        mesh.position.x = (Math.random() - 0.5) * this.spawnArea.x;
        mesh.position.y = this.spawnHeight;
        mesh.position.z = (Math.random() - 0.5) * this.spawnArea.z; // Add depth variation

        // Add to scene
        this.scene.add(mesh);

        // Create bounding box
        const boundingBox = new THREE.Box3().setFromObject(mesh);

        // Store obstacle data including velocity
        this.obstacles.push({ mesh, boundingBox, velocityX });
    }

    update(deltaTime) {
        // --- Spawning ---
        this.spawnTimer += deltaTime;
        if (this.spawnTimer >= this.spawnInterval) {
            this.spawn();
            this.spawnTimer = 0;
        }

        // --- Update Positions & Remove Off-screen ---
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            const obsData = this.obstacles[i];
            const obsMesh = obsData.mesh;

            // Move up based on world scroll speed
            obsMesh.position.y += this.worldScrollSpeed * deltaTime;
            // Apply horizontal movement if any
            obsMesh.position.x += obsData.velocityX * deltaTime;

            // Update bounding box after moving
            obsData.boundingBox.setFromObject(obsMesh);

            // Remove if far above the screen (adjust threshold as needed)
            const removalHeight = 150; // How far above origin before removing
            if (obsMesh.position.y > removalHeight) {
                this.scene.remove(obsMesh);
                // TODO: Properly dispose geometry and material if performance becomes an issue
                // if (obsMesh.geometry) obsMesh.geometry.dispose();
                // if (obsMesh.material) obsMesh.material.dispose();
                this.obstacles.splice(i, 1); // Remove from array
            }
        }
    }
}
