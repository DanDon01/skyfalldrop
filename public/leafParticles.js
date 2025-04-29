import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class LeafParticles {
    constructor(scene) {
        this.scene = scene;
        this.leaves = [];
        this.leafGroup = new THREE.Group();
        this.leafMaterials = [];
        this.maxLeaves = 5; // Maximum number of leaves on screen
        this.spawnTimer = 0;
        this.spawnInterval = 0.5; // Time between leaf spawns
        
        // Create container for leaves
        scene.add(this.leafGroup);
        
        // Load leaf textures
        this.textureLoader = new THREE.TextureLoader();
        this.leafTextures = [];
        this.loadedTextureCount = 0;
        this.totalTextures = 10;
        
        // Load all leaf textures
        for (let i = 1; i <= this.totalTextures; i++) {
            this.loadLeafTexture(`textures/leaves/leaf${i}.png`);
        }
    }
    
    loadLeafTexture(path) {
        this.textureLoader.load(
            path,
            (texture) => {
                // Create material from texture
                const material = new THREE.SpriteMaterial({
                    map: texture,
                    transparent: true,
                    opacity: 0.9
                });
                
                this.leafMaterials.push(material);
                this.loadedTextureCount++;
                
                console.log(`Loaded leaf texture: ${path} (${this.loadedTextureCount}/${this.totalTextures})`);
                
                // If this is the first texture, start spawning to ensure we have some leaves
                if (this.loadedTextureCount === 1) {
                    this.spawnLeaf();
                }
            },
            undefined,
            (error) => {
                console.error(`Error loading leaf texture: ${path}`, error);
            }
        );
    }
    
    spawnLeaf() {
        // Only spawn if we have materials and aren't at max leaves
        if (this.leafMaterials.length === 0 || this.leaves.length >= this.maxLeaves) {
            return;
        }
        
        // Pick a random leaf material
        const materialIndex = Math.floor(Math.random() * this.leafMaterials.length);
        const material = this.leafMaterials[materialIndex].clone();
        
        // Create leaf sprite
        const leaf = new THREE.Sprite(material);
        
        // Set random size (leaves vary in size)
        const size = 0.2 + Math.random() * 0.2;
        leaf.scale.set(size, size, 1);
        
        // Position guaranteed to be off-screen
        let spawnMode = Math.floor(Math.random() * 3);
        let x, y;
        
        switch (spawnMode) {
            case 0: // Top (above screen)
                x = (Math.random() - 0.5) * 14; // Full width coverage
                y = 12 + Math.random() * 3;     // Definitely above viewport
                break;
            case 1: // Left side (off screen)
                x = -8 - Math.random() * 3;     // Further off-screen
                y = (Math.random() - 0.5) * 20; // Full height coverage
                break;
            case 2: // Right side (off screen)
                x = 8 + Math.random() * 3;      // Further off-screen
                y = (Math.random() - 0.5) * 20; // Full height coverage
                break;
        }
        
        leaf.position.set(x, y, Math.random() * 3 - 5); // Random Z to create depth
        
        // Add physics properties for movement
        leaf.userData = {
            // Base velocity - ensure leaves move into the screen
            velocity: new THREE.Vector3(
                // Horizontal velocity pushes leaves toward center from sides
                spawnMode === 1 ? Math.random() * 1.0 : // From left, move right
                spawnMode === 2 ? -Math.random() * 1.0 : // From right, move left
                (Math.random() - 0.5) * 1.0, // From top, random horizontal drift
                
                // Vertical velocity - always downward but varies by spawn position
                spawnMode === 0 ? -0.8 - Math.random() * 1.2 : // From top, faster fall
                -0.3 - Math.random() * 0.8,  // From sides, more gradual fall
                
                0
            ),
            // Rotation speed (how fast the leaf spins)
            rotationSpeed: (Math.random() - 0.5) * 0.05,
            // Wobble properties (for side-to-side motion)
            wobble: {
                amplitude: 0.5 + Math.random() * 1.5,
                frequency: 0.2 + Math.random() * 0.8,
                offset: Math.random() * Math.PI * 2
            },
            // Time alive (for wobble calculation)
            time: 0,
            // Give each leaf a random lifetime
            lifetime: 8 + Math.random() * 12 // Slightly longer lifetime to allow full travel across screen
        };
        
        // Add to scene and tracking array
        this.leafGroup.add(leaf);
        this.leaves.push(leaf);
        
        // Debug output to track leaf count
        console.log(`Spawned leaf. Total leaves: ${this.leaves.length}/${this.maxLeaves}`);
    }
    
    update(deltaTime) {
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Only spawn if we're below max leaves
        const canSpawn = this.leaves.length < this.maxLeaves;
        
        // Check if it's time to spawn a new leaf
        if (canSpawn && this.spawnTimer >= this.spawnInterval) {
            this.spawnLeaf();
            this.spawnTimer = 0;
            
            // Double-check to ensure we didn't exceed the limit
            if (this.leaves.length > this.maxLeaves) {
                // If somehow we went over, remove excess leaves
                while (this.leaves.length > this.maxLeaves) {
                    const leaf = this.leaves.pop();
                    if (leaf) {
                        this.leafGroup.remove(leaf);
                        if (leaf.material) leaf.material.dispose();
                    }
                }
            }
        }
        
        // Update each leaf
        for (let i = this.leaves.length - 1; i >= 0; i--) {
            const leaf = this.leaves[i];
            
            // Skip if leaf is null or has no userData
            if (!leaf || !leaf.userData) continue;
            
            // Increment time alive
            leaf.userData.time += deltaTime;
            
            // Calculate wobble effect (side-to-side motion)
            const wobble = leaf.userData.wobble;
            const wobbleX = Math.sin(leaf.userData.time * wobble.frequency + wobble.offset) * wobble.amplitude * deltaTime;
            
            // Update position
            leaf.position.x += leaf.userData.velocity.x * deltaTime + wobbleX;
            leaf.position.y += leaf.userData.velocity.y * deltaTime;
            
            // Rotate the leaf
            if (leaf.material) {
                leaf.material.rotation += leaf.userData.rotationSpeed;
            }
            
            // Slow down falling leaves slightly over time (air resistance)
            leaf.userData.velocity.y *= 0.99;
            
            // Remove leaf if it's gone offscreen or exceeded lifetime
            if (leaf.position.y < -15 || leaf.position.x < -10 || leaf.position.x > 10 || 
                leaf.userData.time > leaf.userData.lifetime) {
                this.leafGroup.remove(leaf);
                this.leaves.splice(i, 1);
                
                // Clean up material to prevent memory leaks
                if (leaf.material) {
                    leaf.material.dispose();
                }
            }
        }
    }
    
    // Set number of leaves based on theme (more in autumn, fewer in winter, etc.)
    setLeafCount(count) {
        this.maxLeaves = count;
        
        // If current leaf count is greater than new max, remove extras
        while (this.leaves.length > this.maxLeaves) {
            const leaf = this.leaves.pop();
            this.leafGroup.remove(leaf);
            
            if (leaf && leaf.material) {
                leaf.material.dispose();
            }
        }
    }
    
    dispose() {
        // Clean up all leaves and materials
        this.leaves.forEach(leaf => {
            if (leaf.material) {
                leaf.material.dispose();
            }
        });
        
        this.leafMaterials.forEach(material => {
            material.dispose();
            if (material.map) {
                material.map.dispose();
            }
        });
        
        this.scene.remove(this.leafGroup);
        this.leaves = [];
        this.leafMaterials = [];
    }
} 