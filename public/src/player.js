import * as THREE from 'three';

export class Player {
    constructor(scene, assets) { // Added assets parameter back
        this.scene = scene;
        this.assets = assets; // Store assets
        this.moveSpeed = 30;
        // this.fallSpeed = 5; // Player no longer controls its own falling speed
        // this.velocity = new THREE.Vector3(0, -this.fallSpeed, 0); // Velocity managed differently

        // Get player texture
        const playerTexture = this.assets.getTexture('player');

        // Define dimensions based on texture or fallback
        // Adjust these base values as needed for desired player size
        const baseWidth = 5;
        const baseHeight = 5;
        this.width = playerTexture ? baseWidth : 4; // Use baseWidth if texture exists
        this.height = playerTexture ? (baseWidth * (playerTexture.image.height / playerTexture.image.width)) : 4; // Maintain aspect ratio or use fallback

        // Create 3D representation (Plane with texture)
        const geometry = new THREE.PlaneGeometry(this.width, this.height);
        const material = new THREE.MeshBasicMaterial({
            color: 0xffffff, // Tint color (white = no tint)
            map: playerTexture || null,
            transparent: true, // Enable transparency for PNG
            alphaTest: 0.1, // Adjust transparency threshold if needed
            side: THREE.DoubleSide // Render both sides
        });
        this.mesh = new THREE.Mesh(geometry, material);

        // Initial position (Vertically centered, adjust Y offset as needed)
        this.mesh.position.set(0, 0, 0); // Start at origin, camera will be positioned relative

        // Add player mesh to the scene
        this.scene.add(this.mesh);

        // Bounding box for collisions (will be updated)
        // Note: Using Box3 on a Plane might not be ideal for precise collision.
        // Consider using Sphere collision or more complex geometry later.
        this.boundingBox = new THREE.Box3().setFromObject(this.mesh);
        // Manually adjust Box3 size if needed for better fit
        // this.boundingBox.expandByScalar(-1); // Example: slightly shrink box

        // Collision Flash properties
        this.isFlashing = false;
        this.flashDuration = 150; // ms
        this.flashTimer = 0;
        this.flashColor = 0xffa500; // Orange
        this.originalColor = material.color.getHex();

        // Trail properties
        this.trail = [];
        this.trailInterval = 0.04; // seconds between trail spawns
        this.trailTimer = 0;
        this.trailMax = 18; // Max trail ghosts
        this.trailFadeTime = 0.5; // seconds before ghost fades out
        this.trailAlpha = 0.35; // Starting alpha for trail ghosts

        console.log("3D Player initialized");
    }

    update(deltaTime, controls, touchControls) {
        // --- Movement ---
        let moveDirectionX = 0;
        if (controls.left || touchControls.left) {
            moveDirectionX = -1;
        } else if (controls.right || touchControls.right) {
            moveDirectionX = 1;
        }

        // Update horizontal position
        this.mesh.position.x += moveDirectionX * this.moveSpeed * deltaTime;

        // --- Bounds Checking (Horizontal only) ---
        const horizontalLimit = 50;
        if (this.mesh.position.x < -horizontalLimit) {
            this.mesh.position.x = -horizontalLimit;
        }
        if (this.mesh.position.x > horizontalLimit) {
            this.mesh.position.x = horizontalLimit;
        }

        // --- Update Bounding Box ---
        this.boundingBox.setFromObject(this.mesh);

        // --- Collision Flash Update ---
        if (this.isFlashing) {
            this.flashTimer -= deltaTime * 1000; // deltaTime is in seconds
            if (this.flashTimer > 0) {
                this.mesh.material.color.setHex(this.flashColor);
            } else {
                this.mesh.material.color.setHex(this.originalColor);
                this.isFlashing = false;
            }
        }

        // --- Trail Update ---
        this.updateTrail(deltaTime);
    }

    updateTrail(deltaTime) {
        this.trailTimer += deltaTime;
        if (this.trailTimer >= this.trailInterval) {
            this.trailTimer = 0;
            // Create a faded ghost of the player mesh
            const ghost = this.mesh.clone();
            ghost.material = this.mesh.material.clone();
            ghost.material.transparent = true;
            ghost.material.opacity = this.trailAlpha;
            ghost.position.copy(this.mesh.position);
            ghost.position.z -= 0.5; // Slightly behind
            this.scene.add(ghost);
            this.trail.push({ mesh: ghost, time: 0 });
            // Limit trail length
            if (this.trail.length > this.trailMax) {
                const old = this.trail.shift();
                this.scene.remove(old.mesh);
            }
        }
        // Fade and remove old ghosts
        for (let i = this.trail.length - 1; i >= 0; i--) {
            const t = this.trail[i];
            t.time += deltaTime;
            if (t.time > this.trailFadeTime) {
                this.scene.remove(t.mesh);
                this.trail.splice(i, 1);
            } else {
                t.mesh.material.opacity = this.trailAlpha * (1 - t.time / this.trailFadeTime);
            }
        }
    }

    handleCollision() {
        // Trigger visual flash
        this.isFlashing = true;
        this.flashTimer = this.flashDuration;
        this.mesh.material.color.setHex(this.flashColor);
        console.log("Player collision handled (3D)");
    }

    // No render method needed here, handled by main loop
}
