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
        // Remove cloud layer initialization since cloud_billboard is not used
        console.log("Cloud layers are disabled (cloud_billboard.png not used).");
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
