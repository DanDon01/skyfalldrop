import * as THREE from 'three';
// Import refactored/adapted modules
import { Player } from './player.js';
import { Background } from './background.js';
import { ObstacleManager } from './obstacles.js';
import { ScoreManager } from './score.js';
import { Controls } from './controls.js';
import { TouchControls } from './controls-touch.js';
import { SnapshotManager } from './snapshot.js';
import { Assets } from './assets.js';
import { UI } from './ui.js';
import { WindParticles } from './wind-particles.js'; // Import WindParticles

class Game {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.touchControls = null;
        this.player = null;
        this.obstacleManager = null;
        this.background = null;
        this.scoreManager = null;
        this.snapshotManager = null;
        this.ui = null;
        this.assets = null;
        this.windParticles = null;
        // Portal related variables
        this.startPortalGroup = null;
        this.startPortalBox = null;
        this.exitPortalGroup = null;
        this.exitPortalBox = null;
        this.isLoading = true; // Start in loading state

        this.init();
        this.animate = this.animate.bind(this);
        this.clock = new THREE.Clock();
    }

    // Separate initialization of core Three.js components
    initThreeJS() {
        this.scene = new THREE.Scene();

        const fov = 75;
        const aspect = window.innerWidth / window.innerHeight;
        const near = 0.1;
        const far = 2000;
        this.camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
        this.camera.position.set(0, 0, 30); // Adjust camera position for centered player
        this.camera.lookAt(0, 0, 0);

        const canvas = document.getElementById('game');
        this.renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);

        const ambientLight = new THREE.AmbientLight(0xffffff, 0.7); // Slightly brighter ambient
        this.scene.add(ambientLight);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0); // Slightly brighter directional
        directionalLight.position.set(50, 100, 75);
        this.scene.add(directionalLight);

        window.addEventListener('resize', () => this.onWindowResize());
    }

    // Main initialization function
    init() {
        this.initThreeJS(); // Setup scene, camera, renderer first
        this.renderLoadingScreen(); // Draw once before assets load

        this.assets = new Assets();
        this.assets.loadingManager.onLoad = () => {
            console.log("Assets loaded, initializing game components...");
            this.initializeGameComponents();
            this.isLoading = false;
            this.tryStartMusic();
            console.log("Loading complete. Starting animation loop...");
            this.animate();
        };
        this.assets.loadAll();
    }

    // Initialize game components AFTER assets are loaded
    initializeGameComponents() {
        const canvas = this.renderer.domElement;

        this.controls = new Controls();
        this.touchControls = new TouchControls(canvas);

        this.player = new Player(this.scene, this.assets);
        this.obstacleManager = new ObstacleManager(this.scene, this.assets);
        this.background = new Background(this.scene, this.assets);
        this.ui = new UI();
        this.scoreManager = new ScoreManager(this.assets, this.ui);
        this.snapshotManager = new SnapshotManager(this);
        this.windParticles = new WindParticles(this.scene, this.assets);

        if (this.ui && this.snapshotManager) {
            this.ui.setSnapshotManager(this.snapshotManager);
        }

        this.setupPortals();
        this.addInteractionListener();

        console.log("Game components initialized.");
    }


    onWindowResize() {
        if (!this.camera || !this.renderer) return;
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        if (this.isLoading) {
             requestAnimationFrame(this.animate);
             return;
        }

        requestAnimationFrame(this.animate);

        const rawDeltaTime = this.clock.getDelta();
        const deltaTime = this.snapshotManager ? this.snapshotManager.getEffectiveDeltaTime(rawDeltaTime) : rawDeltaTime;

        // Determine world scroll speed (can be dynamic later)
        const worldScrollSpeed = this.obstacleManager ? this.obstacleManager.worldScrollSpeed : 20;

        // Update components
        if (this.background) this.background.update(deltaTime, worldScrollSpeed); // Pass scroll speed
        if (this.player) this.player.update(deltaTime, this.controls, this.touchControls);
        if (this.obstacleManager) this.obstacleManager.update(deltaTime); // Obstacles use their own speed + world speed
        if (this.scoreManager) this.scoreManager.update(deltaTime * 1000);
        if (this.snapshotManager) this.snapshotManager.update(rawDeltaTime * 1000);
        if (this.windParticles) this.windParticles.update(deltaTime);

        // Update UI
        if (this.ui && this.scoreManager) {
            this.ui.updateScore(this.scoreManager.getScore());
        }

        // Check Collisions
        this.checkCollisions();
        this.checkPortalCollisions();

        // Animate Portal Particles
        if (this.animateStartPortalParticles) this.animateStartPortalParticles();
        if (this.animateExitPortalParticles) this.animateExitPortalParticles();

        // Render Scene
        this.renderer.render(this.scene, this.camera);
    }

    renderLoadingScreen() {
        const canvas = document.getElementById('game');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#333';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.fillStyle = 'white';
                ctx.font = '24px sans-serif';
                ctx.textAlign = 'center';
                ctx.fillText('Loading Assets...', canvas.width / 2, canvas.height / 2);
            }
        }
    }

    checkCollisions() {
        if (!this.player || !this.obstacleManager || !this.obstacleManager.obstacles.length) return;
        const playerBox = this.player.boundingBox;
        for (let i = this.obstacleManager.obstacles.length - 1; i >= 0; i--) {
            const obsData = this.obstacleManager.obstacles[i];
            const obstacleBox = obsData.boundingBox;
            if (playerBox.intersectsBox(obstacleBox)) {
                console.log("3D Collision Detected!");
                this.player.handleCollision();
                if (this.scoreManager) this.scoreManager.handleCollision();
                if (this.assets) this.assets.playSound('sfx_hit');
                this.scene.remove(obsData.mesh);
                // TODO: Properly dispose geometry/material
                this.obstacleManager.obstacles.splice(i, 1);
            }
        }
    }

    setupPortals() {
        const SPAWN_POINT_X = 0; const SPAWN_POINT_Y = 60; const SPAWN_POINT_Z = 0;
        if (new URLSearchParams(window.location.search).get('portal')) {
            console.log("Creating Start Portal...");
            this.startPortalGroup = new THREE.Group();
            this.startPortalGroup.position.set(SPAWN_POINT_X, SPAWN_POINT_Y, SPAWN_POINT_Z);
            this.startPortalGroup.rotation.x = 0.35; this.startPortalGroup.rotation.y = 0;
            const startPortalGeometry = new THREE.TorusGeometry(15, 2, 16, 100);
            const startPortalMaterial = new THREE.MeshPhongMaterial({ color: 0xff0000, emissive: 0xff0000, transparent: true, opacity: 0.8 });
            const startPortal = new THREE.Mesh(startPortalGeometry, startPortalMaterial);
            this.startPortalGroup.add(startPortal);
            const startPortalInnerGeometry = new THREE.CircleGeometry(13, 32);
            const startPortalInnerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
            const startPortalInner = new THREE.Mesh(startPortalInnerGeometry, startPortalInnerMaterial);
            this.startPortalGroup.add(startPortalInner);
            const startPortalParticleCount = 1000; const startPortalParticles = new THREE.BufferGeometry();
            const startPortalPositions = new Float32Array(startPortalParticleCount * 3); const startPortalColors = new Float32Array(startPortalParticleCount * 3);
            for (let i = 0; i < startPortalParticleCount * 3; i += 3) {
                const angle = Math.random() * Math.PI * 2; const radius = 15 + (Math.random() - 0.5) * 4;
                startPortalPositions[i] = Math.cos(angle) * radius; startPortalPositions[i + 1] = Math.sin(angle) * radius; startPortalPositions[i + 2] = (Math.random() - 0.5) * 4;
                startPortalColors[i] = 0.8 + Math.random() * 0.2; startPortalColors[i + 1] = 0; startPortalColors[i + 2] = 0;
            }
            startPortalParticles.setAttribute('position', new THREE.BufferAttribute(startPortalPositions, 3)); startPortalParticles.setAttribute('color', new THREE.BufferAttribute(startPortalColors, 3));
            const startPortalParticleMaterial = new THREE.PointsMaterial({ size: 0.2, vertexColors: true, transparent: true, opacity: 0.6 });
            const startPortalParticleSystem = new THREE.Points(startPortalParticles, startPortalParticleMaterial);
            this.startPortalGroup.add(startPortalParticleSystem);
            this.scene.add(this.startPortalGroup);
            this.startPortalBox = new THREE.Box3().setFromObject(this.startPortalGroup);
            this.animateStartPortalParticles = () => {
                if (!this.startPortalGroup) return; const positions = startPortalParticles.attributes.position.array;
                for (let i = 0; i < positions.length; i += 3) { positions[i + 1] += 0.05 * Math.sin(Date.now() * 0.001 + i); }
                startPortalParticles.attributes.position.needsUpdate = true;
            };
        }
        console.log("Creating Exit Portal...");
        this.exitPortalGroup = new THREE.Group(); this.exitPortalGroup.position.set(0, -100, 0);
        this.exitPortalGroup.rotation.x = 0.35; this.exitPortalGroup.rotation.y = 0;
        const exitPortalGeometry = new THREE.TorusGeometry(15, 2, 16, 100);
        const exitPortalMaterial = new THREE.MeshPhongMaterial({ color: 0x00ff00, emissive: 0x00ff00, transparent: true, opacity: 0.8 });
        const exitPortal = new THREE.Mesh(exitPortalGeometry, exitPortalMaterial); this.exitPortalGroup.add(exitPortal);
        const exitPortalInnerGeometry = new THREE.CircleGeometry(13, 32);
        const exitPortalInnerMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, transparent: true, opacity: 0.5, side: THREE.DoubleSide });
        const exitPortalInner = new THREE.Mesh(exitPortalInnerGeometry, exitPortalInnerMaterial); this.exitPortalGroup.add(exitPortalInner);
        const labelCanvas = document.createElement('canvas'); const context = labelCanvas.getContext('2d');
        labelCanvas.width = 512; labelCanvas.height = 64; context.fillStyle = '#00ff00'; context.font = 'bold 32px Arial'; context.textAlign = 'center';
        context.fillText('VIBEVERSE PORTAL', labelCanvas.width / 2, labelCanvas.height / 2 + 10);
        const texture = new THREE.CanvasTexture(labelCanvas); const labelGeometry = new THREE.PlaneGeometry(30, 5);
        const labelMaterial = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
        const label = new THREE.Mesh(labelGeometry, labelMaterial); label.position.y = 20; this.exitPortalGroup.add(label);
        const exitPortalParticleCount = 1000; const exitPortalParticles = new THREE.BufferGeometry();
        const exitPortalPositions = new Float32Array(exitPortalParticleCount * 3); const exitPortalColors = new Float32Array(exitPortalParticleCount * 3);
        for (let i = 0; i < exitPortalParticleCount * 3; i += 3) {
            const angle = Math.random() * Math.PI * 2; const radius = 15 + (Math.random() - 0.5) * 4;
            exitPortalPositions[i] = Math.cos(angle) * radius; exitPortalPositions[i + 1] = Math.sin(angle) * radius; exitPortalPositions[i + 2] = (Math.random() - 0.5) * 4;
            exitPortalColors[i] = 0; exitPortalColors[i + 1] = 0.8 + Math.random() * 0.2; exitPortalColors[i + 2] = 0;
        }
        exitPortalParticles.setAttribute('position', new THREE.BufferAttribute(exitPortalPositions, 3)); exitPortalParticles.setAttribute('color', new THREE.BufferAttribute(exitPortalColors, 3));
        const exitPortalParticleMaterial = new THREE.PointsMaterial({ size: 0.2, vertexColors: true, transparent: true, opacity: 0.6 });
        const exitPortalParticleSystem = new THREE.Points(exitPortalParticles, exitPortalParticleMaterial); this.exitPortalGroup.add(exitPortalParticleSystem);
        this.scene.add(this.exitPortalGroup); this.exitPortalBox = new THREE.Box3().setFromObject(this.exitPortalGroup);
        this.animateExitPortalParticles = () => {
            if (!this.exitPortalGroup) return; const positions = exitPortalParticles.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) { positions[i + 1] += 0.05 * Math.sin(Date.now() * 0.001 + i); }
            exitPortalParticles.attributes.position.needsUpdate = true;
        };
    }

    checkPortalCollisions() {
        const selfUsername = "TestUser"; const currentSpeed = this.player ? this.player.velocity.y : 0;
        if (this.startPortalGroup && this.startPortalBox && this.player && this.player.mesh) {
            const playerBox = this.player.boundingBox;
            if (playerBox.intersectsBox(this.startPortalBox)) {
                console.log("Player entered START portal!");
                const urlParams = new URLSearchParams(window.location.search); const refUrl = urlParams.get('ref');
                if (refUrl) {
                    let url = refUrl; if (!url.startsWith('http://') && !url.startsWith('https://')) { url = 'https://' + url; }
                    const currentParams = new URLSearchParams(window.location.search); const newParams = new URLSearchParams();
                    for (const [key, value] of currentParams) { if (key !== 'ref' && key !== 'portal') { newParams.append(key, value); } }
                    const paramString = newParams.toString(); console.log("Redirecting to Start Ref URL:", url + (paramString ? '?' + paramString : ''));
                    // window.location.href = url + (paramString ? '?' + paramString : '');
                } else { console.log("Start portal entered, but no ref URL found."); }
            }
        }
        if (this.exitPortalGroup && this.exitPortalBox && this.player && this.player.mesh) {
            const playerBox = this.player.boundingBox; const portalDistance = playerBox.getCenter(new THREE.Vector3()).distanceTo(this.exitPortalBox.getCenter(new THREE.Vector3()));
            if (portalDistance < 50) {
                const currentParams = new URLSearchParams(window.location.search); const newParams = new URLSearchParams();
                newParams.append('portal', 'true'); newParams.append('username', selfUsername); newParams.append('color', 'white'); newParams.append('speed', currentSpeed.toString());
                const paramString = newParams.toString(); const nextPage = 'https://portal.pieter.com' + (paramString ? '?' + paramString : '');
                if (playerBox.intersectsBox(this.exitPortalBox)) {
                    console.log("Player entered EXIT portal! Redirecting to:", nextPage);
                    if (this.assets) this.assets.playSound('sfx_portal'); // Play sound on entry
                    // window.location.href = nextPage;
                }
            }
        }
    }

    addInteractionListener() {
        const startAudio = () => { this.tryStartMusic(); };
        // Use { once: true } for listeners to automatically remove themselves
        // Attach to renderer's DOM element for reliable interaction capture
        if (this.renderer) {
            this.renderer.domElement.addEventListener('click', startAudio, { once: true });
            this.renderer.domElement.addEventListener('touchstart', startAudio, { once: true });
        }
    }

    tryStartMusic() {
        if (this.assets && this.assets.loaded) {
            const music = this.assets.getAudio('background_music');
            if (music && !music.isPlaying) { // Check if music exists and is not playing
                // Add camera to listener and listener to camera - needed for THREE.Audio
                const listener = music.listener;
                if (this.camera && listener && !this.camera.children.includes(listener)) {
                     this.camera.add(listener);
                }
                music.play(); // Play returns the Audio object
                console.log("Attempting to play background music.");
            }
        }
    }
} // End of Game class

// Start the game when the DOM is ready
window.addEventListener('load', () => {
    new Game();
});
