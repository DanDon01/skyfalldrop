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

        // Collision Flash properties (placeholder - implement later)
        // this.isFlashing = false;
        // this.flashDuration = 150;
        // this.flashTimer = 0;
        // this.flashColor = 0xffa500; // Orange in hex
        // this.originalColor = material.color.getHex();

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

        // --- Falling (Removed - Player stays vertically centered) ---
        // this.mesh.position.y += this.velocity.y * deltaTime;

        // --- Bounds Checking (Horizontal only) ---
        const horizontalLimit = 50;
        if (this.mesh.position.x < -horizontalLimit) {
            this.mesh.position.x = -horizontalLimit;
        }
        if (this.mesh.position.x > horizontalLimit) {
            this.mesh.position.x = horizontalLimit;
        }

        // Floor limit (optional - game might not have one)
        // const floorLimit = -100;
        // if (this.mesh.position.y < floorLimit) {
        //     this.mesh.position.y = floorLimit;
        //     this.velocity.y = 0;
        // }

        // --- Update Bounding Box ---
        this.boundingBox.setFromObject(this.mesh);

        // --- Collision Flash Update (Implement later) ---
        // if (this.isFlashing) { ... }

        // --- Trail Update (Implement later) ---
        // this.updateTrail(deltaTime);
    }

    handleCollision() {
        // Adapt bounce for 3D - Player doesn't move vertically,
        // so bounce might affect world speed or trigger visual effect only.
        // For now, just log it. We'll add visual flash later.
        // this.velocity.y = 10; // No longer applicable

        // Trigger visual flash (Implement later)
        // this.isFlashing = true;
        // this.flashTimer = this.flashDuration;
        // this.mesh.material.color.setHex(this.flashColor);

        console.log("Player collision handled (3D)");
    }

    // updateTrail(deltaTime) { ... Refactor for 3D trail ... }
    // renderTrail(ctx) { ... Remove or refactor for 3D trail ... }

    // No render method needed here, handled by main loop
}
