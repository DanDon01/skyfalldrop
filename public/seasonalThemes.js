import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class SeasonalThemes {
    constructor(scene, background, skyBackground) {
        this.scene = scene;
        this.background = background;
        this.skyBackground = skyBackground;
        this.currentTheme = 'day'; // Default theme is day
        
        // Simplified themes - just Day and Night
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
                }
            },
            'night': {
                name: 'Night Mode',
                colors: {
                    sky: [
                        { top: 0x243356, bottom: 0x102136 }, // Dark morning
                        { top: 0x1A2A4A, bottom: 0x132C42 }, // Dark day
                        { top: 0x101A30, bottom: 0x0E1625 }, // Dark evening
                        { top: 0x070C18, bottom: 0x050814 }  // Deep night
                    ],
                    background: 0x1A2A4A // Dark blue tint
                }
            }
        };
        
        // Create switch button
        this.createThemeButton();
    }
    
    createThemeButton() {
        const button = document.createElement('button');
        button.textContent = '🌓 Day/Night';
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
        
        button.addEventListener('mouseover', () => {
            button.style.backgroundColor = '#2980b9';
        });
        
        button.addEventListener('mouseout', () => {
            button.style.backgroundColor = '#3498db';
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
        
        // Show theme notification
        this.showThemeNotification(this.themes[newTheme].name);
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
        if (this.skyBackground && theme.colors.sky) {
            console.log("Updating sky colors");
            this.skyBackground.setSkyColors(theme.colors.sky);
        } else {
            console.warn("SkyBackground not available for theme change", this.skyBackground);
        }
        
        // Apply background tint
        if (this.background && theme.colors.background) {
            console.log("Updating background tint");
            this.background.setBackgroundTint(new THREE.Color(theme.colors.background));
        } else {
            console.warn("Background not available for theme change", this.background);
        }
        
        console.log(`Theme applied: ${themeName}`);
    }
    
    showThemeNotification(themeName) {
        const notification = document.createElement('div');
        notification.textContent = `🌓 ${themeName}`;
        notification.style.position = 'fixed';
        notification.style.top = '50px';
        notification.style.left = '50%';
        notification.style.transform = 'translateX(-50%)';
        notification.style.backgroundColor = 'rgba(0,0,0,0.7)';
        notification.style.color = 'white';
        notification.style.padding = '10px 20px';
        notification.style.borderRadius = '20px';
        notification.style.fontFamily = 'Arial, sans-serif';
        notification.style.fontSize = '18px';
        notification.style.zIndex = '1000';
        notification.style.opacity = '0';
        notification.style.transition = 'opacity 0.5s ease-in-out';
        
        document.body.appendChild(notification);
        
        // Fade in
        setTimeout(() => {
            notification.style.opacity = '1';
            
            // Fade out after 2 seconds
            setTimeout(() => {
                notification.style.opacity = '0';
                
                // Remove from DOM after fade out
                setTimeout(() => {
                    if (notification.parentNode) {
                        document.body.removeChild(notification);
                    }
                }, 500);
            }, 2000);
        }, 10);
    }
    
    update(deltaTime) {
        // No particles to update in this simplified version
    }
    
    dispose() {
        // No cleanup needed for the simplified version
    }
} 