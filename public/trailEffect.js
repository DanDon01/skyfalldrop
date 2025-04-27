import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class TrailEffect {
    constructor(scene, player) {
        this.scene = scene;
        this.player = player;
        this.particles = [];
        this.maxParticles = 35;
        this.particleLifespan = 1.2; // Shorter lifespan for faster visual effect
        this.spawnRate = 0.02;
        this.spawnTimer = 0;
        
        // Track if player is moving horizontally to adjust trail appearance
        this.isPlayerMoving = false;
        this.lastPlayerX = 0;
        
        // Load texture for particles
        this.textureLoader = new THREE.TextureLoader();
        this.particleTexture = this.textureLoader.load('https://threejs.org/examples/textures/sprites/spark1.png');
        
        // Create materials with different colors based on movement
        this.defaultMaterial = new THREE.SpriteMaterial({
            map: this.particleTexture,
            color: 0x9370DB, // Medium purple when not moving
            transparent: true,
            opacity: 0.4,
            blending: THREE.AdditiveBlending
        });
        
        this.movingMaterial = new THREE.SpriteMaterial({
            map: this.particleTexture,
            color: 0x00BFFF, // Bright blue when moving
            transparent: true,
            opacity: 0.5,
            blending: THREE.AdditiveBlending
        });
        
        // Add wave parameters for more natural motion
        this.waveAmplitude = 0.1; // Reduced for more direct upward motion
        this.waveFrequency = 3.0; // Increased for faster wave
        
        // Speed effect settings
        this.speedStretchFactor = 1.8; // Vertical stretch for speed lines
    }
    
    update(deltaTime) {
        // Check if player is moving horizontally
        if (this.player && this.player.mesh) {
            const currentX = this.player.mesh.position.x;
            this.isPlayerMoving = Math.abs(currentX - this.lastPlayerX) > 0.01;
            this.lastPlayerX = currentX;
        }
        
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        // Spawn new particles at regular intervals
        if (this.spawnTimer >= this.spawnRate) {
            this.spawnParticle();
            this.spawnTimer = 0;
        }
        
        // Update existing particles
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const particle = this.particles[i];
            
            // Update lifetime
            particle.lifetime -= deltaTime;
            particle.age += deltaTime;
            
            // Remove expired particles
            if (particle.lifetime <= 0) {
                this.scene.remove(particle.mesh);
                particle.mesh.material.dispose();
                this.particles.splice(i, 1);
                continue;
            }
            
            // Calculate life ratio
            const lifeRatio = particle.lifetime / this.particleLifespan;
            
            // Update opacity based on remaining lifetime
            particle.mesh.material.opacity = lifeRatio * 0.5;
            
            // Apply faster upward movement as particles age
            // This creates the illusion of particles being left behind by falling speed
            const ageAcceleration = 1 + particle.age * 2; // Increase speed over time
            
            // Add physics: particles move faster upward over time
            particle.mesh.position.x += particle.velocity.x * deltaTime;
            particle.mesh.position.y += particle.velocity.y * deltaTime * ageAcceleration; // Accelerate upward
            particle.mesh.position.z += particle.velocity.z * deltaTime;
            
            // Add wavy motion based on age
            const waveOffset = Math.sin(particle.age * this.waveFrequency) * this.waveAmplitude * deltaTime;
            particle.mesh.position.x += waveOffset * particle.waveDirection;
            
            // Apply a gentle spin
            particle.mesh.rotation.z += particle.rotationSpeed * deltaTime;
            
            // Vertically stretch particles as they move upward - creates speed lines effect
            const baseScale = lifeRatio * 0.15 + 0.03;
            const verticalStretch = baseScale * this.speedStretchFactor * (1 + particle.age);
            
            // Apply stretching in the vertical direction for speed effect
            particle.mesh.scale.set(
                baseScale, // X-scale
                verticalStretch, // Y-scale (stretched)
                baseScale // Z-scale
            );
            
            // Add outward spread as particles rise (as if being blown outward by air)
            const spreadFactor = (1 - lifeRatio) * 0.7;
            particle.mesh.position.x += particle.drift.x * spreadFactor * deltaTime * 2;
            particle.mesh.position.z += particle.drift.z * spreadFactor * deltaTime * 2;
        }
    }
    
    spawnParticle() {
        // Don't spawn if no player or if we already have maximum particles
        if (!this.player || !this.player.mesh || this.particles.length >= this.maxParticles) {
            return;
        }
        
        // Use different material based on movement state
        const material = this.isPlayerMoving ? 
            this.movingMaterial.clone() : 
            this.defaultMaterial.clone();
        
        // Create sprite for smoother-looking particle
        const sprite = new THREE.Sprite(material);
        
        // Position near top of player but with some variation
        sprite.position.copy(this.player.mesh.position);
        
        // Position at top of player
        sprite.position.y += 0.4 + Math.random() * 0.2; // Vary height slightly
        
        // Horizontal spread
        sprite.position.x += (Math.random() - 0.5) * 0.3;
        sprite.position.z += (Math.random() - 0.5) * 0.2;
        
        // Initial size - smaller for speed effect
        const baseSize = this.isPlayerMoving ? 0.12 : 0.1;
        const randomSize = baseSize * (0.7 + Math.random() * 0.3);
        sprite.scale.set(randomSize, randomSize, randomSize);
        
        // Random initial rotation
        sprite.rotation.z = Math.random() * Math.PI * 2;
        
        // Create particle physics properties - much more upward velocity
        const velocity = {
            x: (Math.random() - 0.5) * 0.4, // Horizontal variation
            y: 1.5 + Math.random() * 1.0,   // Strong upward velocity (was 0.8)
            z: (Math.random() - 0.5) * 0.2  // Depth variation
        };
        
        // Wider drift for more spread
        const drift = {
            x: (Math.random() - 0.5) * 0.8, 
            z: (Math.random() - 0.5) * 0.6
        };
        
        // Rotation speed 
        const rotationSpeed = (Math.random() - 0.5) * 3;
        
        // Wave direction (positive or negative)
        const waveDirection = Math.random() > 0.5 ? 1 : -1;
        
        // Add to scene and track in our array
        this.scene.add(sprite);
        this.particles.push({
            mesh: sprite,
            lifetime: this.particleLifespan * (0.7 + Math.random() * 0.5),
            velocity: velocity,
            drift: drift,
            rotationSpeed: rotationSpeed,
            age: 0,
            waveDirection: waveDirection
        });
    }
    
    // Update burst particles to better show high-speed falling
    createBurst(count = 12, speed = 1.0) {
        if (!this.player || !this.player.mesh) return;
        
        for (let i = 0; i < count; i++) {
            // Create material with random color variations
            const hue = this.isPlayerMoving ? 0.6 : 0.75; // Blue vs Purple base
            const color = new THREE.Color().setHSL(
                hue + (Math.random() - 0.5) * 0.2, 
                0.8, 
                0.5 + Math.random() * 0.3
            );
            
            const material = new THREE.SpriteMaterial({
                map: this.particleTexture,
                color: color,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending
            });
            
            // Create sprite for the burst particle
            const sprite = new THREE.Sprite(material);
            
            // Position at player with randomized offset
            sprite.position.copy(this.player.mesh.position);
            sprite.position.y += 0.5; // Position at top of player
            sprite.position.x += (Math.random() - 0.5) * 0.5 * speed;
            sprite.position.y += (Math.random() - 0.5) * 0.2 * speed; // Reduced vertical variation
            sprite.position.z += (Math.random() - 0.5) * 0.5 * speed;
            
            // Set initial scale with vertical stretching for speed lines
            const baseSize = (0.1 + Math.random() * 0.1) * speed;
            const verticalStretch = baseSize * this.speedStretchFactor * 2;
            sprite.scale.set(baseSize, verticalStretch, baseSize);
            
            // Set initial rotation to point upward
            sprite.rotation.z = Math.PI * 0.5 + (Math.random() - 0.5) * 0.3;
            
            // Burst velocity - mostly upward with some spread
            const angle = Math.PI * 0.5 + (Math.random() - 0.5) * 0.6; // Mostly upward angles
            const magnitude = (1.0 + Math.random() * 2.0) * speed;
            
            const velocity = {
                x: Math.cos(angle) * magnitude * 0.4, // Reduced horizontal component
                y: Math.sin(angle) * magnitude * 1.5, // Enhanced upward component
                z: (Math.random() - 0.5) * magnitude * 0.3
            };
            
            // Rotation speed (radians per second)
            const rotationSpeed = (Math.random() - 0.5) * 2 * speed; 
            
            // Add to scene with shorter lifetime
            this.scene.add(sprite);
            this.particles.push({
                mesh: sprite,
                lifetime: (this.particleLifespan * 0.5) * (0.7 + Math.random() * 0.5),
                velocity: velocity,
                drift: { x: (Math.random() - 0.5) * 0.5, z: (Math.random() - 0.5) * 0.5 },
                rotationSpeed: rotationSpeed,
                age: 0,
                waveDirection: Math.random() > 0.5 ? 1 : -1
            });
        }
    }
    
    // Clean up resources
    dispose() {
        for (const particle of this.particles) {
            this.scene.remove(particle.mesh);
            if (particle.mesh.material) particle.mesh.material.dispose();
        }
        if (this.particleTexture) this.particleTexture.dispose();
        this.particles = [];
    }
} 