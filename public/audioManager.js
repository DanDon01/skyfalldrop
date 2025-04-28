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
        
        // Track if audio is initialized
        this.initialized = false;
        
        // Load sound effects with correct paths
        this.loadSounds();
    }
    
    loadSounds() {
        // Create audio loader
        const audioLoader = new THREE.AudioLoader();
        
        // Helper function to load sound with fallback and synthetic sound generation
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
                },
                // Show progress
                (xhr) => {
                    console.log(`${filename}: ${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
                },
                // Error handler
                (error) => {
                    console.error(`Error loading sound file: ${filename}`, error);
                    
                    // For collision sound specifically, create a synthetic replacement
                    if (soundKey === 'collision') {
                        this.createFallbackCollisionSound();
                    }
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
    
    // Initialize audio after user interaction
    initializeAudio() {
        if (this.initialized) return;
        
        console.log("Initializing audio after user interaction");
        this.initialized = true;
        
        // Create synthetic sounds for all sounds by default
        // This ensures we always have sounds even if the MP3s don't load
        this.createSyntheticSounds();
        
        // Resume the audio context explicitly (crucial for Chrome/Safari)
        if (this.listener && this.listener.context && 
            this.listener.context.state === 'suspended') {
            console.log("Resuming suspended AudioContext...");
            this.listener.context.resume().then(() => {
                console.log("AudioContext resumed successfully");
                this.startAudioAfterContextResumed();
            }).catch(err => {
                console.error("Failed to resume AudioContext:", err);
            });
        } else {
            // Context already running or not available
            console.log("AudioContext already active or unavailable");
            this.startAudioAfterContextResumed();
        }
        
        // Create a small UI indicator that sound is now on
        this.showSoundIndicator();
    }
    
    // Separate method to start audio after context is ready
    startAudioAfterContextResumed() {
        // Small delay to ensure context is fully ready
        setTimeout(() => {
            try {
                console.log("Playing background and wind sounds...");
                this.playBackgroundMusic();
                this.startWindSound();
                
                // Play test sound - very brief and quiet
                const testSound = this.sounds.score;
                if (testSound && testSound.buffer) {
                    const originalVolume = testSound.getVolume();
                    testSound.setVolume(0.1); // Very quiet test sound
                    testSound.play();
                    
                    // Restore original volume after playing
                    setTimeout(() => {
                        testSound.setVolume(originalVolume);
                    }, 100);
                }
            } catch (e) {
                console.error("Error starting audio:", e);
            }
        }, 500);
    }
    
    // UI indicator in a separate method
    showSoundIndicator() {
        const soundIndicator = document.createElement('div');
        soundIndicator.textContent = '🔊 Sound On';
        soundIndicator.style.position = 'fixed';
        soundIndicator.style.top = '10px';
        soundIndicator.style.right = '10px';
        soundIndicator.style.backgroundColor = 'rgba(0,0,0,0.5)';
        soundIndicator.style.color = 'white';
        soundIndicator.style.padding = '5px 10px';
        soundIndicator.style.borderRadius = '5px';
        soundIndicator.style.fontSize = '14px';
        soundIndicator.style.zIndex = '1000';
        soundIndicator.style.opacity = '1';
        soundIndicator.style.transition = 'opacity 0.5s ease-in-out';
        
        document.body.appendChild(soundIndicator);
        
        // Fade out the indicator after 3 seconds
        setTimeout(() => {
            soundIndicator.style.opacity = '0';
            setTimeout(() => {
                if (soundIndicator.parentNode) {
                    document.body.removeChild(soundIndicator);
                }
            }, 500);
        }, 3000);
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
    
    // Add this method to synthesize a fallback collision sound
    createFallbackCollisionSound() {
        console.log("Creating fallback collision sound");
        
        // Create audio context from listener
        const audioContext = this.listener.context;
        
        // Create a short buffer - 0.3 seconds at sample rate (typically 44100 or 48000 Hz)
        const sampleRate = audioContext.sampleRate;
        const duration = 0.3;
        const bufferSize = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
        
        // Get channel data to manipulate
        const data = buffer.getChannelData(0);
        
        // Create a percussive hit sound
        for (let i = 0; i < bufferSize; i++) {
            // Time from 0 to 1
            const t = i / bufferSize;
            
            // Exponential decay
            const envelope = Math.exp(-10 * t);
            
            // Oscillator sound with some noise
            const oscillator = Math.sin(2 * Math.PI * 440 * t * (1 - t)) * envelope;
            const noise = (Math.random() * 2 - 1) * envelope * 0.1;
            
            // Mix oscillator and noise
            data[i] = oscillator + noise;
        }
        
        // Set this buffer on the collision sound
        if (this.sounds.collision) {
            this.sounds.collision.setBuffer(buffer);
            this.sounds.collision.setVolume(0.4 * this.masterVolume);
        }
    }
    
    // Add methods to create synthetic fallbacks for all sounds
    createSyntheticSounds() {
        console.log("Creating synthetic sounds for all audio");
        
        // Create versions of all sounds
        this.createFallbackCollisionSound();
        this.createFallbackPortalSound();
        this.createFallbackScoreSound();
        this.createFallbackWindSound();
        this.createFallbackBackgroundMusic();
    }
    
    // Add synthetic versions of all sounds
    createFallbackPortalSound() {
        console.log("Creating synthetic portal sound");
        const audioContext = this.listener.context;
        const sampleRate = audioContext.sampleRate;
        const duration = 1.0;
        const bufferSize = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Create a rising "warp" sound
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            // Rising frequency sweep
            const freq = 200 + 600 * t * t;
            const sound = Math.sin(2 * Math.PI * freq * t);
            // Add some modulation
            const mod = Math.sin(2 * Math.PI * 8 * t);
            // Envelope shape
            const envelope = Math.sin(Math.PI * t);
            
            data[i] = sound * envelope * (1 + 0.2 * mod);
        }
        
        if (this.sounds.portal) {
            this.sounds.portal.setBuffer(buffer);
            this.sounds.portal.setVolume(0.6 * this.masterVolume);
        }
    }
    
    createFallbackScoreSound() {
        console.log("Creating synthetic score sound");
        const audioContext = this.listener.context;
        const sampleRate = audioContext.sampleRate;
        const duration = 0.5;
        const bufferSize = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Create a bell-like "ding" sound
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            // Bell-like frequencies
            const freq1 = 880; // High A
            const freq2 = 1320; // High E
            
            const sound1 = Math.sin(2 * Math.PI * freq1 * t);
            const sound2 = Math.sin(2 * Math.PI * freq2 * t);
            
            // Bell-like decay
            const envelope = Math.pow(1 - t, 1.5);
            
            data[i] = (sound1 * 0.6 + sound2 * 0.4) * envelope;
        }
        
        if (this.sounds.score) {
            this.sounds.score.setBuffer(buffer);
            this.sounds.score.setVolume(0.3 * this.masterVolume);
        }
    }
    
    createFallbackWindSound() {
        console.log("Creating synthetic wind sound");
        const audioContext = this.listener.context;
        const sampleRate = audioContext.sampleRate;
        // Longer duration for a looping sound
        const duration = 3.0;
        const bufferSize = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Create filtered noise that sounds like wind
        for (let i = 0; i < bufferSize; i++) {
            const t = i / bufferSize;
            
            // Base white noise
            let noise = Math.random() * 2 - 1;
            
            // Filter the noise to make it sound more like wind
            // Using a simple IIR filter approach
            if (i > 0) noise = noise * 0.3 + data[i-1] * 0.7;
            
            // Add some periodic modulation to make it sound more natural
            const mod1 = Math.sin(2 * Math.PI * 0.1 * t);
            const mod2 = Math.sin(2 * Math.PI * 0.3 * t);
            
            // Combine noise with modulation
            data[i] = noise * (0.7 + 0.3 * mod1 + 0.1 * mod2);
        }
        
        if (this.sounds.wind) {
            this.sounds.wind.setBuffer(buffer);
            this.sounds.wind.setVolume(0.2 * this.masterVolume);
            this.sounds.wind.setLoop(true);
        }
    }
    
    createFallbackBackgroundMusic() {
        console.log("Creating synthetic background music");
        const audioContext = this.listener.context;
        const sampleRate = audioContext.sampleRate;
        // Longer duration for background music
        const duration = 8.0;
        const bufferSize = sampleRate * duration;
        const buffer = audioContext.createBuffer(1, bufferSize, sampleRate);
        const data = buffer.getChannelData(0);
        
        // Create a simple ambient pad sound
        // Define a simple chord progression
        const chords = [
            [261.63, 329.63, 392.00], // C major
            [293.66, 349.23, 440.00], // D minor
            [261.63, 329.63, 392.00], // C major
            [246.94, 311.13, 392.00]  // B diminished
        ];
        
        const chordDuration = duration / chords.length;
        const samplesPerChord = bufferSize / chords.length;
        
        for (let chordIndex = 0; chordIndex < chords.length; chordIndex++) {
            const chord = chords[chordIndex];
            const startSample = Math.floor(chordIndex * samplesPerChord);
            const endSample = Math.floor((chordIndex + 1) * samplesPerChord);
            
            // Create smooth transition between chords
            for (let i = startSample; i < endSample; i++) {
                const t = (i - startSample) / (endSample - startSample);
                
                // Crossfade between chords
                let sample = 0;
                
                // Add each note in the chord
                for (const note of chord) {
                    sample += Math.sin(2 * Math.PI * note * (i / sampleRate)) * 0.1;
                }
                
                // Add some modulation
                const mod = Math.sin(2 * Math.PI * 0.25 * (i / sampleRate));
                
                // Envelope with fade in/out for each chord
                const fadeTime = 0.2;
                let envelope = 1.0;
                
                if (t < fadeTime) {
                    envelope = t / fadeTime; // Fade in
                } else if (t > (1.0 - fadeTime)) {
                    envelope = (1.0 - t) / fadeTime; // Fade out
                }
                
                data[i] = sample * envelope * (0.8 + 0.2 * mod);
            }
        }
        
        if (this.sounds.background) {
            this.sounds.background.setBuffer(buffer);
            this.sounds.background.setVolume(0.15 * this.masterVolume);
            this.sounds.background.setLoop(true);
        }
    }
} 