import * as THREE from 'three';

export class WindParticles {
    constructor(scene, assets) {
        this.scene = scene;
        this.assets = assets;
        this.particleSystem = null;
        this.particleCount = 150; // Adjust count as needed
        this.particleSpeed = 40; // Adjust speed
        this.spawnArea = { x: 150, z: 100 }; // Area within which particles spawn/wrap
        this.verticalRange = 200; // Total vertical distance particles travel before wrapping

        this.init();
    }

    init() {
        // Ensure assets object exists before trying to get texture
        if (!this.assets) {
             console.error("Assets manager not passed to WindParticles constructor!");
             return;
        }
        const particleTexture = this.assets.getTexture('wind_particle');
        if (!particleTexture) {
            console.warn("Wind particle texture ('wind_particle.png') not loaded or found, skipping wind initialization.");
            return; // Exit initialization if texture is missing
        }

        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(this.particleCount * 3);

        for (let i = 0; i < this.particleCount; i++) {
            const i3 = i * 3;
            // Initial random position within the vertical range, below the player
            positions[i3] = (Math.random() - 0.5) * this.spawnArea.x;
            positions[i3 + 1] = Math.random() * this.verticalRange - (this.verticalRange / 2); // Centered around y=0 initially
            positions[i3 + 2] = (Math.random() - 0.5) * this.spawnArea.z;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        // Use PointsMaterial with the texture
        const particleMaterial = new THREE.PointsMaterial({
            map: particleTexture,
            size: 1.5, // Adjust size
            sizeAttenuation: true,
            transparent: true,
            alphaTest: 0.1,
            // blending: THREE.AdditiveBlending, // Optional blending
            color: 0xffffff // Can tint if needed
        });

        this.particleSystem = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particleSystem);
        console.log("Wind particle system initialized.");
    }

    update(deltaTime) {
        if (!this.particleSystem) return;

        const positions = this.particleSystem.geometry.attributes.position.array;
        const wrapThreshold = this.verticalRange / 2; // Y position to wrap around

        for (let i = 1; i < positions.length; i += 3) { // Update Y position
            positions[i] += this.particleSpeed * deltaTime; // Move upwards

            // Wrap particles back to the bottom if they go too high
            if (positions[i] > wrapThreshold) {
                positions[i] -= this.verticalRange; // Wrap down
                // Optionally randomize X/Z again on wrap
                // positions[i-1] = (Math.random() - 0.5) * this.spawnArea.x;
                // positions[i+1] = (Math.random() - 0.5) * this.spawnArea.z;
            }
        }
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
    }
}
