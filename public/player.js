import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
// Import the camera from main.js
import { camera } from './main.js';
import { gsap } from 'https://unpkg.com/gsap@3.12.4/index.js';

// Create a single TextureLoader instance to be reused
const textureLoader = new THREE.TextureLoader();

export class Player {
    constructor(scene) {
        console.log("Creating Player...");
        this.scene = scene;
        this.mesh = null; // To hold the player's 3D object
        
        // Keep these player size properties that were accidentally removed
        this.playerWidth = 1.5 * 0.9;  // 10% smaller than original 1.5
        this.playerHeight = 1.5 * 0.9; // 10% smaller than original 1.5
        
        this.speed = 5; // Units per second
        this.position = new THREE.Vector3(0, 0, 0);

        // Load the player texture
        this.texture = textureLoader.load('textures/player.png');

        this.createPlayerMesh();

        // --- Player Properties ---
        this.moveSpeed = 5; // Keyboard horizontal speed
        this.horizontalBoundary = 0;
        this.velocityY = 0; // Back to original (was -15)
        this.gravity = -9.81 * 2.0; // Increased from -9.81 * 1.5
        this.targetY = 0;
        this.isVisuallyFalling = true;
        this.illusionScrollSpeed = 0;
        this.baseFallSpeed = 11;    // Increased from 7 to make background scroll faster

        // --- Vertical Movement Properties ---
        this.verticalMoveSpeed = 6; // Keyboard vertical speed
        this.verticalRange = 1.0;
        this.verticalOffset = 0;

        // --- Touch Sensitivity --- <<< RENAMED/REPURPOSED
        // How much world units to move per pixel of touch drag
        this.touchSensitivityX = 0.02; // Adjust for desired horizontal drag speed
        this.touchSensitivityY = 0.02; // Adjust for desired vertical drag speed
        // --- End Touch Sensitivity ---
    }

    // Helper function to add mesh to scene
    addToScene() {
        if (this.scene && this.mesh) {
            this.scene.add(this.mesh);
            console.log("Player mesh added to scene.");
        } else {
            console.error("Scene not provided or mesh not created!");
        }
    }

    // Helper function for fallback if texture fails
    createFallbackCube() {
        console.warn("Creating fallback red cube for player.");
        const geometry = new THREE.BoxGeometry(0.8, 1.5, 0.8);
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.set(0, 0, 0);
    }

    // Update method now accepts separate keyboard and touch states
    update(deltaTime, kbdState = {}, touchState = {}) { // Use defaults
        if (!this.mesh || !camera) return;
        // console.log("Player Update - Input:", inputState); // <<< ADD LOG

        // --- Calculate Screen Boundaries ---
        // Visible height at z=0 (player plane)
        const vFOV = THREE.MathUtils.degToRad(camera.fov); // Vertical FOV in radians
        const height = 2 * Math.tan(vFOV / 2) * camera.position.z;
        // Visible width at z=0
        const width = height * camera.aspect;
        // Calculate boundary based on screen width and player width
        this.horizontalBoundary = (width / 2) - (this.playerWidth / 2);
        // --- End Calculate Screen Boundaries ---

        // --- Handle Horizontal Movement ---
        let horizontalMovement = 0;
        if (touchState.touching && touchState.deltaX !== 0) {
            // Direct touch drag (deltaX is pixels moved since last frame)
            horizontalMovement = touchState.deltaX * this.touchSensitivityX;
            // Optional: Multiply by deltaTime if sensitivity is per second?
            // horizontalMovement *= deltaTime; // Try with and without this
        } else {
            // Keyboard movement (uses moveSpeed)
            let moveDirectionX = 0;
            if (kbdState.ArrowLeft) { moveDirectionX -= 1; }
            if (kbdState.ArrowRight) { moveDirectionX += 1; }
            horizontalMovement = moveDirectionX * this.moveSpeed * deltaTime;
        }

        let newX = this.mesh.position.x + horizontalMovement;
        newX = Math.max(-this.horizontalBoundary, Math.min(this.horizontalBoundary, newX));
        this.mesh.position.x = newX;
        // --- End Handle Horizontal Movement ---

        // --- Apply Gravity / Vertical State ---
        let finalY = this.mesh.position.y;

        if (this.isVisuallyFalling) {
            // Apply gravity during initial fall
            this.velocityY += this.gravity * deltaTime;
            let newY = this.mesh.position.y + this.velocityY * deltaTime;

            // Check if player reached or passed the target Y
            if (newY <= this.targetY) {
                finalY = this.targetY; // Clamp position to target
                this.velocityY = 0;
                this.isVisuallyFalling = false;
                this.illusionScrollSpeed = this.baseFallSpeed;
                this.verticalOffset = 0; // Reset vertical offset when reaching target
                console.log("Player reached target Y. Vertical controls enabled.");
            } else {
                finalY = newY; // Continue falling
            }
            this.mesh.position.y = finalY; // Update position during fall

        } else {
            // --- Handle Vertical Nudge Controls (Keyboard and Touch) ---
            let verticalMovement = 0; // Change in verticalOffset

            if (touchState.touching && touchState.deltaY !== 0) {
                // Direct touch drag (deltaY is pixels moved since last frame)
                // Screen Y is inverted relative to world Y, so subtract deltaY
                verticalMovement = -touchState.deltaY * this.touchSensitivityY;
                 // Optional: Multiply by deltaTime?
                 // verticalMovement *= deltaTime; // Try with and without this
            } else {
                 // Keyboard movement (uses verticalMoveSpeed)
                let moveDirectionY = 0;
                if (kbdState.ArrowUp) { moveDirectionY += 1; }
                if (kbdState.ArrowDown) { moveDirectionY -= 1; }
                verticalMovement = moveDirectionY * this.verticalMoveSpeed * deltaTime;
            }

            this.verticalOffset += verticalMovement;
            this.verticalOffset = Math.max(-this.verticalRange, Math.min(this.verticalRange, this.verticalOffset));
            finalY = this.targetY + this.verticalOffset;
            this.mesh.position.y = finalY;

            this.illusionScrollSpeed = this.baseFallSpeed;
            // --- End Vertical Nudge Controls ---
        }
        // --- End Apply Gravity / Vertical State ---

        // --- Other Updates (facing camera) ---
        this.mesh.rotation.copy(camera.rotation);
        // --- End Other Updates ---
    }

    // Method for external components to get the scroll speed
    getScrollSpeed() {
        return this.illusionScrollSpeed;
    }

    // Add other methods as needed (e.g., handleCollision, jump)

    // Add this method to your Player class
    getPosition() {
        return this.mesh.position.clone();
    }

    // Also add a collision handler method
    handleCollision(obstacle, impactDirection) {
        console.log("Player hit obstacle!");
        
        // Calculate jostle amount (should be a small nudge)
        const jostleAmount = 0.2; // How far to displace the player
        const jostleVector = impactDirection.clone().multiplyScalar(-jostleAmount);
        
        // Store original position to return to
        const originalPosition = this.mesh.position.clone();
        
        // Apply immediate displacement in opposite direction of impact
        this.mesh.position.add(jostleVector);
        
        // Animate recovery to original position
        gsap.to(this.mesh.position, {
            x: originalPosition.x,
            y: originalPosition.y,
            duration: 0.5,
            ease: "elastic.out(1.2, 0.5)" // Bouncy recovery
        });
        
        // Flash the player red
        this.showCollisionFeedback();
    }

    showCollisionFeedback() {
        // Flash the player red to indicate collision
        if (this.mesh.material) {
            const originalColor = this.mesh.material.color.clone();
            
            // Just change color - no emissive for MeshBasicMaterial
            this.mesh.material.color.set(0xff0000); // Red flash
            
            // Immediately create a transition back to white
            // This avoids the red color staying too long
            gsap.to(this.mesh.material.color, {
                r: 1,
                g: 1,
                b: 1,
                duration: 0.15, // Very quick transition
                ease: "power1.out"
            });
        }
    }

    // Adjust player sprite size to be 10% smaller
    createPlayerMesh() {
        // Create a plane geometry for the player sprite
        const geometry = new THREE.PlaneGeometry(this.playerWidth, this.playerHeight);
        
        // Create a material with the player texture
        const material = new THREE.MeshBasicMaterial({
            map: this.texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        // Create the mesh with the geometry and material
        this.mesh = new THREE.Mesh(geometry, material);
        
        // Start player above the center target (restored from original code)
        this.mesh.position.set(0, 8, 0); // Start higher
        
        // Add to scene
        this.scene.add(this.mesh);
    }
} 