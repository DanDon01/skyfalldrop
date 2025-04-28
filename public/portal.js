import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { gsap } from 'https://unpkg.com/gsap@3.12.4/index.js';

export class Portal {
    constructor(scene, scoreThreshold = 25000) {
        this.scene = scene;
        this.scoreThreshold = scoreThreshold;
        this.active = true;
        this.entered = false;
        this.portalMesh = null;
        this.ringMesh = null;
        this.glowMesh = null;
        this.portalRadius = 0.8;
        this.portalY = -2.8;
        
        // Portal destination URL (can be updated)
        this.destinationUrl = "https://aitechnoking.com"; // Default destination
        
        // Use a fallback texture by default to avoid loading issues
        this.createFallbackTexture();
        this.createPortal();
        
        // Still try to load the texture, but don't wait for it
        const textureLoader = new THREE.TextureLoader();
        textureLoader.load(
            'textures/portal.png',
            (texture) => {
                // If the texture loads successfully, update our materials
                this.portalTexture = texture;
                if (this.portalMesh && this.portalMesh.material) {
                    this.portalMesh.material.map = texture;
                    this.portalMesh.material.needsUpdate = true;
                }
                console.log("Portal texture loaded successfully");
            },
            undefined,
            (error) => {
                console.warn("Could not load portal texture, using fallback.", error);
            }
        );
    }
    
    createPortal() {
        // Create main portal disc - simplified material with purple color
        const portalGeometry = new THREE.CircleGeometry(this.portalRadius, 32);
        const portalMaterial = new THREE.MeshBasicMaterial({
            color: 0x9370DB, // Medium purple center
            transparent: true,
            opacity: 0.4, // More transparent (was 0.7)
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.portalMesh = new THREE.Mesh(portalGeometry, portalMaterial);
        this.portalMesh.position.set(0, this.portalY, 0);
        this.portalMesh.rotation.x = Math.PI / 2; // Lay flat
        this.portalMesh.visible = true;
        this.scene.add(this.portalMesh);
        
        // Inner ring - using a more vibrant purple
        const ringGeometry = new THREE.RingGeometry(this.portalRadius, this.portalRadius + 0.12, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xBA55D3, // Medium orchid
            transparent: true,
            opacity: 0.6, // More transparent (was 0.9)
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        this.ringMesh.position.set(0, this.portalY + 0.01, 0);
        this.ringMesh.rotation.x = Math.PI / 2; // Lay flat
        this.ringMesh.visible = true;
        this.scene.add(this.ringMesh);
        
        // Outer glow - subtle pale violet
        const outerRingGeometry = new THREE.RingGeometry(this.portalRadius + 0.12, this.portalRadius + 0.3, 32);
        const outerRingMaterial = new THREE.MeshBasicMaterial({
            color: 0x8A2BE2, // Violet
            transparent: true,
            opacity: 0.2, // Very transparent (was 0.3)
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.outerRingMesh = new THREE.Mesh(outerRingGeometry, outerRingMaterial);
        this.outerRingMesh.position.set(0, this.portalY + 0.02, 0);
        this.outerRingMesh.rotation.x = Math.PI / 2; // Lay flat
        this.scene.add(this.outerRingMesh);
        
        // Add one more outer glow for a magical effect
        const magicRingGeometry = new THREE.RingGeometry(this.portalRadius + 0.3, this.portalRadius + 0.4, 32);
        const magicRingMaterial = new THREE.MeshBasicMaterial({
            color: 0xE6E6FA, // Lavender
            transparent: true,
            opacity: 0.15, // Very faint
            side: THREE.DoubleSide,
            depthWrite: false
        });
        
        this.magicRingMesh = new THREE.Mesh(magicRingGeometry, magicRingMaterial);
        this.magicRingMesh.position.set(0, this.portalY + 0.03, 0);
        this.magicRingMesh.rotation.x = Math.PI / 2; // Lay flat
        this.scene.add(this.magicRingMesh);
        
        // Update portal text color
        const portalText = document.createElement('div');
        portalText.textContent = "Exit game portal [P]";
        portalText.style.position = 'absolute';
        portalText.style.bottom = '20px';
        portalText.style.left = '50%';
        portalText.style.transform = 'translateX(-50%)';
        portalText.style.color = '#9370DB'; // Purple text to match
        portalText.style.fontFamily = 'Arial, sans-serif';
        portalText.style.fontSize = '18px';
        portalText.style.fontWeight = 'bold';
        portalText.style.textShadow = '0 0 5px #BA55D3'; // Purple glow
        portalText.style.pointerEvents = 'none';
        document.body.appendChild(portalText);
        this.portalText = portalText;
        
        // Dispatch event that portal is active
        const portalEvent = new CustomEvent('portal-activated', {
            detail: { portal: this }
        });
        document.dispatchEvent(portalEvent);
    }
    
    update(playerPosition, currentScore, keyboardState) {
        if (!this.active || this.entered) return;
        
        // Animate portal
        this.animatePortal();
        
        // Add debug log for debugging
        if (keyboardState && keyboardState.KeyP) {
            console.log("P key pressed, entering portal...");
        }
        
        // Check if player has collided with portal
        if (playerPosition.distanceTo(this.portalMesh.position) < 1.5) {
            console.log("Player collided with portal");
            this.playerEnteredPortal();
        }
        
        // Check for P key press to enter portal
        if (keyboardState && keyboardState.KeyP) {
            this.playerEnteredPortal();
        }
    }
    
    animatePortal() {
        if (!this.active) return;
        
        // Rotate the portal
        if (this.portalMesh) {
            this.portalMesh.rotation.z += 0.01;
        }
        
        // Pulse the ring
        if (this.ringMesh && this.ringMesh.material) {
            this.ringMesh.material.opacity = 0.3 + Math.sin(Date.now() * 0.003) * 0.3;
            this.ringMesh.scale.set(
                1 + Math.sin(Date.now() * 0.002) * 0.05,
                1 + Math.sin(Date.now() * 0.002) * 0.05,
                1
            );
        }
        
        // Add subtle color pulse to outer ring
        if (this.outerRingMesh && this.outerRingMesh.material) {
            // Alternate between purple and violet
            const hue = 0.75 + Math.sin(Date.now() * 0.001) * 0.05; // Oscillates around purple
            this.outerRingMesh.material.color.setHSL(hue, 0.8, 0.5);
        }
        
        // Add reversed rotation to magic ring
        if (this.magicRingMesh) {
            this.magicRingMesh.rotation.z -= 0.005;
        }
    }
    
    startPortalEffects() {
        // Add particle effects, sounds, etc.
        // This would be expanded with actual particle systems
    }
    
    playerEnteredPortal() {
        if (this.entered) return;
        this.entered = true;
        
        console.log("Player entered portal!");
        
        // Create fade out effect
        const fadeOverlay = document.createElement('div');
        fadeOverlay.style.position = 'fixed';
        fadeOverlay.style.top = 0;
        fadeOverlay.style.left = 0;
        fadeOverlay.style.width = '100%';
        fadeOverlay.style.height = '100%';
        fadeOverlay.style.backgroundColor = '#ffffff';
        fadeOverlay.style.opacity = 0;
        fadeOverlay.style.transition = 'opacity 2s ease-in';
        fadeOverlay.style.zIndex = 1000;
        document.body.appendChild(fadeOverlay);
        
        // Trigger the transition
        setTimeout(() => {
            fadeOverlay.style.opacity = 1;
            
            // Navigate to destination after fade completes
            setTimeout(() => {
                window.location.href = this.destinationUrl;
            }, 2000);
        }, 100);
        
        // Dispatch event that player entered portal
        const portalEvent = new CustomEvent('portal-entered', {
            detail: { portal: this }
        });
        document.dispatchEvent(portalEvent);
    }
    
    setDestination(url) {
        this.destinationUrl = url;
    }
    
    setScoreThreshold(score) {
        this.scoreThreshold = score;
    }
    
    createPortalRingGlow() {
        // Check if texture loading failed and use a fallback
        if (!this.portalTexture) {
            console.log("Portal texture not found, using fallback");
            // Create a canvas texture as fallback
            const canvas = document.createElement('canvas');
            canvas.width = 512;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            // Draw a radial gradient as a fallback texture
            const gradient = ctx.createRadialGradient(
                canvas.width/2, canvas.height/2, 0,
                canvas.width/2, canvas.height/2, canvas.width/2
            );
            gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
            gradient.addColorStop(0.3, 'rgba(160, 100, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(100, 0, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            
            // Create texture from canvas
            this.portalTexture = new THREE.CanvasTexture(canvas);
        }
        
        // Rest of the method remains the same
    }
    
    createFallbackTexture() {
        // Create a canvas for the fallback texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Create a portal-like gradient
        const gradient = ctx.createRadialGradient(
            canvas.width / 2, canvas.height / 2, 0,
            canvas.width / 2, canvas.height / 2, canvas.width / 2
        );
        
        // Purple-ish portal colors
        gradient.addColorStop(0, 'rgba(180, 100, 255, 1)');
        gradient.addColorStop(0.5, 'rgba(120, 60, 200, 0.8)');
        gradient.addColorStop(0.8, 'rgba(80, 20, 180, 0.4)');
        gradient.addColorStop(1, 'rgba(40, 0, 100, 0)');
        
        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add some swirly lines for portal effect
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.lineWidth = 3;
        
        // Create spiral
        ctx.beginPath();
        for (let i = 0; i < 720; i += 10) {
            const angle = i * Math.PI / 180;
            const radius = i / 10;
            const x = canvas.width / 2 + Math.cos(angle) * radius;
            const y = canvas.height / 2 + Math.sin(angle) * radius;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        
        // Create THREE.js texture from canvas
        this.portalTexture = new THREE.CanvasTexture(canvas);
    }
} 