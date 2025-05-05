import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

// Re-use texture loader if possible (or create one locally)
const textureLoader = new THREE.TextureLoader();

// Helper function to generate a random color within a range (e.g., blues/greys)
function getRandomSkyColor() {
    // Define ranges for R, G, B (0-1 scale)
    const rMin = 0.2, rMax = 0.6; // Less red
    const gMin = 0.3, gMax = 0.7; // Moderate green
    const bMin = 0.5, bMax = 0.9; // More blue/grey

    const r = THREE.MathUtils.randFloat(rMin, rMax);
    const g = THREE.MathUtils.randFloat(gMin, gMax);
    const b = THREE.MathUtils.randFloat(bMin, bMax);

    return new THREE.Color(r, g, b);
}

export class Background {
    constructor(scene, camera, scrollSpeedFactor = 2.0) { // Pass camera to calculate size and increase scroll speed factor
        console.log("Creating Background...");
        this.scene = scene;
        this.camera = camera;
        this.mesh = null;
        this.scrollSpeedFactor = scrollSpeedFactor; // Doubled scrolling speed

        // Make background partially transparent or smaller to allow skybox to be seen
        this.backgroundOpacity = 0.0; // Make it fully transparent
        this.backgroundSize = 0.8; // Make it smaller (80% of original size)
        
        // --- Calculate size needed to fill viewport ---
        // We need the camera's FOV and distance to the plane
        const planeZ = -5; // Keep the plane behind the player
        const distance = camera.position.z - planeZ;
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        this.visibleHeight = 2 * Math.tan(vFOV / 2) * distance; // Store for later use
        this.visibleWidth = this.visibleHeight * camera.aspect;
        // Add some padding to ensure it covers edges during movement/resize
        this.backgroundWidth = this.visibleWidth * 1.2;
        this.backgroundHeight = this.visibleHeight * 1.2;
        console.log(`Background Size: ${this.backgroundWidth.toFixed(2)} x ${this.backgroundHeight.toFixed(2)}`);
        // --- End Calculate size ---

        // --- Load Texture ---
        const backgroundTexture = textureLoader.load(
            'textures/background_clouds.png', // <<< PATH TO YOUR TEXTURE
            (texture) => { // onLoad
                // Set texture wrapping to repeat
                texture.wrapS = THREE.RepeatWrapping;
                texture.wrapT = THREE.RepeatWrapping;
                this.updateTextureRepeat(); // Call helper to set initial repeat
                console.log("Background texture loaded and configured.");
                // Ensure material is updated if texture loads after mesh creation
                if (this.mesh) {
                    this.mesh.material.map = texture;
                    this.mesh.material.needsUpdate = true;
                }
            },
            undefined, // onProgress
            (error) => { // onError
                console.error("Error loading background texture:", error);
                // Optional: Fallback to a solid color if texture fails
                if (this.mesh) {
                    // Fallback: remove map, rely on base color
                    this.mesh.material.map = null;
                    this.mesh.material.color.set(0x446688); // Fallback color
                    this.mesh.material.needsUpdate = true;
                }
            }
        );
        // --- End Load Texture ---

        // --- Dynamic Color Properties (Re-added) ---
        this.currentColor = new THREE.Color(0xffffff); // Start with white tint (shows original texture colors)
        this.targetColor = getRandomSkyColor();      // First random target tint
        this.lerpAlpha = 0;                          // Interpolation factor (0 to 1)
        this.transitionSpeed = 0.03;                 // How fast to lerp towards target tint
        // --- End Dynamic Color Properties ---

        // Create geometry and material
        const geometry = new THREE.PlaneGeometry(this.backgroundWidth, this.backgroundHeight);
        const material = new THREE.MeshBasicMaterial({
            // Start with white base color, texture map will be applied
            color: this.currentColor.clone(), // Material color will act as a tint
            map: backgroundTexture,
            side: THREE.FrontSide,
            transparent: true,
            opacity: this.backgroundOpacity // Use opacity setting
        });
        this.mesh = new THREE.Mesh(geometry, material);

        // Position the background plane AT the camera's look-at point but further back
        // It should stay centered relative to the camera's view
        this.mesh.position.z = planeZ;
        this.mesh.position.y = camera.position.y; // Align vertically with camera initially
        this.mesh.position.x = camera.position.x; // Align horizontally with camera initially

        this.addToScene();
    }

    addToScene() {
        if (this.scene && this.mesh) {
            this.scene.add(this.mesh);
            console.log("Background mesh added to scene.");
        } else {
            console.error("Scene not provided or background mesh not created!");
        }
    }

    // Helper to calculate and set texture repeat
    updateTextureRepeat() {
        if (this.mesh && this.mesh.material.map) {
            // Use current geometry size which accounts for scaling
            const currentGeoWidth = this.mesh.geometry.parameters.width * this.mesh.scale.x;
            const currentGeoHeight = this.mesh.geometry.parameters.height * this.mesh.scale.y;
            const repeatX = currentGeoWidth / 10; // Repeat every 10 world units horizontally
            const repeatY = currentGeoHeight / 10; // Repeat every 10 world units vertically
            this.mesh.material.map.repeat.set(repeatX, repeatY);
        }
    }

    // Update method
    update(deltaTime, scrollSpeed = 0) {
        if (!this.mesh) return; // Only need mesh check now

        // --- Texture Offset Scrolling ---
        // Check if map exists before trying to access its properties
        if (scrollSpeed > 0 && this.mesh.material.map) {
            // Define scroll speed in terms of texture offset
            const textureScrollSpeed = scrollSpeed * 0.02 * this.scrollSpeedFactor; // Apply the factor here

            // Decrease offset.y to make texture scroll upwards
            this.mesh.material.map.offset.y -= textureScrollSpeed * deltaTime;

            // Keep offset within 0-1 range (optional, RepeatWrapping handles it)
            // Ensure positive modulo if needed, though RepeatWrapping usually handles negative offsets too
            // this.mesh.material.map.offset.y = (this.mesh.material.map.offset.y % 1 + 1) % 1;
        }
        // --- End Texture Offset Scrolling ---

        // --- Handle Dynamic Color Tint Transition ---
        if (scrollSpeed > 0) {
            this.lerpAlpha += this.transitionSpeed * deltaTime;
            this.lerpAlpha = Math.min(this.lerpAlpha, 1);

            // Interpolate the material's TINT color towards the target tint
            this.mesh.material.color.lerpColors(this.currentColor, this.targetColor, this.lerpAlpha);

            if (this.lerpAlpha >= 1) {
                this.currentColor.copy(this.targetColor);
                this.targetColor = getRandomSkyColor();
                this.lerpAlpha = 0;
            }
        }
        // --- End Handle Dynamic Color Tint Transition ---
    }

    // Optional: Handle window resize to keep background covering screen
    onWindowResize(camera) {
        if (!this.mesh) return;

        const planeZ = this.mesh.position.z;
        const distance = camera.position.z - planeZ;
        const vFOV = THREE.MathUtils.degToRad(camera.fov);
        this.visibleHeight = 2 * Math.tan(vFOV / 2) * distance; // Update visible height
        this.visibleWidth = this.visibleHeight * camera.aspect;
        const targetWidth = this.visibleWidth * 1.2;
        const targetHeight = this.visibleHeight * 1.2;

        // Update scale
        const originalWidth = this.mesh.geometry.parameters.width;
        const originalHeight = this.mesh.geometry.parameters.height;
        this.mesh.scale.set(targetWidth / originalWidth, targetHeight / originalHeight, 1);

        // Update Texture Repeat on Resize
        this.updateTextureRepeat(); // Use helper function

        // Recenter based on camera (optional, usually scale is enough)
        this.mesh.position.y = camera.position.y;
        this.mesh.position.x = camera.position.x;

        console.log(`Background Resized & Texture Repeat Updated`);
    }

    setBackgroundTint(color) {
        console.log("Applying background tint:", color);
        
        // Create a new color material with the theme color
        if (this.mesh && this.mesh.material) {
            // Apply tint by blending with current texture
            this.mesh.material.color = color;
            this.mesh.material.needsUpdate = true;
            
            console.log("Background tint applied");
        } else {
            console.warn("Cannot apply tint - background mesh or material not available");
        }
    }

    // Update the setTexture method to properly handle texture wrapping and repeat
    setTexture(texture) {
        console.log("Setting new background texture");
        
        if (this.mesh && this.mesh.material) {
            // Store old settings
            const oldColor = this.mesh.material.color.clone();
            const oldTransparent = this.mesh.material.transparent;
            const oldOpacity = this.mesh.material.opacity;
            
            // Configure new texture with proper repeat settings (crucial for tiling)
            texture.wrapS = THREE.RepeatWrapping;
            texture.wrapT = THREE.RepeatWrapping;
            
            // Get current repeat settings from existing texture if available
            if (this.mesh.material.map) {
                texture.repeat.copy(this.mesh.material.map.repeat);
            } else {
                // Default repeat settings based on the camera's aspect ratio
                this.updateTextureRepeat(texture);
            }
            
            // Apply new texture
            this.mesh.material.map = texture;
            
            // Re-apply original settings
            this.mesh.material.color = oldColor;
            this.mesh.material.transparent = oldTransparent;
            this.mesh.material.opacity = oldOpacity;
            
            // Make sure everything updates
            this.mesh.material.needsUpdate = true;
            texture.needsUpdate = true;
            
            console.log("Background texture updated successfully with tiling");
        } else {
            console.warn("Cannot set texture - background mesh or material not available");
        }
    }

    // Helper method to update texture repeat based on camera
    updateTextureRepeat(texture) {
        if (!texture) return;
        
        const aspectRatio = window.innerWidth / window.innerHeight;
        const textureHeight = 2;
        const textureWidth = textureHeight * aspectRatio;
        
        // Apply calculated repeat values
        texture.repeat.set(textureWidth, textureHeight);
        console.log(`Set texture repeat to ${textureWidth.toFixed(2)} x ${textureHeight}`);
    }
} 