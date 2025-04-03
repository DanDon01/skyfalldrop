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
        this.promises = []; // Track individual load promises if needed outside manager

        // Loading progress handlers (optional)
        this.loadingManager.onStart = (url, itemsLoaded, itemsTotal) => {
            console.log(`Started loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
        };
        this.loadingManager.onLoad = () => {
            console.log('All assets loaded via LoadingManager.');
            this.loaded = true;
            // Resolve a master promise if needed elsewhere
        };
        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            console.log(`Loading file: ${url}.\nLoaded ${itemsLoaded} of ${itemsTotal} files.`);
            // Update loading bar UI here if implemented
        };
        this.loadingManager.onError = (url) => {
            console.error('There was an error loading ' + url);
        };
    }

    // --- Texture Loading ---
    loadTexture(name, path) {
        const promise = new Promise((resolve) => {
            this.textureLoader.load(
                path,
                (texture) => { // onLoad
                    this.textures[name] = texture;
                    console.log(`Texture loaded: ${name} (${path})`);
                    resolve(texture);
                },
                undefined, // onProgress - handled by manager
                (err) => { // onError
                    console.error(`Failed to load texture: ${name} (${path})`, err);
                    resolve(null); // Resolve null so Promise.all doesn't break
                }
            );
        });
        this.promises.push(promise); // Still track promises for potential external use
    }

    getTexture(name) {
        return this.textures[name] || null;
    }

    // --- Audio Loading ---
    loadAudio(name, path, loop = false) {
        const promise = new Promise((resolve) => {
            const audioListener = new THREE.AudioListener(); // Need listener for positional audio later
            const audio = new THREE.Audio(audioListener); // Use THREE.Audio

            const audioLoader = new THREE.AudioLoader(this.loadingManager);
            audioLoader.load(
                path,
                (buffer) => { // onLoad
                    audio.setBuffer(buffer);
                    audio.setLoop(loop);
                    audio.setVolume(loop ? 0.3 : 0.7); // Example: lower volume for music
                    this.audio[name] = audio;
                    console.log(`Audio loaded: ${name} (${path})`);
                    resolve(audio);
                },
                undefined, // onProgress
                (err) => { // onError
                    console.error(`Failed to load audio: ${name} (${path})`, err);
                    resolve(null);
                }
            );
        });
        this.promises.push(promise);
    }

    getAudio(name) {
        return this.audio[name] || null;
    }

    playSound(name) {
        const sound = this.getAudio(name);
        if (sound) {
            if (sound.isPlaying) {
                sound.stop(); // Stop previous playback before starting again
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
    async loadAll() { // Make async again to use await Promise.all
        console.log("Starting asset loading (Three.js)...");

        // Textures (using names from required_assets.md)
        this.loadTexture('player', 'textures/player.png');
        this.loadTexture('bird_pigeon', 'textures/bird_pigeon.png');
        this.loadTexture('bird_crow', 'textures/bird_crow.png');
        this.loadTexture('plane_paper', 'textures/plane_paper.png');
        this.loadTexture('plane_jet', 'textures/plane_jet.png');
        this.loadTexture('plane_balloon', 'textures/plane_balloon.png');
        this.loadTexture('cloud_billboard', 'textures/cloud_billboard.png');
        this.loadTexture('wind_particle', 'textures/wind_particle.png'); // Added wind particle
        // this.loadTexture('portal_effect', 'textures/portal_effect.png'); // If needed for portal shader

        // Audio
        this.loadAudio('background_music', 'audio/background_loop.mp3', true);
        this.loadAudio('sfx_hit', 'audio/sfx_hit_bounce.wav');
        this.loadAudio('sfx_milestone', 'audio/sfx_milestone_ping.wav');
        this.loadAudio('sfx_portal', 'audio/sfx_portal_warp.wav');
        this.loadAudio('sfx_snap_click', 'audio/sfx_snapshot_click.wav');
        this.loadAudio('sfx_snap_slowmo', 'audio/sfx_snapshot_slowmo.wav');

        // Models (Add later)
        // this.loadModel('player_model', 'models/player.glb');

        // Although LoadingManager handles its queue, awaiting promises here
        // ensures this function doesn't resolve until *all* tracked loads finish/error.
        // This might be redundant depending on how LoadingManager.onLoad is used in main.js,
        // but provides an explicit completion point for loadAll itself.
        await Promise.all(this.promises);

        console.log("Asset loading initiated. Completion handled by LoadingManager.onLoad.");
        // The 'loaded' flag is set true within the LoadingManager.onLoad callback.
    }
}
