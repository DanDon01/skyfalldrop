import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class CollisionSystem {
    constructor(scene, player, obstacleManager) {
        this.scene = scene;
        this.player = player;
        this.obstacleManager = obstacleManager;
        this.collisionEnabled = true;
        
        // Debug visualization
        this.debug = false;
        this.debugHelpers = [];
        
        // Collision settings
        this.playerCollisionRadius = 0.4; // Adjust based on your player model
        this.obstacleCollisionThreshold = 0.8; // How close before counting as collision
        
        // Collision state
        this.lastCollisionTime = 0;
        this.collisionCooldown = 500; // ms
    }
    
    update() {
        if (!this.collisionEnabled) return [];
        
        const collisions = [];
        const playerPosition = this.player.getPosition();
        const currentTime = Date.now();
        
        // Get active obstacles from the obstacle manager
        const obstacles = this.obstacleManager.getActiveObstacles();
        
        // Remove previous debug helpers if any
        if (this.debug) {
            this.clearDebugHelpers();
        }
        
        // Check each obstacle for collision
        for (const obstacle of obstacles) {
            const obstaclePosition = obstacle.getPosition();
            
            // Simple distance check
            const distance = playerPosition.distanceTo(obstaclePosition);
            
            // Create debug helper if debug mode is on
            if (this.debug) {
                this.createDebugHelper(playerPosition, obstaclePosition, distance);
            }
            
            // Check if collision occurred and is not in cooldown
            if (distance < this.obstacleCollisionThreshold && 
                currentTime - this.lastCollisionTime > this.collisionCooldown) {
                
                collisions.push({
                    obstacle: obstacle,
                    distance: distance,
                    time: currentTime
                });
                
                this.lastCollisionTime = currentTime;
                
                // Basic collision response
                this.handleCollision(obstacle);
            }
        }
        
        return collisions;
    }
    
    handleCollision(obstacle) {
        // Calculate impact direction (from obstacle to player)
        const playerPos = this.player.getPosition();
        const obstaclePos = obstacle.getPosition();
        const impactDirection = new THREE.Vector3()
            .subVectors(playerPos, obstaclePos)
            .normalize();
        
        // Apply bounce to obstacle
        obstacle.applyBounce(impactDirection, 1.5); // Direction and force
        
        // Apply jostle to player
        this.player.handleCollision(obstacle, impactDirection);
        
        // Reduce score (access through window.gameState, which we need to ensure exists)
        if (window.gameState && typeof window.gameState.reduceScore === 'function') {
            window.gameState.reduceScore(100); // Reduce by 100 points
        }
        
        // Dispatch collision event
        const collisionEvent = new CustomEvent('player-collision', {
            detail: {
                obstacle: obstacle,
                impactDirection: impactDirection,
                time: Date.now()
            }
        });
        document.dispatchEvent(collisionEvent);
        
        // Log collision for debugging
        console.log(`Collision detected with obstacle: ${obstacle.id}`);
    }
    
    createDebugHelper(playerPos, obstaclePos, distance) {
        // Create a line between player and obstacle
        const material = new THREE.LineBasicMaterial({
            color: distance < this.obstacleCollisionThreshold ? 0xff0000 : 0x00ff00
        });
        const geometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(playerPos.x, playerPos.y, playerPos.z),
            new THREE.Vector3(obstaclePos.x, obstaclePos.y, obstaclePos.z)
        ]);
        const line = new THREE.Line(geometry, material);
        this.scene.add(line);
        this.debugHelpers.push(line);
        
        // Create sphere around player to visualize collision radius
        const sphereGeometry = new THREE.SphereGeometry(this.playerCollisionRadius, 8, 8);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0x0000ff,
            wireframe: true
        });
        const sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        sphere.position.copy(playerPos);
        this.scene.add(sphere);
        this.debugHelpers.push(sphere);
    }
    
    clearDebugHelpers() {
        this.debugHelpers.forEach(helper => {
            this.scene.remove(helper);
            if (helper.geometry) helper.geometry.dispose();
            if (helper.material) helper.material.dispose();
        });
        this.debugHelpers = [];
    }
    
    enableCollision() {
        this.collisionEnabled = true;
    }
    
    disableCollision() {
        this.collisionEnabled = false;
    }
    
    toggleDebug() {
        this.debug = !this.debug;
        if (!this.debug) {
            this.clearDebugHelpers();
        }
    }
} 