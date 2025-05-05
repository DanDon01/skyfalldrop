// If you have an Environment class
export class Environment {
    constructor(scene) {
        this.scene = scene;
        this.setupSkybox();
    }
    
    setupSkybox() {
        console.log("Setting up skybox...");
        
        // Load skybox textures
        const loader = new THREE.CubeTextureLoader();
        
        // Set the path to the skybox textures
        loader.setPath('textures/skybox/');
        
        // Load the 6 sides of the cube
        const skyboxTexture = loader.load([
            'px.jpg', // positive x (right)
            'nx.jpg', // negative x (left)
            'py.jpg', // positive y (top)
            'ny.jpg', // negative y (bottom)
            'pz.jpg', // positive z (front)
            'nz.jpg'  // negative z (back)
        ]);
        
        // Set the scene background to the loaded skybox
        this.scene.background = skyboxTexture;
        
        console.log("Skybox setup complete");
    }
} 