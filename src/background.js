import * as THREE from 'three';

// Simple gradient sky shader
const vertexShader = `
varying vec3 vWorldPosition;
void main() {
    vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const fragmentShader = `
uniform vec3 topColor;
uniform vec3 bottomColor;
uniform float offset;
uniform float exponent;
varying vec3 vWorldPosition;
void main() {
    float h = normalize( vWorldPosition + offset ).y;
    gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
}
`;

export class Background {
    constructor(scene, assets) { // Added assets parameter
        this.scene = scene;
        this.assets = assets;
        this.skyMesh = null; // Renamed from this.mesh
        this.cloudLayers = []; // Store multiple cloud layers { system, speed, rangeY, wrapThreshold }
        this.initSky();
        this.initClouds();
    }

    initSky() {
        const skyGeo = new THREE.SphereGeometry(1000, 32, 15); // Large sphere radius
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(0x0077ff) }, // Sky blue
                bottomColor: { value: new THREE.Color(0xffffff) }, // White horizon
                offset: { value: 33 },
                exponent: { value: 0.6 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });

        this.skyMesh = new THREE.Mesh(skyGeo, skyMat);
        this.scene.add(this.skyMesh);
        console.log("3D Sky background initialized.");
    }

    initClouds() {
        const cloudTexture = this.assets.getTexture('cloud_billboard');
        if (!cloudTexture) {
            console.warn("Cloud texture not loaded, skipping cloud initialization.");
            return;
        }

        // Define layers: count, size, speed factor (relative to world scroll), z-depth range
        const layersConfig = [
            { count: 30, baseSize: 40, speedFactor: 0.8, zMin: -150, zMax: -100, opacity: 0.6 }, // Farther
            { count: 40, baseSize: 50, speedFactor: 1.0, zMin: -80, zMax: -40, opacity: 0.8 },  // Middle
            { count: 20, baseSize: 60, speedFactor: 1.2, zMin: -30, zMax: -10, opacity: 1.0 }   // Closer
        ];

        const spawnRangeX = 250;
        const verticalRange = 300; // Total vertical distance clouds travel before wrapping

        layersConfig.forEach(config => {
            const particles = new THREE.BufferGeometry();
            const positions = new Float32Array(config.count * 3);
            // const sizes = new Float32Array(config.count); // Can add size variation later

            for (let i = 0; i < config.count; i++) {
                const i3 = i * 3;
                positions[i3] = (Math.random() - 0.5) * spawnRangeX;
                // Start scattered within the vertical range below the player
                positions[i3 + 1] = Math.random() * verticalRange - (verticalRange + 50); // Start below y=0
                positions[i3 + 2] = Math.random() * (config.zMax - config.zMin) + config.zMin; // Depth
                // sizes[i] = config.baseSize * (0.8 + Math.random() * 0.4); // Size variation
            }

            particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            // particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1)); // Add later

            const particleMaterial = new THREE.PointsMaterial({
                map: cloudTexture,
                size: config.baseSize,
                // sizeAttenuation: true, // Enable if using size attribute
                transparent: true,
                opacity: config.opacity,
                alphaTest: 0.05, // Lower alphaTest might be needed
            });

            const particleSystem = new THREE.Points(particles, particleMaterial);
            this.scene.add(particleSystem);
            this.cloudLayers.push({
                system: particleSystem,
                speedFactor: config.speedFactor,
                rangeY: verticalRange,
                wrapThreshold: 150 // Y position to wrap around (top of screen)
            });
        });

        console.log(`Initialized ${this.cloudLayers.length} cloud layers.`);
    }

    update(deltaTime, worldScrollSpeed) { // Pass worldScrollSpeed from main
        // Update cloud layer positions (move upwards)
        this.cloudLayers.forEach(layer => {
            const positions = layer.system.geometry.attributes.position.array;
            const layerSpeed = worldScrollSpeed * layer.speedFactor; // Speed relative to world

            for (let i = 1; i < positions.length; i += 3) { // Update Y position
                positions[i] += layerSpeed * deltaTime;

                // Wrap particles back to the bottom if they go too high
                if (positions[i] > layer.wrapThreshold) {
                    positions[i] -= layer.rangeY; // Wrap down by the full range
                    // Optionally randomize X/Z again on wrap
                    // positions[i-1] = (Math.random() - 0.5) * spawnRangeX;
                    // positions[i+1] = Math.random() * (config.zMax - config.zMin) + config.zMin;
                }
            }
            layer.system.geometry.attributes.position.needsUpdate = true;
        });
    }

    // No render method needed, handled by main loop
}
