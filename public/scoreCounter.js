import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
// Import GSAP via CDN (make sure your internet connection is active during development)
import { gsap } from 'https://unpkg.com/gsap@3.12.4/index.js';

const textureLoader = new THREE.TextureLoader();

export class ScoreCounter {
    constructor(scene, initialScore = 0, position = new THREE.Vector3(0, 4.6, 0), numDigits = 6) {
        this.scene = scene;
        this.score = initialScore;
        this.numDigits = numDigits;
        this.digits = [];
        
        // Dimensions for digit planes
        this.digitWidth = 0.3;
        this.digitHeight = 0.4;
        this.digitSpacing = 0.1;
        
        // Create group to hold all digits
        this.group = new THREE.Group();
        this.group.position.copy(position);
        scene.add(this.group);
        
        // Create animationQueue to manage animations better
        this.animationQueue = new Map();
        
        // Load texture
        this.digitTexture = textureLoader.load('textures/digit_atlas.png', (texture) => {
            console.log("Score texture loaded successfully");
            this.createDigits();
        });
        
        // If texture is already loaded (from cache)
        if (this.digitTexture.image) {
            this.createDigits();
        }
    }
    
    createDigits() {
        if (this.digits.length > 0) return; // Prevent duplicate creation
        
        // Calculate total width to center the score
        const totalWidth = this.numDigits * (this.digitWidth + this.digitSpacing) - this.digitSpacing;
        const startX = -totalWidth / 2 + this.digitWidth / 2;
        
        // Create each digit
        for (let i = 0; i < this.numDigits; i++) {
            // Create a plane for this digit
            const geometry = new THREE.PlaneGeometry(this.digitWidth, this.digitHeight);
            
            // Create material with the digit texture
            const material = new THREE.MeshBasicMaterial({
                map: this.digitTexture,
                transparent: true,
                alphaTest: 0.1
            });
            
            // Create mesh
            const mesh = new THREE.Mesh(geometry, material);
            
            // Position in row
            mesh.position.x = startX + i * (this.digitWidth + this.digitSpacing);
            
            // Texture coordinates for digits 0-9
            if (material.map) {
                material.map = this.digitTexture.clone();
                material.map.repeat.set(1, 0.1); // Each digit is 1/10th of the texture height
                
                // Start with digit 0 - if 0 is at the bottom of the texture atlas
                // then we need to use offset 0.9
                material.map.offset.set(0, 0.9);   // Set to 0.9 to show digit 0 (if digits run from top to bottom in texture)
            }
            
            // Add to group and track
            this.group.add(mesh);
            this.digits.push({
                mesh: mesh,
                material: material,
                currentValue: 0
            });
        }
        
        // Set initial score
        this.setScore(this.score, true);
    }
    
    setScore(newScore, forceImmediate = false) {
        if (this.digits.length === 0) return;
        
        if (newScore === this.score && !forceImmediate) return;
        
        // Update score
        this.score = Math.floor(newScore);
        const scoreString = this.score.toString().padStart(this.numDigits, '0');
        
        // Update each digit
        for (let i = 0; i < this.numDigits; i++) {
            const targetValue = parseInt(scoreString[i], 10);
            const digit = this.digits[i];
            
            // Skip if no change needed
            if (digit.currentValue === targetValue && !forceImmediate) continue;
            
            const targetOffset = 0.9 - (targetValue * 0.1);
            
            if (forceImmediate) {
                // Set immediately
                if (digit.material.map) {
                    digit.material.map.offset.y = targetOffset;
                }
                digit.currentValue = targetValue;
                continue;
            }
            
            // Improved animation with variable duration and easing
            if (digit.material.map) {
                // Get the digit position (rightmost = highest frequency changes)
                const digitPosition = this.numDigits - 1 - i; // 0 for leftmost, (numDigits-1) for rightmost
                
                // Clear any existing animation for this digit
                if (this.animationQueue.has(i)) {
                    gsap.killTweensOf(digit.material.map.offset);
                }
                
                // Calculate animation properties based on digit position
                // Rightmost digits change faster but need smoother transitions
                let duration = 0.4; // Slightly shorter base duration
                let ease = "power2.out"; // Default easing
                
                if (digitPosition === 0) {
                    // For rightmost digit (ones place) - even smoother animation
                    duration = 0.15; // Even shorter duration
                    ease = "linear"; // Linear can sometimes appear smoother at very short durations
                } else if (digitPosition === 1) {
                    // For tens place - medium
                    duration = 0.25;
                    ease = "sine.out";
                } else {
                    // For higher places - longer animation
                    duration = 0.35 + (digitPosition * 0.05);
                    ease = "power1.out";
                }
                
                // Force higher precision rendering during animation
                gsap.ticker.lagSmoothing(1000, 16); // Improve timing precision
                
                // Animation - improved
                const tween = gsap.to(digit.material.map.offset, {
                    y: targetOffset,
                    duration: duration,
                    ease: ease,
                    overwrite: true, // Ensure any new animation overrides existing ones
                    onComplete: () => {
                        // Update current value when animation completes
                        digit.currentValue = targetValue;
                        // Remove from queue
                        this.animationQueue.delete(i);
                    }
                });
                
                // Store in animation queue
                this.animationQueue.set(i, tween);
            }
        }
    }
    
    updatePosition(newPosition) {
        this.group.position.copy(newPosition);
    }
    
    flashRed() {
        // This method will be called from main.js
        // Flash all digits red briefly
        this.digits.forEach(digit => {
            if (digit && digit.material) {
                const originalColor = new THREE.Color();
                if (digit.material.color) {
                    originalColor.copy(digit.material.color);
                }
                
                // Flash the digits red with animation - safer approach
                gsap.to(digit.material.color, {
                    r: 1.0,
                    g: 0.0,
                    b: 0.0,
                    duration: 0.1,
                    repeat: 3,
                    yoyo: true,
                    onComplete: () => {
                        if (digit.material) { // Safety check
                            digit.material.color.copy(originalColor);
                        }
                    }
                });
            }
        });
    }
}