import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class AudioManager {
    constructor() {
        // Create audio listener
        this.listener = new THREE.AudioListener();
        
        // Sound effects library
        this.sounds = {
            collision: null,
            portal: null,
            score: null,
            wind: null,
            background: null
        };
        
        // Master volume
        this.masterVolume = 0.7;
        
        // Load sound effects with correct paths
        this.loadSounds();
        
        // Play background music
        this.playBackgroundMusic();
    }
    
    loadSounds() {
        // Create audio loader
        const audioLoader = new THREE.AudioLoader();
        
        // Helper function to load sound with error handling
        const loadSoundWithFallback = (soundKey, filename, volume, loop = false) => {
            this.sounds[soundKey] = new THREE.Audio(this.listener);
            
            audioLoader.load(
                filename,
                (buffer) => {
                    // Success - set the buffer
                    this.sounds[soundKey].setBuffer(buffer);
                    this.sounds[soundKey].setVolume(volume * this.masterVolume);
                    if (loop) {
                        this.sounds[soundKey].setLoop(true);
                    }
                    console.log(`Loaded sound: ${filename}`);
                    
                    // Auto-play looping sounds
                    if (loop && (soundKey === 'wind' || soundKey === 'background')) {
                        this.sounds[soundKey].play();
                    }
                },
                // Show progress
                (xhr) => {
                    console.log(`${filename}: ${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
                },
                // Error handler
                (error) => {
                    console.error(`Error loading sound file: ${filename}`, error);
                }
            );
        };
        
        // Load actual audio files from the audio folder
        loadSoundWithFallback('collision', 'audio/sfx_hit_bounce.mp3', 0.5);
        loadSoundWithFallback('portal', 'audio/sfx_portal_warp.mp3', 0.7);
        loadSoundWithFallback('score', 'audio/sfx_milestone_ping.mp3', 0.4);
        loadSoundWithFallback('wind', 'audio/sfx_snapshot_slowmo.mp3', 0.3, true);
        loadSoundWithFallback('background', 'audio/background_loop.mp3', 0.3, true);
    }
    
    // Play specific sound effects
    playCollisionSound() {
        if (this.sounds.collision && !this.sounds.collision.isPlaying) {
            this.sounds.collision.play();
        }
    }
    
    playPortalSound() {
        if (this.sounds.portal && !this.sounds.portal.isPlaying) {
            this.sounds.portal.play();
        }
    }
    
    playScoreSound() {
        if (this.sounds.score && !this.sounds.score.isPlaying) {
            this.sounds.score.play();
        }
    }
    
    // Start/stop wind sound
    startWindSound() {
        if (this.sounds.wind && !this.sounds.wind.isPlaying) {
            this.sounds.wind.play();
        }
    }
    
    stopWindSound() {
        if (this.sounds.wind && this.sounds.wind.isPlaying) {
            this.sounds.wind.stop();
        }
    }
    
    // Background music control
    playBackgroundMusic() {
        if (this.sounds.background && !this.sounds.background.isPlaying) {
            this.sounds.background.play();
        }
    }
    
    pauseBackgroundMusic() {
        if (this.sounds.background && this.sounds.background.isPlaying) {
            this.sounds.background.pause();
        }
    }
    
    // Volume control
    setMasterVolume(volume) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
        
        // Update all sound volumes
        for (const sound in this.sounds) {
            if (this.sounds[sound]) {
                // Different sounds have different relative volumes
                switch (sound) {
                    case 'collision':
                        this.sounds[sound].setVolume(0.5 * this.masterVolume);
                        break;
                    case 'portal':
                        this.sounds[sound].setVolume(0.7 * this.masterVolume);
                        break;
                    case 'score':
                        this.sounds[sound].setVolume(0.4 * this.masterVolume);
                        break;
                    case 'wind':
                        this.sounds[sound].setVolume(0.3 * this.masterVolume);
                        break;
                    case 'background':
                        this.sounds[sound].setVolume(0.3 * this.masterVolume);
                        break;
                }
            }
        }
    }
    
    // Add listener to camera
    addListenerToCamera(camera) {
        camera.add(this.listener);
    }
} 