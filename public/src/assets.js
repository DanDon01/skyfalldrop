import * as THREE from 'three';
// TODO: Import GLTFLoader if/when needed
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

export class Assets {
    constructor() {
        this.textures = {}; // Store loaded textures
        this.audio = {}; // Store loaded audio
        // this.models = {}; // Store loaded models later
        this.loadingManager = new THREE.LoadingManager(); // Manage loading progress
        this.textureLoader = new THREE.TextureLoader(this.loadingManager);
        // this.gltfLoader = new GLTFLoader(this.loadingManager); // Init later if needed

        this.loaded = false;
        // No longer need manual promises array if relying solely on LoadingManager
        // this.promises = [];

        // Loading progress handlers (optional)
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
        };
        this.loadingManager.onLoad = () => {
            // This callback is now set in main.js to trigger game initialization
            console.log('LoadingManager internal onLoad: All assets loaded.'); // Added log
            this.loaded = true;
        };
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            console.log(`Loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
            // Update loading bar UI here if implemented
        };
        this.loadingManager.onError = (url) => {
            console.error('LoadingManager: There was an error loading ' + url);
        };
    }

    // --- Texture Loading ---
    loadTexture(name, path) {
        // No need to return or track promise here, LoadingManager handles it
        this.textureLoader.load(
            path,
            (texture) => { // onLoad
                this.textures[name] = texture;
                console.log(`Texture loaded: ${name} (${path})`);
            },
            undefined, // onProgress - handled by manager
            (err) => { // onError
                console.error(`Failed to load texture: ${name} (${path})`, err);
                // LoadingManager's onError will also fire
            }
        );
    }

    getTexture(name) {
        return this.textures[name] || null;
    }

    // --- Audio Loading ---
    loadAudio(name, path, loop = false) {
        // No need to return or track promise here
        const audioListener = new THREE.AudioListener(); // Create listener here
        const audio = new THREE.Audio(audioListener);

        const audioLoader = new THREE.AudioLoader(this.loadingManager);
        audioLoader.load(
            path,
            (buffer) => { // onLoad
                audio.setBuffer(buffer);
                audio.setLoop(loop);
                audio.setVolume(loop ? 0.3 : 0.7);
                this.audio[name] = audio;
                console.log(`Audio loaded: ${name} (${path})`);
            },
            undefined, // onProgress
            (err) => { // onError
                console.error(`Failed to load audio: ${name} (${path})`, err);
            }
        );
    }

    getAudio(name) {
        return this.audio[name] || null;
    }

    playSound(name) {
        const sound = this.getAudio(name);
        if (sound) {
            if (sound.isPlaying) {
                sound.stop();
            }
            sound.play();
        } else {
            console.warn(`Sound effect not found or loaded: ${name}`);
        }
    }

    // --- Model Loading (Example - Implement later) ---
    // loadModel(name, path) { ... }
    // getModel(name) { ... }

    // --- Load All Assets ---
    loadAll() { // No longer async, just initiates loads
        console.log("Starting asset loading (Three.js)...");

        // Textures
        this.loadTexture('player', 'textures/player.png');
        this.loadTexture('bird_pigeon', 'textures/bird_pigeon.png');
        this.loadTexture('bird_crow', 'textures/bird_crow.png');
        this.loadTexture('plane_paper', 'textures/plane_paper.png');
        this.loadTexture('plane_balloon', 'textures/plane_balloon.png');

        // Audio
        this.loadAudio('background_music', 'audio/background_loop.mp3', true);
        this.loadAudio('sfx_milestone', 'audio/sfx_milestone_ping.mp3');
        this.loadAudio('sfx_portal', 'audio/sfx_portal_warp.mp3');
        this.loadAudio('sfx_snap_click', 'audio/sfx_snapshot_click.mp3');
        this.loadAudio('sfx_snap_slowmo', 'audio/sfx_snapshot_slowmo.mp3');

        console.log("Asset loading initiated. Completion handled by LoadingManager.onLoad in main.js.");
        // No await Promise.all needed here
    }
}
