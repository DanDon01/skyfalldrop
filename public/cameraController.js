import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class CameraController {
    constructor(camera, target) {
        this.camera = camera;
        this.target = target; // The player object
        
        // Camera parameters - adjusted for better balance
        this.basePosition = new THREE.Vector3(0, 0.8, 5.5); // Lower Y, slightly farther back
        this.orbitAmount = 2; // Keep the same horizontal movement
        this.orbitSpeed = 0.2; // Same rotation speed
        this.orbitAngle = 0;    
        
        // Define a more moderate lookAt point to maintain centered gameplay elements
        this.lookAtPoint = new THREE.Vector3(0, 1.2, 0); // More moderate upward tilt
        
        // Store the original camera position
        this.originalPosition = camera.position.clone();
        
        // Start from base position
        this.camera.position.copy(this.basePosition);
        this.camera.lookAt(this.lookAtPoint);
    }
    
    updateCamera(deltaTime) {
        // Update orbit angle
        this.orbitAngle += this.orbitSpeed * deltaTime;
        
        // Calculate subtle side-to-side movement
        const xOffset = Math.sin(this.orbitAngle) * this.orbitAmount;
        
        // Apply to camera position while maintaining Z distance
        this.camera.position.x = this.basePosition.x + xOffset;
        this.camera.position.y = this.basePosition.y;
        this.camera.position.z = this.basePosition.z;
        
        // Always look at the point that keeps game elements centered
        this.camera.lookAt(this.lookAtPoint);
    }
    
    // Reset to original position if needed
    resetCamera() {
        this.camera.position.copy(this.originalPosition);
        this.camera.lookAt(0, 0, 0);
    }
} 