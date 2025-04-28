import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class SkyBackground {
    constructor(scene) {
        this.scene = scene;
        this.cycleSpeed = 0.15; // Faster cycle
        this.elapsedTime = 0;
        
        // Sky colors with vibrant, distinct gradients
        this.skyColors = [
            // Dawn
            { top: 0x1a237e, bottom: 0xff7043 },
            // Day
            { top: 0x1565c0, bottom: 0x4fc3f7 },
            // Sunset
            { top: 0x6a1b9a, bottom: 0xff5722 },
            // Night
            { top: 0x0d47a1, bottom: 0x1a237e }
        ];
        
        this.material = null;
        this.createBackgroundPlane();
    }
    
    createBackgroundPlane() {
        // Create a simple full-screen background plane
        const geometry = new THREE.PlaneGeometry(200, 100);
        
        // Create a shader material for smooth gradient
        this.material = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(this.skyColors[0].top) },
                bottomColor: { value: new THREE.Color(this.skyColors[0].bottom) }
            },
            vertexShader: `
                varying vec2 vUv;
                void main() {
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                varying vec2 vUv;
                void main() {
                    gl_FragColor = vec4(mix(bottomColor, topColor, vUv.y), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        const plane = new THREE.Mesh(geometry, this.material);
        plane.position.z = -50;
        plane.renderOrder = -100; // Ensure it renders behind everything
        
        this.scene.add(plane);
        console.log("Simple sky background created");
    }
    
    update(deltaTime) {
        this.elapsedTime += deltaTime;
        
        // Calculate which colors to blend between
        const time = (this.elapsedTime * this.cycleSpeed) % 4;
        const index1 = Math.floor(time);
        const index2 = (index1 + 1) % 4;
        const blend = time - index1;
        
        // Get the two colors to blend between
        const color1Top = new THREE.Color(this.skyColors[index1].top);
        const color1Bottom = new THREE.Color(this.skyColors[index1].bottom);
        const color2Top = new THREE.Color(this.skyColors[index2].top);
        const color2Bottom = new THREE.Color(this.skyColors[index2].bottom);
        
        // Blend the colors
        const topColor = color1Top.clone().lerp(color2Top, blend);
        const bottomColor = color1Bottom.clone().lerp(color2Bottom, blend);
        
        // Update the shader uniforms
        this.material.uniforms.topColor.value = topColor;
        this.material.uniforms.bottomColor.value = bottomColor;
    }
    
    dispose() {
        if (this.material) {
            this.material.dispose();
        }
    }
} 