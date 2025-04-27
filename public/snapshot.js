import { gsap } from 'https://unpkg.com/gsap@3.12.4/index.js';

export class VibeShot {
    constructor(scene, player, camera, renderer) {
        this.scene = scene;
        this.player = player;
        this.camera = camera;
        this.renderer = renderer;
        this.active = false;
        
        // Original game state values to restore
        this.originalTimeScale = 1;
        this.originalPlayerPosition = null;
        this.originalCameraPosition = null;
        
        // Create snapshot button
        this.createSnapshotButton();
    }
    
    createSnapshotButton() {
        const button = document.createElement('button');
        button.textContent = '📷 VibeShot';
        button.style.position = 'absolute';
        button.style.bottom = '20px';
        button.style.right = '20px';
        button.style.padding = '10px 15px';
        button.style.backgroundColor = '#2c3e50';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '5px';
        button.style.fontSize = '16px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '100';
        
        // Add glow effect
        button.style.boxShadow = '0 0 10px #3498db';
        
        // Add hover effect
        button.addEventListener('mouseenter', () => {
            button.style.backgroundColor = '#34495e';
        });
        button.addEventListener('mouseleave', () => {
            button.style.backgroundColor = '#2c3e50';
        });
        
        // Trigger snapshot on click
        button.addEventListener('click', () => {
            this.takeSnapshot();
        });
        
        document.body.appendChild(button);
    }
    
    takeSnapshot() {
        if (this.active) return;
        this.active = true;
        
        // Store original state
        this.originalTimeScale = gsap.globalTimeline.timeScale();
        this.originalPlayerPosition = this.player.mesh.position.clone();
        this.originalCameraPosition = this.camera.position.clone();
        
        // Slow down time
        gsap.globalTimeline.timeScale(0.2);
        
        // Position player for best shot
        this.player.showPose();
        
        // Move camera for dramatic angle
        gsap.to(this.camera.position, {
            x: this.camera.position.x * 1.2,
            y: this.camera.position.y * 0.9,
            z: this.camera.position.z * 1.1,
            duration: 0.5,
            ease: "power2.out"
        });
        
        // Create the overlay
        this.createOverlay();
        
        // Restore normal gameplay after 5 seconds
        setTimeout(() => this.exitSnapshotMode(), 5000);
    }
    
    createOverlay() {
        // Create a div for the vibe shot overlay
        const overlay = document.createElement('div');
        overlay.id = 'vibe-shot-overlay';
        overlay.style.position = 'fixed';
        overlay.style.top = '0';
        overlay.style.left = '0';
        overlay.style.width = '100%';
        overlay.style.height = '100%';
        overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.3)';
        overlay.style.zIndex = '99';
        overlay.style.display = 'flex';
        overlay.style.flexDirection = 'column';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.color = 'white';
        overlay.style.textShadow = '0 0 10px rgba(0, 0, 0, 0.5)';
        
        // Add score display
        const scoreDiv = document.createElement('div');
        scoreDiv.textContent = `SCORE: ${Math.floor(window.gameState.score)}`;
        scoreDiv.style.fontSize = '48px';
        scoreDiv.style.fontFamily = '"Orbitron", sans-serif';
        scoreDiv.style.marginBottom = '20px';
        
        // Add watermark
        const watermark = document.createElement('div');
        watermark.textContent = '@AI_TechnoKing — Skyfall Drop';
        watermark.style.fontSize = '24px';
        watermark.style.fontFamily = '"Orbitron", sans-serif';
        watermark.style.position = 'absolute';
        watermark.style.bottom = '20px';
        
        // Add a "take screenshot" message
        const instructions = document.createElement('div');
        instructions.textContent = 'Take a screenshot to share your score!';
        instructions.style.fontSize = '20px';
        instructions.style.marginTop = '20px';
        
        overlay.appendChild(scoreDiv);
        overlay.appendChild(instructions);
        overlay.appendChild(watermark);
        document.body.appendChild(overlay);
    }
    
    exitSnapshotMode() {
        if (!this.active) return;
        
        // Remove overlay
        const overlay = document.getElementById('vibe-shot-overlay');
        if (overlay) {
            document.body.removeChild(overlay);
        }
        
        // Restore time scale
        gsap.globalTimeline.timeScale(this.originalTimeScale);
        
        // Restore camera position
        gsap.to(this.camera.position, {
            x: this.originalCameraPosition.x,
            y: this.originalCameraPosition.y,
            z: this.originalCameraPosition.z,
            duration: 0.5,
            ease: "power2.inOut"
        });
        
        // Return player to normal position/animation
        this.player.endPose();
        
        this.active = false;
    }
} 