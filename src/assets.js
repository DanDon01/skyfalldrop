// Handles preloading and management of all game assets (images, audio)

export class Assets {
    constructor() {
        this.images = {}; // Stores loaded Image objects
        this.audio = {}; // Stores loaded Audio objects (implement later)
        this.loaded = false;
        this.promises = []; // To track loading promises
    }

    loadImage(name, path) {
        const promise = new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.images[name] = img;
                console.log(`Image loaded: ${name} (${path})`);
                resolve(img);
            };
            img.onerror = (err) => {
                console.error(`Failed to load image: ${name} (${path})`, err);
                // Resolve anyway so game doesn't break, but log error
                // Alternatively, reject(err) to halt loading on error
                resolve(null); // Resolve with null on error
            };
            img.src = path;
        });
        this.promises.push(promise);
    }

    loadAudio(name, path, loop = false) { // Added loop parameter
        const promise = new Promise((resolve, reject) => {
            const audio = new Audio();
            audio.oncanplaythrough = () => {
                this.audio[name] = audio;
                audio.loop = loop; // Set loop property
                console.log(`Audio loaded: ${name} (${path})`);
                resolve(audio);
            };
            audio.onerror = (err) => {
                console.error(`Failed to load audio: ${name} (${path})`, err);
                resolve(null); // Resolve with null on error
            };
            audio.src = path;
            audio.load(); // Important for some browsers
        });
        this.promises.push(promise);
    }

    async loadAll() {
        console.log("Starting asset loading...");
        // Define assets to load using names from required_assets.md
        this.loadImage('player', 'textures/player.png');
        // Obstacles
        this.loadImage('bird_pigeon', 'textures/bird_pigeon.png');
        this.loadImage('bird_crow', 'textures/bird_crow.png');
        // this.loadImage('bird_flamingo', 'textures/bird_flamingo.png'); // Example - add more as needed
        this.loadImage('plane_paper', 'textures/plane_paper.png');
        this.loadImage('plane_jet', 'textures/plane_jet.png');
        this.loadImage('plane_balloon', 'textures/plane_balloon.png');
        // Backgrounds
        this.loadImage('cloud_layer_1', 'textures/cloud_layer_1.png');
        this.loadImage('cloud_layer_2', 'textures/cloud_layer_2.png');
        this.loadImage('cloud_layer_3', 'textures/cloud_layer_3.png');
        // this.loadImage('sky_background', 'textures/sky_background.png'); // Optional sky image
        // Portal
        this.loadImage('portal', 'textures/portal.png');
        // UI/FX
        this.loadImage('milestone_flash_1k', 'textures/milestone_flash_1k.png');
        this.loadImage('milestone_flash_5k', 'textures/milestone_flash_5k.png');
        this.loadImage('milestone_flash_10k', 'textures/milestone_flash_10k.png');
        this.loadImage('milestone_flash_25k', 'textures/milestone_flash_25k.png');
        // this.loadImage('logo', 'textures/logo.png'); // Load logo later for watermark

        // Audio
        this.loadAudio('background_music', 'audio/background_loop.mp3', true);
        // Sound Effects (SFX) - loop is false by default
        this.loadAudio('sfx_hit', 'audio/sfx_hit_bounce.wav');
        this.loadAudio('sfx_milestone', 'audio/sfx_milestone_ping.wav');
        this.loadAudio('sfx_portal', 'audio/sfx_portal_warp.wav');
        this.loadAudio('sfx_snap_click', 'audio/sfx_snapshot_click.wav');
        this.loadAudio('sfx_snap_slowmo', 'audio/sfx_snapshot_slowmo.wav');
        // this.loadAudio('sfx_fall_whoosh', 'audio/sfx_whoosh_fall.wav'); // Add later if needed

        // Wait for all loading promises to complete
        await Promise.all(this.promises);

        this.loaded = true;
        console.log("All assets loaded (or failed gracefully).");
    }

    getImage(name) {
        return this.images[name] || null; // Return null if not found/loaded
    }

    getAudio(name) {
        return this.audio[name] || null;
    }

    // Helper to play a sound effect - handles potential errors and restarts if already playing
    playSound(name) {
        const sound = this.getAudio(name);
        if (sound) {
            sound.currentTime = 0; // Rewind to start
            sound.play().catch(e => console.error(`Error playing sound ${name}:`, e));
        } else {
            console.warn(`Sound effect not found or loaded: ${name}`);
        }
    }
}
