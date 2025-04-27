import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { gsap } from 'https://unpkg.com/gsap@3.12.4/index.js';

const textureLoader = new THREE.TextureLoader();

export class Obstacle {
    constructor(scene, texturePath, initialPosition, horizontalSpeed, horizontalRange) {
        this.scene = scene;
        this.mesh = null;
        this.horizontalSpeed = horizontalSpeed; // Speed of left/right movement
        this.horizontalRange = horizontalRange; // Max distance (+/-) to move horizontally from initial X
        this.initialX = initialPosition.x;      // Store the starting X to calculate range limits
        this.direction = Math.random() < 0.5 ? 1 : -1; // Initial horizontal direction (1 for right, -1 for left)

        // Add unique ID
        this.id = 'obstacle_' + Math.floor(Math.random() * 1000000);

        // --- Load Texture ---
        const obstacleTexture = textureLoader.load(
            texturePath,
            (texture) => {
                // Use texture aspect ratio for geometry if possible
                const aspect = texture.image ? texture.image.width / texture.image.height : 1;
                const height = 1.0; // Base height, adjust as needed
                const width = height * aspect;

                const geometry = new THREE.PlaneGeometry(width, height);
                const material = new THREE.MeshBasicMaterial({
                    map: texture,
                    transparent: true, // Assume PNGs with transparency
                    side: THREE.DoubleSide // Render both sides
                });

                this.mesh = new THREE.Mesh(geometry, material);
                this.mesh.position.copy(initialPosition); // Set initial position

                // Add to scene once mesh is ready
                this.addToScene();
                console.log(`Obstacle created with texture: ${texturePath}`);
            },
            undefined, // onProgress
            (error) => {
                console.error(`Error loading obstacle texture: ${texturePath}`, error);
                // Optional: Create a fallback placeholder if texture fails
                this.createFallbackCube(initialPosition);
                this.addToScene();
            }
        );
    }

    createFallbackCube(position) {
        console.warn("Creating fallback cube for obstacle.");
        const geometry = new THREE.BoxGeometry(0.8, 0.8, 0.1); // Small flat cube
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Red color
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(position);
    }

    addToScene() {
        if (this.scene && this.mesh) {
            this.scene.add(this.mesh);
        }
    }

    removeFromScene() {
        if (this.scene && this.mesh) {
            this.scene.remove(this.mesh);
            // Dispose geometry and material to free memory (important!)
            if (this.mesh.geometry) this.mesh.geometry.dispose();
            if (this.mesh.material) {
                if (this.mesh.material.map) this.mesh.material.map.dispose();
                this.mesh.material.dispose();
            }
            this.mesh = null; // Help garbage collection
            // console.log("Obstacle removed and disposed."); // Optional log
        }
    }

    update(deltaTime, scrollSpeed) {
        if (!this.mesh) return;

        // --- Vertical Movement (Scrolling Up) ---
        this.mesh.position.y += scrollSpeed * deltaTime;

        // --- Horizontal Movement ---
        this.mesh.position.x += this.horizontalSpeed * this.direction * deltaTime;

        // Check horizontal boundaries relative to initialX
        const leftLimit = this.initialX - this.horizontalRange;
        const rightLimit = this.initialX + this.horizontalRange;

        if (this.mesh.position.x <= leftLimit) {
            this.mesh.position.x = leftLimit; // Clamp position
            this.direction = 1; // Change direction to right
        } else if (this.mesh.position.x >= rightLimit) {
            this.mesh.position.x = rightLimit; // Clamp position
            this.direction = -1; // Change direction to left
        }

        // Keep obstacle facing the camera (optional, like player)
        // this.mesh.rotation.copy(camera.rotation); // Requires importing camera
    }

    // Basic bounding box for collision detection (Axis-Aligned)
    getBoundingBox() {
        if (!this.mesh) return null;
        // Ensure matrix world is up to date before calculating bounding box
        this.mesh.updateMatrixWorld(true);
        return new THREE.Box3().setFromObject(this.mesh);
    }

    getPosition() {
        return this.mesh.position.clone();
    }

    applyBounce(direction, force) {
        if (!this.mesh) return;
        
        // Store original position and movement data
        const originalPosition = this.mesh.position.clone();
        const originalDirection = this.direction;
        
        // Calculate bounce parameters
        const bounceVector = direction.clone().multiplyScalar(force);
        
        // Immediate small displacement
        this.mesh.position.add(bounceVector.clone().multiplyScalar(0.1));
        
        // Animated bounce movement
        gsap.to(this.mesh.position, {
            x: originalPosition.x + bounceVector.x,
            y: originalPosition.y + bounceVector.y,
            duration: 0.3,
            ease: "power2.out",
            onComplete: () => {
                // Reverse the horizontal direction after bounce
                this.direction = -originalDirection;
                
                // Optional: Increase horizontal speed temporarily
                const originalSpeed = this.horizontalSpeed;
                this.horizontalSpeed *= 1.5;
                
                // Return to normal speed after a short time
                setTimeout(() => {
                    this.horizontalSpeed = originalSpeed;
                }, 1000);
            }
        });
        
        // Visual effect on the obstacle (optional)
        if (this.mesh.material) {
            const originalOpacity = this.mesh.material.opacity || 1;
            
            // Flash effect
            gsap.to(this.mesh.material, {
                opacity: 0.7,
                duration: 0.1,
                yoyo: true,
                repeat: 3,
                onComplete: () => {
                    this.mesh.material.opacity = originalOpacity;
                }
            });
        }
    }
} 