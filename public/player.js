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

        // Animation properties
        this.frames = []; // Array to hold all texture frames
        this.materials = []; // Array to hold materials for each frame
        this.currentFrame = 0;
        this.frameCount = 6; // We have 6 frames (player1.png to player6.png)
        this.animationSpeed = 10; // Frames per second
        this.animationTimer = 0;
        
        // Load the player animation frames
        this.loadPlayerFrames();

        // --- Player Properties ---
        this.moveSpeed = 5; // Keyboard horizontal speed
        this.horizontalBoundary = 0;
        this.velocityY = 0;
        this.gravity = -9.81 * 2.0;
        this.targetY = 0; // This is used as the "base" position
        this.isVisuallyFalling = false; // Change to false so player can move immediately
        this.illusionScrollSpeed = 11; // Set to base fall speed immediately
        this.baseFallSpeed = 11;
        
        // --- Vertical Movement Properties ---
        this.verticalMoveSpeed = 10; // Increase from 6 to 10 for faster vertical movement
        this.verticalRange = 20.0; // Even larger range
        this.verticalOffset = 0;

        // --- Touch Sensitivity --- <<< RENAMED/REPURPOSED
        // How much world units to move per pixel of touch drag
        this.touchSensitivityX = 0.02; // Adjust for desired horizontal drag speed
        this.touchSensitivityY = 0.02; // Adjust for desired vertical drag speed
        // --- End Touch Sensitivity ---

        // Add fallback timer
        setTimeout(() => {
            if (!this.mesh) {
                console.warn("Player frames not loaded after timeout, using fallback");
                this.loadFallbackTexture();
            }
        }, 5000); // 5 second timeout
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
    update(deltaTime, kbdState = {}, touchState = {}) {
        // Skip update if mesh isn't ready yet
        if (!this.mesh) return;
        
        if (!this.mesh || !camera) return;

        // --- Calculate Screen Boundaries ---
        // Visible height at z=0 (player plane)
        const vFOV = THREE.MathUtils.degToRad(camera.fov); // Vertical FOV in radians
        const height = 2 * Math.tan(vFOV / 2) * Math.abs(camera.position.z);
        // Visible width at z=0
        const width = height * camera.aspect;
        // Calculate boundary based on screen width and player width
        this.horizontalBoundary = (width / 2) - (this.playerWidth / 2);
        
        // Also calculate vertical boundaries
        const topLimit = (height / 2) - 0.3; // Only 0.3 units from top of screen (was 1.5)
        const bottomLimit = -(height / 2) + 2.7; //2.7 Keep bottom limit to prevent portal issues
        // --- End Calculate Screen Boundaries ---

        // --- Handle Horizontal Movement ---
        let horizontalMovement = 0;
        if (touchState.touching && touchState.deltaX !== 0) {
            horizontalMovement = touchState.deltaX * this.touchSensitivityX;
        } else {
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
        
        // Skip the falling phase completely and go right to player control
        if (this.isVisuallyFalling) {
            this.isVisuallyFalling = false;
            this.illusionScrollSpeed = this.baseFallSpeed;
            this.verticalOffset = 0;
            console.log("Player vertical controls enabled.");
        }
        
        // Always allow vertical movement
        let verticalMovement = 0;
        
        if (touchState.touching && touchState.deltaY !== 0) {
            verticalMovement = -touchState.deltaY * this.touchSensitivityY * 2;
        } else {
            let moveDirectionY = 0;
            if (kbdState.ArrowUp) { moveDirectionY += 1; }
            if (kbdState.ArrowDown) { moveDirectionY -= 1; }
            verticalMovement = moveDirectionY * this.verticalMoveSpeed * deltaTime;
        }
        
        // Apply direct position change
        this.mesh.position.y += verticalMovement;
        
        // Clamp position to screen boundaries (using previously calculated limits)
        this.mesh.position.y = Math.max(bottomLimit, Math.min(topLimit, this.mesh.position.y));
        // --- End Apply Gravity / Vertical State ---

        // --- Other Updates (facing camera) ---
        this.mesh.rotation.copy(camera.rotation);
        // --- End Other Updates ---

        // Update animation
        this.updateAnimation(deltaTime);
    }

    // Method for external components to get the scroll speed
    getScrollSpeed() {
        return this.illusionScrollSpeed;
    }

    // Add other methods as needed (e.g., handleCollision, jump)

    // Add this method to your Player class
    getPosition() {
        if (!this.mesh) return new THREE.Vector3(0, 0, 0);
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
    createPlayerMesh(initialMaterial) {
        // Create a sprite with the first frame's material
        const sprite = new THREE.Sprite(initialMaterial);
        
        // Set the sprite's initial position and scale
        sprite.position.set(0, 0, 0); // Start at origin
        
        // Scale the sprite to a reasonable size
        sprite.scale.set(1, 1, 1);
        
        // Store the mesh and add it to the scene
        this.mesh = sprite;
        this.scene.add(this.mesh);
        
        console.log("Created player sprite mesh");
    }

    loadPlayerFrames() {
        const textureLoader = new THREE.TextureLoader();
        let framesLoaded = 0;
        
        // Try different path formats to find the correct one
        const possibleBasePaths = [
            `textures/player/player`, // Relative path
            `/textures/player/player`, // Root-relative path
            `./textures/player/player`, // Explicit relative path
            window.location.origin + '/textures/player/player' // Full URL
        ];
        
        console.log("Current location:", window.location.href);
        console.log("Trying to load player frames from possible paths:", possibleBasePaths);
        
        let pathIndex = 0;
        const tryLoadFrames = () => {
            if (pathIndex >= possibleBasePaths.length) {
                console.error("Failed to load player frames from all possible paths. Falling back to static texture.");
                this.loadFallbackTexture();
                return;
            }
            
            const basePath = possibleBasePaths[pathIndex];
            console.log(`Attempting to load player frames from base path: ${basePath}`);
            
            // Try to load test frame 1 first to verify path
            textureLoader.load(
                `${basePath}1.png`,
                (texture) => {
                    console.log(`✅ Success! Found correct path: ${basePath}`);
                    
                    // Now load all frames with the correct path
                    for (let i = 1; i <= this.frameCount; i++) {
                        const frameURL = `${basePath}${i}.png`;
                        console.log(`Loading frame ${i} from: ${frameURL}`);
                        
                        textureLoader.load(
                            frameURL,
                            (texture) => {
                                // Create a material for this frame
                                const material = new THREE.SpriteMaterial({ 
                                    map: texture,
                                    transparent: true
                                });
                                
                                // Store the texture and material (at correct index)
                                const frameIndex = i - 1;
                                this.frames[frameIndex] = texture;
                                this.materials[frameIndex] = material;
                                
                                framesLoaded++;
                                console.log(`Loaded player frame ${i}/${this.frameCount}`);
                                
                                // When the first frame is loaded, create the mesh
                                if (framesLoaded === 1) {
                                    this.createPlayerMesh(material);
                                }
                                
                                // When all frames are loaded, player is ready
                                if (framesLoaded === this.frameCount) {
                                    console.log("All player animation frames loaded successfully");
                                    this.isLoading = false;
                                }
                            },
                            undefined,
                            (error) => {
                                console.error(`Error loading player frame ${i} from ${frameURL}:`, error);
                            }
                        );
                    }
                },
                undefined,
                (error) => {
                    console.log(`❌ Failed to load from ${basePath}1.png - trying next path`);
                    pathIndex++;
                    tryLoadFrames(); // Try next path
                }
            );
        };
        
        // Start trying paths
        tryLoadFrames();
    }

    // Method to update the current animation frame
    updateAnimation(deltaTime) {
        if (this.isLoading || this.frames.length < this.frameCount) {
            return; // Animation not ready yet
        }
        
        // Update animation timer
        this.animationTimer += deltaTime;
        const frameDuration = 1 / this.animationSpeed;
        
        // Check if it's time to advance to the next frame
        if (this.animationTimer >= frameDuration) {
            // Move to next frame
            this.currentFrame = (this.currentFrame + 1) % this.frameCount;
            
            // Update the sprite's material
            if (this.mesh && this.materials[this.currentFrame]) {
                this.mesh.material = this.materials[this.currentFrame];
            }
            
            // Reset timer, accounting for any remainder
            this.animationTimer %= frameDuration;
        }
    }

    // Add this fallback method:
    loadFallbackTexture() {
        console.log("Loading fallback player texture");
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            'textures/player.png', // Original static texture
            (texture) => {
                const material = new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true
                });
                this.createPlayerMesh(material);
                this.isLoading = false;
            },
            undefined,
            (error) => {
                console.error("Critical error: Failed to load fallback player texture:", error);
            }
        );
    }
} 