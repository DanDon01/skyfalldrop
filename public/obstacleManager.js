import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';
import { Obstacle } from './obstacle.js';

export class ObstacleManager {
    constructor(scene, camera) {
        this.scene = scene;
        this.camera = camera;
        this.obstacles = []; // Array to hold active obstacles
        this.baseSpeed = 4; // Base speed
        this.speedVariation = 1.2; // Speed variation
        this.spawnTimer = 0;
        this.spawnInterval = 1.0;
        this.baseSpawnY = -10;
        this.despawnY = 15;
        this.horizontalSpawnPadding = 1.0;
        
        // Create a texture loader
        this.textureLoader = new THREE.TextureLoader();
        
        // Array to store discovered textures
        this.availableTextures = [];
        
        // Update path to the obstacles folder
        this.texturesPath = 'textures/obstacles/';
        
        // Initialize by loading textures
        this.loadAvailableTextures();
    }
    
    loadAvailableTextures() {
        console.log("Reading obstacle list from obstacles folder...");
        
        // Clear any existing textures to avoid duplicates
        this.availableTextures = [];
        
        // Log the exact path we're trying to fetch
        const listFilePath = `${this.texturesPath}obstacleslist.txt`;
        console.log(`Attempting to fetch obstacle list from: ${listFilePath}`);
        
        // First load the list file
        fetch(listFilePath)
            .then(response => {
                console.log(`Fetch response status: ${response.status} ${response.statusText}`);
                
                if (!response.ok) {
                    throw new Error(`Failed to load obstacle list: ${response.status} ${response.statusText}`);
                }
                return response.text();
            })
            .then(text => {
                console.log(`Successfully loaded list file, content length: ${text.length} characters`);
                
                // Parse the list - assuming one filename per line
                const filenames = text.split('\n')
                    .map(line => line.trim())
                    .filter(line => line.length > 0); // Remove empty lines
                
                console.log(`Found ${filenames.length} obstacles in list file: ${filenames.join(', ')}`);
                
                if (filenames.length === 0) {
                    throw new Error("Obstacle list file was empty");
                }
                
                // Load each texture in the list
                filenames.forEach(filename => {
                    // Add .png extension if not already present
                    if (!filename.toLowerCase().endsWith('.png')) {
                        filename += '.png';
                    }
                    
                    const texturePath = `${this.texturesPath}${filename}`;
                    console.log(`Loading texture: ${texturePath}`);
                    
                    // Load the texture
                    this.textureLoader.load(
                        texturePath,
                        // Success handler
                        (texture) => {
                            // Generate random stats for this texture
                            const textureConfig = {
                                path: texturePath,
                                speed: 0.5 + Math.random() * 3.0,
                                range: 1.0 + Math.random() * 3.0,
                                baseHeight: 0.7 + Math.random() * 1.1
                            };
                            
                            // Add to available textures
                            this.availableTextures.push(textureConfig);
                            console.log(`✅ Successfully loaded obstacle texture: ${texturePath} (Total: ${this.availableTextures.length})`);
                        },
                        // Progress handler (not needed)
                        undefined,
                        // Error handler
                        (error) => {
                            console.error(`❌ Failed to load texture ${texturePath}:`, error);
                        }
                    );
                });
            })
            .catch(error => {
                console.error("❌ Error loading obstacle list:", error);
                console.log("Check that textures/obstacles/obstacleslist.txt exists and is accessible");
                console.warn("Falling back to sequential number loading...");
                
                // Fall back to sequential loading as a backup
                this.loadSequentialTextures();
            });
    }

    // Fallback method to load textures sequentially if the list file is not found
    loadSequentialTextures() {
        console.log("Attempting to load sequentially numbered textures as fallback...");
        
        let consecutiveFailures = 0;
        let textureCount = 1;
        let maxTextures = 100; // Safety limit to prevent infinite attempts
        
        const tryNextTexture = () => {
            // Stop if we've had too many failures or reached the max limit
            if (consecutiveFailures >= 3 || textureCount > maxTextures) {
                console.log(`Finished loading obstacle textures. Found ${this.availableTextures.length} textures.`);
                return;
            }
            
            // Construct the texture path - using sequential numbering
            const texturePath = `${this.texturesPath}${textureCount}.png`;
            
            // Load the texture
            this.textureLoader.load(
                texturePath,
                // Success handler
                (texture) => {
                    // Generate random stats for this texture
                    const textureConfig = {
                        path: texturePath,
                        speed: 0.5 + Math.random() * 3.0,
                        range: 1.0 + Math.random() * 3.0,
                        baseHeight: 0.7 + Math.random() * 1.1
                    };
                    
                    // Add to available textures
                    this.availableTextures.push(textureConfig);
                    console.log(`Loaded obstacle texture: ${texturePath} (Total: ${this.availableTextures.length})`);
                    
                    // Reset failure counter since we had a success
                    consecutiveFailures = 0;
                    
                    // Try the next texture
                    textureCount++;
                    tryNextTexture();
                },
                // Progress handler (not needed)
                undefined,
                // Error handler
                () => {
                    // Count consecutive failures
                    consecutiveFailures++;
                    
                    console.log(`Texture ${texturePath} not found. Consecutive failures: ${consecutiveFailures}`);
                    
                    // Move to next texture
                    textureCount++;
                    tryNextTexture();
                }
            );
        };
        
        // Start the sequential loading process
        tryNextTexture();
    }

    // Calculate the horizontal boundaries for spawning
    getSpawnBounds() {
        const vFOV = THREE.MathUtils.degToRad(this.camera.fov);
        const height = 2 * Math.tan(vFOV / 2) * this.camera.position.z;
        const width = height * this.camera.aspect;
        const minX = (-width / 2) + this.horizontalSpawnPadding;
        const maxX = (width / 2) - this.horizontalSpawnPadding;
        return { minX, maxX };
    }

    spawnObstacle() {
        // Check if we have any textures loaded
        if (this.availableTextures.length === 0) {
            console.warn("No obstacle textures available. Skipping spawn.");
            return;
        }
        
        // Select a random texture configuration
        const textureConfig = this.availableTextures[
            Math.floor(Math.random() * this.availableTextures.length)
        ];
        
        // Determine spawn position
        const bounds = this.getSpawnBounds();
        const spawnX = THREE.MathUtils.randFloat(bounds.minX, bounds.maxX);
        const spawnY = this.baseSpawnY - Math.random() * 5;
        const spawnZ = 0;
        const initialPosition = new THREE.Vector3(spawnX, spawnY, spawnZ);

        // Create and add the obstacle
        const newObstacle = new Obstacle(
            this.scene,
            textureConfig.path,
            initialPosition,
            textureConfig.speed,
            textureConfig.range
        );
        
        // Track total obstacles before and after adding
        const beforeCount = this.obstacles.length;
        this.obstacles.push(newObstacle);
        
        console.log(`Spawned ${textureConfig.path} at X: ${spawnX.toFixed(2)}, Y: ${spawnY.toFixed(2)}`);
        console.log(`Active obstacles: ${beforeCount} → ${this.obstacles.length}`);
    }

    update(deltaTime, scrollSpeed) {
        // First check if we have textures available yet
        if (this.availableTextures.length === 0 && this.spawnTimer > 3) {
            console.warn("Still no textures available after 3 seconds. Retrying scan...");
            this.loadAvailableTextures();
            this.spawnTimer = 0;
            return;
        }
        
        // Update spawn timer
        this.spawnTimer += deltaTime;
        
        const shouldSpawn = this.spawnTimer >= this.spawnInterval;
        
        // Spawn new obstacles at regular intervals
        if (shouldSpawn && this.availableTextures.length > 0) {
            console.log(`Spawning new obstacle (Timer: ${this.spawnTimer.toFixed(2)}, Interval: ${this.spawnInterval.toFixed(2)})`);
            this.spawnObstacle();
            this.spawnTimer = 0;
            
            this.spawnInterval = Math.max(0.6, this.spawnInterval - 0.01);
        }
        
        // First, remove any null obstacles
        const beforeFilterCount = this.obstacles.length;
        this.obstacles = this.obstacles.filter(obstacle => obstacle !== null && obstacle !== undefined);
        const afterFilterCount = this.obstacles.length;
        
        if (beforeFilterCount !== afterFilterCount) {
            console.log(`Removed ${beforeFilterCount - afterFilterCount} null obstacles`);
        }
        
        let updatedCount = 0;
        let removedCount = 0;
        
        for (let i = this.obstacles.length - 1; i >= 0; i--) {
            try {
                const obstacle = this.obstacles[i];
                
                // Skip update for null obstacles or still-loading obstacles
                if (!obstacle) {
                    this.obstacles.splice(i, 1);
                    removedCount++;
                    continue;
                }
                
                if (obstacle.isLoading) {
                    continue;
                }
                
                if (!obstacle.mesh) {
                    this.obstacles.splice(i, 1);
                    removedCount++;
                    continue;
                }
                
                const speedReductionFactor = 0.5; 
                obstacle.update(deltaTime, scrollSpeed * speedReductionFactor);
                updatedCount++;
                
                if (obstacle.mesh.position.y > this.despawnY) {
                    obstacle.removeFromScene();
                    this.obstacles.splice(i, 1);
                    removedCount++;
                }
            } catch (error) {
                console.error("Error updating obstacle:", error);
                if (i >= 0 && i < this.obstacles.length) {
                    try {
                        const obstacle = this.obstacles[i];
                        if (obstacle && obstacle.removeFromScene) {
                            obstacle.removeFromScene();
                        }
                    } catch (e) {
                        // Silently fail
                    }
                    this.obstacles.splice(i, 1);
                    removedCount++;
                }
            }
        }
        
        if (shouldSpawn) {
            console.log(`Updated ${updatedCount} obstacles, removed ${removedCount}`);
        }
    }

    // Method for collision detection
    getActiveObstacles() {
        return this.obstacles.filter(obstacle => {
            if (!obstacle.mesh) return false;
            return obstacle.mesh.position.y > this.baseSpawnY && 
                   obstacle.mesh.position.y < this.despawnY;
        });
    }

    // Method to clear all obstacles
    clearAllObstacles() {
        console.log("Clearing all obstacles...");
        this.obstacles.forEach(obstacle => {
            if (obstacle && obstacle.removeFromScene) {
                obstacle.removeFromScene();
            }
        });
        this.obstacles = [];
        this.spawnTimer = 0;
    }
    
    // Scan for new textures (can be called from outside to refresh the texture list)
    refreshTextures() {
        console.log("Refreshing obstacle textures...");
        this.loadAvailableTextures();
    }
} 