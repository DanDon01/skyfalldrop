import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class WindEffect {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.windLines = [];
        this.windParticles = [];
        this.windMaterial = new THREE.LineBasicMaterial({ 
            color: 0xffffff,
            transparent: true,
            opacity: 0.4
        });
        
        this.particleMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.05,
            transparent: true,
            opacity: 0.6,
            sizeAttenuation: true
        });
        
        this.spawnBounds = {
            xMin: -15,
            xMax: 15,
            yMin: -10,
            yMax: 10,
            zMin: -5,
            zMax: 10
        };
        
        this.lineSpeed = 10; // Base speed for wind lines
        this.particleSpeed = 8; // Base speed for particles
        
        // Create initial wind effects
        this.createWindLines(40);
        this.createParticles(100);
    }
    
    createWindLines(count) {
        for (let i = 0; i < count; i++) {
            this.createWindLine();
        }
    }
    
    createWindLine() {
        // Create a wind streak line
        const length = Math.random() * 0.5 + 0.2; // Line length
        
        const points = [];
        points.push(new THREE.Vector3(0, 0, 0));
        points.push(new THREE.Vector3(0, length, 0));
        
        const geometry = new THREE.BufferGeometry().setFromPoints(points);
        const line = new THREE.Line(geometry, this.windMaterial.clone());
        
        // Set random position within bounds
        line.position.set(
            THREE.MathUtils.randFloat(this.spawnBounds.xMin, this.spawnBounds.xMax),
            THREE.MathUtils.randFloat(this.spawnBounds.yMin, this.spawnBounds.yMax),
            THREE.MathUtils.randFloat(this.spawnBounds.zMin, this.spawnBounds.zMax)
        );
        
        // Random rotation to create varied directions, but mostly vertical
        line.rotation.z = THREE.MathUtils.randFloatSpread(0.2);
        line.rotation.x = THREE.MathUtils.randFloatSpread(0.2);
        
        // Store speed as a property
        line.userData.speed = this.lineSpeed * (Math.random() * 0.5 + 0.75);
        
        // Add to scene and keep track of it
        this.scene.add(line);
        this.windLines.push(line);
    }
    
    createParticles(count) {
        const positions = new Float32Array(count * 3);
        const speeds = new Float32Array(count);
        
        for (let i = 0; i < count; i++) {
            const i3 = i * 3;
            
            // Random positions
            positions[i3] = THREE.MathUtils.randFloat(this.spawnBounds.xMin, this.spawnBounds.xMax);
            positions[i3 + 1] = THREE.MathUtils.randFloat(this.spawnBounds.yMin, this.spawnBounds.yMax);
            positions[i3 + 2] = THREE.MathUtils.randFloat(this.spawnBounds.zMin, this.spawnBounds.zMax);
            
            // Random speeds
            speeds[i] = this.particleSpeed * (Math.random() * 0.5 + 0.75);
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particles = new THREE.Points(geometry, this.particleMaterial);
        particles.userData.speeds = speeds;
        
        this.scene.add(particles);
        this.windParticles.push(particles);
    }
    
    update(deltaTime) {
        // Update wind lines
        for (let i = 0; i < this.windLines.length; i++) {
            const line = this.windLines[i];
            line.position.y += line.userData.speed * deltaTime;
            
            // If line goes offscreen, reset its position
            if (line.position.y > this.spawnBounds.yMax) {
                line.position.y = this.spawnBounds.yMin;
                line.position.x = THREE.MathUtils.randFloat(this.spawnBounds.xMin, this.spawnBounds.xMax);
                line.position.z = THREE.MathUtils.randFloat(this.spawnBounds.zMin, this.spawnBounds.zMax);
                
                // Vary the line width/opacity occasionally for wind gust effect
                if (Math.random() > 0.9) {
                    line.material.opacity = Math.random() * 0.3 + 0.2;
                }
            }
        }
        
        // Update particles
        for (let i = 0; i < this.windParticles.length; i++) {
            const particles = this.windParticles[i];
            const positions = particles.geometry.attributes.position.array;
            const speeds = particles.userData.speeds;
            
            for (let j = 0, j3 = 0; j < speeds.length; j++, j3 += 3) {
                positions[j3 + 1] += speeds[j] * deltaTime;
                
                // Reset particles that go off screen
                if (positions[j3 + 1] > this.spawnBounds.yMax) {
                    positions[j3] = THREE.MathUtils.randFloat(this.spawnBounds.xMin, this.spawnBounds.xMax);
                    positions[j3 + 1] = this.spawnBounds.yMin;
                    positions[j3 + 2] = THREE.MathUtils.randFloat(this.spawnBounds.zMin, this.spawnBounds.zMax);
                }
            }
            
            particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Occasional wind gust effect (creates a burst of new particles)
        if (Math.random() > 0.99) {
            this.createWindGust();
        }
    }
    
    createWindGust() {
        // Create a burst of particles in a specific area
        const gustX = THREE.MathUtils.randFloat(this.spawnBounds.xMin / 2, this.spawnBounds.xMax / 2);
        const gustZ = THREE.MathUtils.randFloat(this.spawnBounds.zMin / 2, this.spawnBounds.zMax / 2);
        
        const positions = new Float32Array(20 * 3);
        const speeds = new Float32Array(20);
        
        for (let i = 0; i < 20; i++) {
            const i3 = i * 3;
            
            // Positions clustered around the gust center
            positions[i3] = gustX + THREE.MathUtils.randFloatSpread(3);
            positions[i3 + 1] = this.spawnBounds.yMin;
            positions[i3 + 2] = gustZ + THREE.MathUtils.randFloatSpread(3);
            
            // Faster speeds for the gust
            speeds[i] = this.particleSpeed * (Math.random() + 1.5);
        }
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const gustMaterial = this.particleMaterial.clone();
        gustMaterial.size = 0.08;
        gustMaterial.opacity = 0.8;
        
        const particles = new THREE.Points(geometry, gustMaterial);
        particles.userData.speeds = speeds;
        particles.userData.lifetime = 2; // Will be removed after 2 seconds
        particles.userData.age = 0;
        
        this.scene.add(particles);
        this.windParticles.push(particles);
    }
    
    // Clean up method
    dispose() {
        // Remove all wind lines
        for (const line of this.windLines) {
            this.scene.remove(line);
            if (line.geometry) line.geometry.dispose();
            if (line.material) line.material.dispose();
        }
        
        // Remove all particles
        for (const particles of this.windParticles) {
            this.scene.remove(particles);
            if (particles.geometry) particles.geometry.dispose();
            if (particles.material) particles.material.dispose();
        }
        
        this.windLines = [];
        this.windParticles = [];
    }
} 