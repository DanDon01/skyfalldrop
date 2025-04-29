import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class SeasonalThemes {
    constructor(scene, background, skyBackground, leafParticles) {
        this.scene = scene;
        this.background = background;
        this.skyBackground = skyBackground;
        this.leafParticles = leafParticles;
        this.currentTheme = 'day'; // Default theme is day
        
        // Add texture loader
        this.textureLoader = new THREE.TextureLoader();
        
        // Simplified themes with different textures and leaf counts
        this.themes = {
            'day': {
                name: 'Day Mode',
                colors: {
                    sky: [
                        { top: 0x8ED6FF, bottom: 0xB4F8C8 }, // Morning
                        { top: 0x5086FF, bottom: 0x98FB98 }, // Day
                        { top: 0xFF7E50, bottom: 0xBBFF99 }, // Evening
                        { top: 0x0C2341, bottom: 0x095438 }  // Night
                    ],
                    background: 0xFFFFFF // No tint
                },
                backgroundTexture: 'textures/clouds_day.png',
                leafCount: 8  // Moderate leaf count for day
            },
            'night': {
                name: 'Night Mode',
                colors: {
                    sky: [
                        { top: 0x0A1525, bottom: 0x05101A }, // Very dark morning
                        { top: 0x0F1A2A, bottom: 0x081322 }, // Very dark day
                        { top: 0x080F1A, bottom: 0x040A14 }, // Very dark evening
                        { top: 0x020408, bottom: 0x010204 }  // Very dark night
                    ],
                    background: 0x060A14 // Very dark blue-black tint
                },
                backgroundTexture: 'textures/clouds_night.png',
                leafCount: 15  // More leaves in night (like autumn)
            }
        };
        
        // Create switch button
        this.createThemeButton();
    }
    
    createThemeButton() {
        const button = document.createElement('button');
        button.id = 'theme-toggle-btn';
        button.textContent = '☀️ Day Mode';  // Start with day mode text
        button.style.position = 'fixed';
        button.style.bottom = '20px';
        button.style.left = '20px';
        button.style.padding = '10px 15px';
        button.style.backgroundColor = '#3498db';
        button.style.color = 'white';
        button.style.border = 'none';
        button.style.borderRadius = '4px';
        button.style.cursor = 'pointer';
        button.style.zIndex = '1000';
        button.style.fontFamily = 'Arial, sans-serif';
        button.style.fontSize = '16px';
        button.style.boxShadow = '0 3px 8px rgba(0,0,0,0.5)';
        
        button.addEventListener('mousedown', () => {
            button.style.transform = 'scale(0.95)';
            button.style.boxShadow = '0 1px 4px rgba(0,0,0,0.5)';
        });
        
        button.addEventListener('mouseup', () => {
            button.style.transform = 'scale(1)';
            button.style.boxShadow = '0 3px 8px rgba(0,0,0,0.5)';
        });
        
        button.addEventListener('click', () => {
            console.log("Theme button clicked");
            this.toggleTheme();
        });
        
        document.body.appendChild(button);
        console.log("Theme button created and added to document");
    }
    
    toggleTheme() {
        // Simple toggle between day and night
        const newTheme = this.currentTheme === 'day' ? 'night' : 'day';
        
        // Apply the theme
        this.applyTheme(newTheme);
        
        // Update button text based on new theme
        const button = document.getElementById('theme-toggle-btn');
        if (button) {
            if (newTheme === 'day') {
                button.textContent = '☀️ Day Mode';
            } else {
                button.textContent = '🌙 Night Mode';
            }
        }
    }
    
    applyTheme(themeName) {
        if (!this.themes[themeName]) {
            console.error(`Theme ${themeName} not found`);
            return;
        }
        
        console.log(`Applying theme: ${themeName}`);
        this.currentTheme = themeName;
        const theme = this.themes[themeName];
        
        // Apply sky colors
        if (this.skyBackground) {
            console.log("Updating sky colors", theme.colors.sky);
            
            if (typeof this.skyBackground.setSkyColors === 'function') {
                this.skyBackground.setSkyColors(theme.colors.sky);
            } else {
                console.error("setSkyColors method not found on skyBackground");
                
                // Fallback approach - try to directly modify the material
                if (this.skyBackground.material && this.skyBackground.material.uniforms) {
                    const timeOfDay = (this.skyBackground.elapsedTime || 12) % 24;
                    let colorSet;
                    
                    // Determine time of day
                    if (timeOfDay >= 5 && timeOfDay < 8) {
                        colorSet = theme.colors.sky[0]; // Morning colors
                    } else if (timeOfDay >= 8 && timeOfDay < 18) {
                        colorSet = theme.colors.sky[1]; // Day colors
                    } else if (timeOfDay >= 18 && timeOfDay < 21) {
                        colorSet = theme.colors.sky[2]; // Evening colors
                    } else {
                        colorSet = theme.colors.sky[3]; // Night colors
                    }
                    
                    // Apply colors directly
                    this.skyBackground.material.uniforms.topColor.value.set(colorSet.top);
                    this.skyBackground.material.uniforms.bottomColor.value.set(colorSet.bottom);
                    this.skyBackground.material.needsUpdate = true;
                    console.log("Applied sky colors directly to material");
                }
            }
        } else {
            console.warn("SkyBackground not available for theme change");
        }
        
        // Change background texture
        if (this.background && theme.backgroundTexture) {
            console.log("Loading background texture:", theme.backgroundTexture);
            
            // Load the new texture
            this.textureLoader.load(
                theme.backgroundTexture,
                (texture) => {
                    console.log("Background texture loaded successfully");
                    
                    // Apply the texture to background
                    if (typeof this.background.setTexture === 'function') {
                        this.background.setTexture(texture);
                    } else if (this.background.mesh && this.background.mesh.material) {
                        // Fallback - apply texture directly to material
                        this.background.mesh.material.map = texture;
                        this.background.mesh.material.needsUpdate = true;
                        console.log("Applied texture directly to background material");
                    }
                    
                    // Also apply the tint
                    if (theme.colors.background) {
                        if (typeof this.background.setBackgroundTint === 'function') {
                            this.background.setBackgroundTint(new THREE.Color(theme.colors.background));
                        } else if (this.background.mesh && this.background.mesh.material) {
                            this.background.mesh.material.color = new THREE.Color(theme.colors.background);
                            this.background.mesh.material.needsUpdate = true;
                        }
                    }
                },
                undefined,
                (error) => {
                    console.error("Error loading background texture:", error);
                    
                    // Still apply the tint if texture fails
                    if (theme.colors.background) {
                        if (typeof this.background.setBackgroundTint === 'function') {
                            this.background.setBackgroundTint(new THREE.Color(theme.colors.background));
                        } else if (this.background.mesh && this.background.mesh.material) {
                            this.background.mesh.material.color = new THREE.Color(theme.colors.background);
                            this.background.mesh.material.needsUpdate = true;
                        }
                    }
                }
            );
        } else {
            console.warn("Background not available or no texture specified");
            
            // Apply just the tint if texture isn't available
            if (this.background && theme.colors.background) {
                if (typeof this.background.setBackgroundTint === 'function') {
                    this.background.setBackgroundTint(new THREE.Color(theme.colors.background));
                } else if (this.background.mesh && this.background.mesh.material) {
                    this.background.mesh.material.color = new THREE.Color(theme.colors.background);
                    this.background.mesh.material.needsUpdate = true;
                }
            }
        }
        
        // Apply leaf count if available
        if (this.leafParticles && theme.leafCount !== undefined) {
            console.log(`Setting leaf count to ${theme.leafCount}`);
            this.leafParticles.setLeafCount(theme.leafCount);
        }
        
        console.log(`Theme applied: ${themeName}`);
    }
    
    update(deltaTime) {
        // No particles to update in this simplified version
    }
    
    dispose() {
        // No cleanup needed for the simplified version
    }
} 