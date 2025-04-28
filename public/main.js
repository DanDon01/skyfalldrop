// Use full CDN URL for Three.js import
import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
// Import the Player class from the new file
import { Player } from './player.js';
// Import the Background class
import { Background } from './background.js';
import { ObstacleManager } from './obstacleManager.js'; // <<< IMPORT
import { ScoreCounter } from './scoreCounter.js'; // <<< IMPORT
// Import the collision system
import { CollisionSystem } from './collision.js';
import { gsap } from 'https://unpkg.com/gsap@3.12.4/index.js';
// Add import for the Portal
import { Portal } from './portal.js';
// Add import for the WindEffect
import { WindEffect } from './windEffect.js';
// Add import for the TrailEffect
import { TrailEffect } from './trailEffect.js';
// Add import for the SkyBackground
import { SkyBackground } from './skyBackground.js';
// Add import for AudioManager
import { AudioManager } from './audioManager.js';

// --- Global variables for Three.js components ---
let scene;
let camera;
let renderer;
// let cube; // We can remove the test cube now
let player = null; // <<< Add a variable for the player instance
let background = null; // <<< ADD THIS
let obstacleManager = null; // <<< ADD GLOBAL
let scoreCounter = null; // <<< ADD
let currentScoreValue = 0; // <<< ADD: Store the raw score value
let portal = null; // Add to global variables
const PORTAL_THRESHOLD = 10000; // Score needed to activate portal
// Add to global variables
let windEffect = null;
let trailEffect = null;
// Add to global variables
let skyBackground = null;
// Add to global variables
let audioManager = null;
// --- Export camera ---
export { camera }; // <<< EXPORT the camera variable
// --- Input State ---
const keyboardState = {
    ArrowLeft: false,
    ArrowRight: false,
    ArrowUp: false,   // <<< ADD
    ArrowDown: false, // <<< ADD
    KeyP: false       // Add P key tracking
};
const touchState = {
    touching: false,
    startX: 0,         // Keep startX/Y if needed for other gestures later, but not for drag delta
    startY: 0,
    lastX: 0,          // <<< ADD: Store previous frame's X
    lastY: 0,          // <<< ADD: Store previous frame's Y
    deltaX: 0,         // <<< ADD: Movement delta X since last frame
    deltaY: 0,         // <<< ADD: Movement delta Y since last frame
};
// --- End Input State ---
// --- End Global variables ---

console.log("public/main.js loaded successfully.");
console.log("Three.js version:", THREE.REVISION);

// --- Helper Function: Calculate World Position from Screen ---
function getScreenToWorldPosition(screenXPercent, screenYPercent, camera, distance) {
    const vec = new THREE.Vector3();
    // Convert percentage to normalized device coordinates (-1 to +1)
    vec.set(
        (screenXPercent / 100) * 2 - 1,
        -(screenYPercent / 100) * 2 + 1, // Y is inverted
        0.5 // Z doesn't matter much here, will be projected
    );
    // Unproject the vector
    vec.unproject(camera);
    // Get direction from camera and scale by distance
    vec.sub(camera.position).normalize();
    const worldPosition = camera.position.clone().add(vec.multiplyScalar(distance));
    return worldPosition;
}
// --- End Helper Function ---

// Initialize collision system after player and obstacleManager are created
let collisionSystem;

// Add this near the beginning where global variables are defined
window.gameState = {
    score: 0,
    reducingScore: false,
    
    reduceScore: function(amount) {
        // Make sure we don't go below zero
        currentScoreValue = Math.max(0, currentScoreValue - amount);
        
        // Update score display
        if (scoreCounter) {
            // Flash score counter red
            this.flashScoreCounter();
            // Update displayed score
            scoreCounter.setScore(Math.floor(currentScoreValue));
            lastScoreUpdate = Math.floor(currentScoreValue);
        }
        
        console.log(`Score reduced by ${amount}. New score: ${currentScoreValue}`);
    },
    
    flashScoreCounter: function() {
        if (!scoreCounter || !scoreCounter.group || !scoreCounter.digits) return;
        
        // Create a temporary red tint effect
        scoreCounter.digits.forEach(digit => {
            if (digit && digit.material && digit.material.color) {
                // Store original color
                const originalColor = new THREE.Color().copy(digit.material.color);
                
                // Flash red
                gsap.to(digit.material.color, {
                    r: 1,
                    g: 0.3,
                    b: 0.3,
                    duration: 0.2,
                    yoyo: true,
                    repeat: 2,
                    onComplete: () => {
                        // Restore original color
                        if (digit.material) { // Safety check
                            digit.material.color.copy(originalColor);
                        }
                    }
                });
            }
        });
        
        // Shake the score counter
        const originalPosition = scoreCounter.group.position.clone();
        
        // Shake animation sequence
        gsap.to(scoreCounter.group.position, {
            x: originalPosition.x + 0.2,
            duration: 0.05,
            yoyo: true,
            repeat: 5,
            onComplete: () => {
                // Reset to original position
                if (scoreCounter.group) { // Safety check
                    scoreCounter.group.position.copy(originalPosition);
                }
            }
        });
    }
};

function initGame() {
    console.log("Initializing game...");

    // 1. Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x112233); // Keep scene background

    // 2. Camera
    const fov = 75; // Field of view
    const aspect = window.innerWidth / window.innerHeight; // Aspect ratio
    const near = 0.1; // Near clipping plane
    const far = 1000; // Far clipping plane
    camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(0, 1, 5); // Adjusted camera slightly

    // 3. Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true }); // antialias for smoother edges
    renderer.setSize(window.innerWidth, window.innerHeight); // Set size to full window
    renderer.setPixelRatio(window.devicePixelRatio); // Adjust for high-DPI screens
    document.body.appendChild(renderer.domElement); // Add the canvas to the HTML body
    console.log("Scene, Camera, and Renderer initialized.");

    // --- Remove Test Cube ---
    // const geometry = new THREE.BoxGeometry(1, 1, 1);
    // const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    // cube = new THREE.Mesh(geometry, material);
    // scene.add(cube);
    // console.log("Test cube added to the scene.");
    // --- End Test Cube ---

    // --- Add Lighting --- <<< ADD
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // Soft white light
    scene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(5, 10, 7.5); // Position the light
    scene.add(directionalLight);
    // --- End Lighting ---

    // --- Create Background Instance ---
    background = new Background(scene, camera);
    // --- End Background Instance ---

    // --- Create Player Instance ---
    player = new Player(scene);
    // --- End Player Instance ---

    // --- Create Obstacle Manager Instance ---
    obstacleManager = new ObstacleManager(scene, camera);
    // --- End Obstacle Manager Instance ---

    // --- Create Score Counter Instance (with FIXED position) ---
    // Comment out screen-based calculation for now
    // const scoreDistance = camera.near + 1;
    // let scorePosition = getScreenToWorldPosition(50, 25, camera, scoreDistance);
    // console.log("Initial Score Position Calculated:", scorePosition.x.toFixed(2), scorePosition.y.toFixed(2), scorePosition.z.toFixed(2));

    // Set a fixed world position (adjust Y as needed)
    const scorePosition = new THREE.Vector3(0, 4.6, 0); // <<< ADJUST Y VALUE (e.g., 4.6 or 4.5)
    console.log("Using FIXED Score Position:", scorePosition.x.toFixed(2), scorePosition.y.toFixed(2), scorePosition.z.toFixed(2));

    scoreCounter = new ScoreCounter(scene, 0, scorePosition);
    console.log("ScoreCounter Group Position AFTER creation:", scoreCounter.group.position.x.toFixed(2), scoreCounter.group.position.y.toFixed(2), scoreCounter.group.position.z.toFixed(2));
    // --- End Create Instances ---

    // --- Setup Input Listeners ---
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    // Add touch listeners (use renderer canvas for better targeting)
    renderer.domElement.addEventListener('touchstart', handleTouchStart, { passive: false }); // passive:false to allow preventDefault if needed later
    renderer.domElement.addEventListener('touchmove', handleTouchMove, { passive: false });
    renderer.domElement.addEventListener('touchend', handleTouchEnd);
    renderer.domElement.addEventListener('touchcancel', handleTouchEnd); // Handle cancellation same as end
    console.log("Input listeners added (Keyboard & Touch).");
    // --- End Input Listeners ---

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);

    // Create collision system
    collisionSystem = new CollisionSystem(scene, player, obstacleManager);
    
    // Optional: Add collision event listener
    document.addEventListener('player-collision', handleCollision);

    // Create portal (activated at score threshold)
    portal = new Portal(scene, PORTAL_THRESHOLD);
    
    // Listen for portal events
    document.addEventListener('portal-activated', handlePortalActivated);
    document.addEventListener('portal-entered', handlePortalEntered);

    // Show control hints that fade out after 10 seconds
    showControlHints();

    // Create wind effect after scene is set up
    windEffect = new WindEffect(scene, camera);

    // Create trail effect after player is set up
    trailEffect = new TrailEffect(scene, player);

    // Create dynamic sky background after scene is set up
    skyBackground = new SkyBackground(scene);

    // Create audio manager
    audioManager = new AudioManager();
    audioManager.addListenerToCamera(camera);
    
    // Start wind sound for falling effect
    audioManager.startWindSound();

    // Show control hints
    showControlHints();
    
    // Add the Let's Go animation
    showLetsGoAnimation();
    
    // Start the animation loop
    animate();
    console.log("Game initialized and animation loop started.");

    // Add audio initialization after user interaction
    window.addEventListener('click', initAudio);
    window.addEventListener('keydown', initAudio);
    window.addEventListener('touchstart', initAudio);
}

// --- Input Handling Functions ---
function handleKeyDown(event) {
    // Handle standard arrow keys
    if (keyboardState.hasOwnProperty(event.key)) {
        keyboardState[event.key] = true;
    }
    
    // Also track 'p' key specifically for portal entry
    if (event.key === 'p' || event.key === 'P') {
        keyboardState.KeyP = true;
    }
}

function handleKeyUp(event) {
    if (keyboardState.hasOwnProperty(event.key)) {
        keyboardState[event.key] = false;
    }
    
    // Reset P key state
    if (event.key === 'p' || event.key === 'P') {
        keyboardState.KeyP = false;
    }
}

// --- Touch Handling Functions ---
function handleTouchStart(event) {
    event.preventDefault();
    if (event.touches.length === 0) return;

    touchState.touching = true;
    const touch = event.touches[0];
    // Initialize start and last positions
    touchState.startX = touch.clientX;
    touchState.startY = touch.clientY;
    touchState.lastX = touch.clientX;
    touchState.lastY = touch.clientY;
    // Reset deltas
    touchState.deltaX = 0;
    touchState.deltaY = 0;

    console.log("Touch Start at:", touchState.startX, touchState.startY);
}

function handleTouchMove(event) {
    event.preventDefault();
    if (!touchState.touching || event.touches.length === 0) return;

    const touch = event.touches[0];
    const currentX = touch.clientX;
    const currentY = touch.clientY;

    // Calculate delta since the LAST frame's position
    touchState.deltaX = currentX - touchState.lastX;
    touchState.deltaY = currentY - touchState.lastY;

    // Update last position for the next frame
    touchState.lastX = currentX;
    touchState.lastY = currentY;

    // console.log(`Touch Move Delta: dX=${touchState.deltaX.toFixed(0)}, dY=${touchState.deltaY.toFixed(0)}`); // Optional detailed log
}

function handleTouchEnd(event) {
    touchState.touching = false;
    // Reset deltas when touch ends
    touchState.deltaX = 0;
    touchState.deltaY = 0;
    console.log("Touch End");
}
// --- End Touch Handling Functions ---

// Function to handle window resize
function onWindowResize() {
    if (camera && renderer) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
        console.log("Resized renderer and camera.");

        // --- Resize Background ---
        if (background) {
            background.onWindowResize(camera);
        }
        // --- End Resize Background ---

        // --- Update Score Position on Resize --- <<< COMMENT OUT FOR NOW
        // if (scoreCounter) {
        //     const scoreDistance = camera.near + 1;
        //     let scorePosition = getScreenToWorldPosition(50, 25, camera, scoreDistance);
        //     console.log("Resized Score Position Calculated:", scorePosition.x.toFixed(2), scorePosition.y.toFixed(2), scorePosition.z.toFixed(2));
        //     scoreCounter.updatePosition(scorePosition);
        //     console.log("ScoreCounter Group Position AFTER resize update:", scoreCounter.group.position.x.toFixed(2), scoreCounter.group.position.y.toFixed(2), scoreCounter.group.position.z.toFixed(2));
        // }
        // --- End Update Score Position ---
    }
}

// --- Animation Loop ---
let lastScoreUpdate = 0; // Store the last score passed to the counter

function animate() {
    requestAnimationFrame(animate);
    const deltaTime = 0.016; // Using fixed delta for now

    // --- Game logic updates ---
    let currentScrollSpeed = 0; // Default scroll speed is 0
    if (player) {
        player.update(deltaTime, keyboardState, touchState); // Pass both states separately
        currentScrollSpeed = player.getScrollSpeed(); // Get speed AFTER player update
    }

    // Get player's base scroll speed
    const playerScrollSpeed = player.getScrollSpeed();
    
    // Apply a multiplier to increase the perceived speed
    const scrollSpeedMultiplier = 1.5; // Increase by 50%
    const effectiveScrollSpeed = playerScrollSpeed * scrollSpeedMultiplier;
    
    // Update obstacles and background with the enhanced speed
    obstacleManager.update(deltaTime, effectiveScrollSpeed);
    background.update(deltaTime, effectiveScrollSpeed);

    // --- Calculate Score --- <<< RE-ADD CALCULATION
    calculateScore(deltaTime, effectiveScrollSpeed);
    // --- End Calculate Score ---

    // --- Update 3D Score Display --- <<< ADD
    const scoreToDisplay = Math.floor(currentScoreValue);
    // Only trigger the animation if the integer part of the score changes
    if (scoreCounter && scoreToDisplay !== lastScoreUpdate) {
         scoreCounter.setScore(scoreToDisplay);
         lastScoreUpdate = scoreToDisplay; // Update the last displayed score
    }
    // --- End Update 3D Score Display ---

    // Reset touch deltas AFTER they've been used
    if (touchState) {
        touchState.deltaX = 0;
        touchState.deltaY = 0;
    }
    // --- End Game logic updates ---

    // Update collision detection
    if (collisionSystem) {
        const collisions = collisionSystem.update();
        
        // Optional: Handle collision results directly if needed
        if (collisions.length > 0) {
            // Example: Camera shake or other global effects
            // shakeCamera();
        }
    }

    // Update portal with keyboard state
    if (portal) {
        portal.update(player.getPosition(), currentScoreValue, keyboardState);
    }

    // Update wind effect
    if (windEffect) {
        windEffect.update(deltaTime);
    }

    // Update trail effect
    if (trailEffect) {
        trailEffect.update(deltaTime);
    }

    // Update sky background with current score
    if (skyBackground) {
        skyBackground.update(deltaTime);
    }

    // Render the scene
    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    } else {
        console.error("Missing renderer, scene, or camera in animate loop.");
    }
}
// --- End Animation Loop ---

// Start the game initialization process when the DOM is ready
if (document.readyState === 'loading') { // Loading hasn't finished yet
    document.addEventListener('DOMContentLoaded', initGame);
} else { // `DOMContentLoaded` has already fired
    initGame();
}

function handleCollision(event) {
    // Handle collision at the game level
    const obstacle = event.detail.obstacle;
    
    // Reduce score on collision
    window.gameState.reduceScore(100);
    
    console.log(`Game detected collision with ${obstacle.id}`);

    // Create particle burst on collision
    if (trailEffect) {
        trailEffect.createBurst(15, 2.0); // More particles and higher speed for collisions
    }

    // Play collision sound
    if (audioManager) {
        audioManager.playCollisionSound();
    }
}

// Add debug toggle for collision (useful for development)
window.addEventListener('keydown', (event) => {
    if (event.key === 'c') {
        collisionSystem.toggleDebug();
        console.log("Collision debug mode:", collisionSystem.debug ? "ON" : "OFF");
    }
});

function calculateScore(deltaTime, scrollSpeed) {
    // Increase the multiplier from what's likely 1.0 to something higher
    const scoreMultiplier = 2.5; // Increase from likely 1.0 to 2.5
    
    // Apply to current calculation formula
    currentScoreValue += scrollSpeed * deltaTime * scoreMultiplier;
    
    // Update the score display less frequently to avoid performance issues
    if (Math.floor(currentScoreValue) > lastScoreUpdate) {
        if (scoreCounter) {
            scoreCounter.setScore(Math.floor(currentScoreValue));
            lastScoreUpdate = Math.floor(currentScoreValue);
        }
    }

    // Play score sound when score increases
    if (audioManager && Math.floor(currentScoreValue) > lastScoreUpdate) {
        audioManager.playScoreSound();
    }
}

function handlePortalActivated(event) {
    console.log("Portal has appeared! Reach it to exit the game.");
    // Could add visual cues, sounds, etc. here
}

function handlePortalEntered(event) {
    console.log("Entering portal to new destination!");
    // Any cleanup or final score submission could happen here

    // Play portal sound
    if (audioManager) {
        audioManager.playPortalSound();
    }
}

// Add this function to create and display the control hints
function showControlHints() {
    // Create the control hints container
    const controlHints = document.createElement('div');
    controlHints.id = 'control-hints';
    controlHints.style.position = 'absolute';
    controlHints.style.bottom = '50px'; // Position above the portal text
    controlHints.style.left = '50%';
    controlHints.style.transform = 'translateX(-50%)';
    controlHints.style.color = 'white';
    controlHints.style.fontFamily = 'Arial, sans-serif';
    controlHints.style.fontSize = '20px';
    controlHints.style.fontWeight = 'bold';
    controlHints.style.textAlign = 'center';
    controlHints.style.textShadow = '0 0 5px rgba(0, 0, 0, 0.8)';
    controlHints.style.pointerEvents = 'none';
    controlHints.style.opacity = '1';
    controlHints.style.transition = 'opacity 1.5s ease-in-out';
    controlHints.style.zIndex = '100';
    controlHints.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
    controlHints.style.padding = '10px 20px';
    controlHints.style.borderRadius = '20px';
    
    // Create arrow keys hint
    const arrowHint = document.createElement('div');
    arrowHint.innerHTML = 'Use arrow keys to dodge <span style="font-size: 24px;">←&nbsp;&nbsp;→</span>';
    controlHints.appendChild(arrowHint);
    
    // Add to document
    document.body.appendChild(controlHints);
    
    // Fade out after 10 seconds
    setTimeout(() => {
        controlHints.style.opacity = '0';
        
        // Remove from DOM after fade completes
        setTimeout(() => {
            if (controlHints.parentNode) {
                document.body.removeChild(controlHints);
            }
        }, 1500); // Match transition duration
    }, 10000);
}

function initAudio() {
    // Only needs to run once
    if (audioManager && !audioManager.initialized) {
        audioManager.initializeAudio();
        // Remove event listeners once audio is initialized
        window.removeEventListener('click', initAudio);
        window.removeEventListener('keydown', initAudio);
        window.removeEventListener('touchstart', initAudio);
    }
}

// Add this function to create and animate the "LET'S GO!" text
// Add it near the initGame function
function showLetsGoAnimation() {
    // Create the element
    const letsGoText = document.createElement('div');
    letsGoText.textContent = "LET'S GO!";
    letsGoText.style.position = 'fixed';
    letsGoText.style.top = '30%';
    letsGoText.style.left = '0';
    letsGoText.style.width = '100%';
    letsGoText.style.textAlign = 'center';
    letsGoText.style.color = 'white';
    letsGoText.style.fontFamily = '"Arial Black", Gadget, sans-serif';
    letsGoText.style.fontSize = '24px';
    letsGoText.style.fontWeight = 'bold';
    letsGoText.style.textShadow = '0 0 10px #00ffff, 0 0 20px #0000ff';
    letsGoText.style.zIndex = '1000';
    letsGoText.style.opacity = '0';
    letsGoText.style.pointerEvents = 'none'; // Don't block interactions
    document.body.appendChild(letsGoText);
    
    // Animate with GSAP
    gsap.to(letsGoText, {
        opacity: 1,
        fontSize: "80px",
        duration: 0.5,
        ease: "power2.out",
        onComplete: () => {
            gsap.to(letsGoText, {
                opacity: 0,
                y: -100,
                scale: 1.5,
                duration: 0.7,
                ease: "power2.in",
                onComplete: () => {
                    // Remove the element when animation is done
                    if (letsGoText.parentNode) {
                        document.body.removeChild(letsGoText);
                    }
                }
            });
        }
    });
} 