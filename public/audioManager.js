import * as THREE from 'https://unpkg.com/three@0.160.0/build/three.module.js';

export class AudioManager {
    constructor() {
        // Create audio listener
        this.listener = new THREE.AudioListener();
        
        // Create audio loader as a class property
        this.audioLoader = new THREE.AudioLoader();
        
        // Sound effects library
        this.sounds = {
            collision: null,
            portal: null,
            score: null,
            wind: null
        };
        
        // Master volume
        this.masterVolume = 0.7;
        
        // Track if audio is initialized
        this.initialized = false;
        
        // Array to hold all collision sound effects
        this.collisionSounds = [];
        
        // Background music tracks
        this.backgroundTracks = [];
        this.currentBackgroundTrack = 0;
        this.backgroundMusicEnabled = true;
        
        // Load sound effects with correct paths
        this.loadSounds();
        
        // Load multiple collision sounds
        this.loadCollisionSounds();
    }
    
    loadSounds() {
        // Helper function to load sound with fallback and synthetic sound generation
        const loadSoundWithFallback = (soundKey, filename, volume, loop = false) => {
            this.sounds[soundKey] = new THREE.Audio(this.listener);
            
            this.audioLoader.load(
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
                    
                    // Create fallback sound appropriate for the sound type
                    switch(soundKey) {
                        case 'collision':
                            this.createFallbackCollisionSound();
                            break;
                        case 'portal':
                            this.createFallbackPortalSound();
                            break;
                        case 'score':
                            this.createFallbackScoreSound();
                            break;
                        case 'wind':
                            this.createFallbackWindSound();
                            break;
                    }
                }
            );
        };
        
        // Load actual audio files from the audio folder
        loadSoundWithFallback('portal', 'audio/sfx_portal_warp.mp3', 0.7);
        loadSoundWithFallback('score', 'audio/sfx_milestone_ping.mp3', 0.4);
        loadSoundWithFallback('wind', 'audio/sfx_snapshot_slowmo.mp3', 0.3, true);
        
        // Load the background music separately
        this.loadBackgroundMusic();
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
        // Only use the new random oof sounds
        if (this.collisionSounds.length > 0) {
            this.playRandomCollisionSound();
        } else {
            // If no oof sounds loaded yet, create and play a synthetic collision sound
            if (!this.sounds.collision || !this.sounds.collision.buffer) {
                this.createFallbackCollisionSound();
            }
            
            if (this.sounds.collision && this.sounds.collision.buffer) {
                this.sounds.collision.play();
            }
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
        if (!this.backgroundMusicEnabled) return;
        
        if (this.backgroundTracks.length > 0) {
            // Use our new track system
            const currentTrack = this.backgroundTracks[this.currentBackgroundTrack];
            if (currentTrack && !currentTrack.isPlaying) {
                console.log(`Starting background music with track ${this.currentBackgroundTrack + 1}`);
                currentTrack.play();
            }
        } else if (this.sounds.background) {
            // Fallback to the old system if no tracks are loaded
            if (!this.sounds.background.isPlaying) {
                this.sounds.background.play();
            }
        } else {
            // Last resort - create synthetic music
            this.createFallbackBackgroundMusic();
            if (this.sounds.background && !this.sounds.background.isPlaying) {
                this.sounds.background.play();
            }
        }
    }
    
    pauseBackgroundMusic() {
        if (this.backgroundTracks.length > 0) {
            // Use our new track system
            const currentTrack = this.backgroundTracks[this.currentBackgroundTrack];
            if (currentTrack && currentTrack.isPlaying) {
                currentTrack.pause();
            }
        } else if (this.sounds.background && this.sounds.background.isPlaying) {
            // Fallback to the old system
            this.sounds.background.pause();
        }
    }
    
    stopBackgroundMusic() {
        this.backgroundMusicEnabled = false;
        
        if (this.backgroundTracks.length > 0) {
            // Use our new track system
            this.backgroundTracks.forEach(track => {
                if (track && track.isPlaying) track.stop();
            });
        } else if (this.sounds.background && this.sounds.background.isPlaying) {
            // Fallback to the old system
            this.sounds.background.stop();
        }
    }
    
    resumeBackgroundMusic() {
        this.backgroundMusicEnabled = true;
        this.playBackgroundMusic();
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
    
    // Load multiple collision sounds
    loadCollisionSounds() {
        const soundCount = 8; // We have 8 sounds (oof1.mp3 to oof8.mp3)
        
        for (let i = 1; i <= soundCount; i++) {
            const soundFile = `audio/oof${i}.mp3`; // Use MP3 format
            
            this.audioLoader.load(
                soundFile,
                (buffer) => {
                    this.collisionSounds.push(buffer);
                    console.log(`Loaded collision sound ${i}/${soundCount}`);
                },
                (xhr) => {
                    // Loading progress if needed
                },
                (error) => {
                    console.error(`Error loading collision sound ${i}:`, error);
                }
            );
        }
    }
    
    // Method to play a random collision sound
    playRandomCollisionSound() {
        if (!this.initialized || this.collisionSounds.length === 0) {
            return; // No sounds loaded yet
        }
        
        // Pick a random sound from the array
        const randomIndex = Math.floor(Math.random() * this.collisionSounds.length);
        const soundBuffer = this.collisionSounds[randomIndex];
        
        // Play the sound
        const sound = new THREE.Audio(this.listener);
        sound.setBuffer(soundBuffer);
        sound.setVolume(0.5); // Adjust volume as needed
        sound.play();
    }
    
    // Update the playSoundEffect method to handle missing collision sound
    playSoundEffect(soundKey) {
        // If trying to play the 'hit' sound, use the collision sound instead
        if (soundKey === 'hit') {
            this.playCollisionSound();
            return;
        }
        
        // Play the requested sound if it exists
        const sound = this.sounds[soundKey];
        if (sound && sound.buffer && !sound.isPlaying) {
            sound.play();
        }
    }
    
    // Add a method to load the background music tracks
    loadBackgroundMusic() {
        console.log("Loading background music tracks...");
        
        const tracks = [
            { file: 'audio/bgmusic1.mp3', volume: 0.3 },
            { file: 'audio/bgmusic2.mp3', volume: 0.3 }
        ];
        
        tracks.forEach((track, index) => {
            const sound = new THREE.Audio(this.listener);
            
            this.audioLoader.load(
                track.file,
                (buffer) => {
                    sound.setBuffer(buffer);
                    sound.setVolume(track.volume * this.masterVolume);
                    sound.onEnded = () => this.playNextBackgroundTrack();
                    
                    this.backgroundTracks.push(sound);
                    console.log(`Loaded background track ${index + 1}: ${track.file}`);
                    
                    // If this is the first track and no music is playing, start it
                    if (index === 0 && this.backgroundMusicEnabled && 
                        this.backgroundTracks.length === 1) {
                        setTimeout(() => this.playBackgroundMusic(), 500);
                    }
                },
                (xhr) => {
                    console.log(`${track.file}: ${(xhr.loaded / xhr.total * 100).toFixed(0)}% loaded`);
                },
                (error) => {
                    console.error(`Error loading background track: ${track.file}`, error);
                    // Fall back to synthetic music if loading fails
                    if (this.backgroundTracks.length === 0) {
                        this.createFallbackBackgroundMusic();
                    }
                }
            );
        });
    }
    
    // Create a method to play the next track in sequence
    playNextBackgroundTrack() {
        if (!this.backgroundMusicEnabled || this.backgroundTracks.length === 0) return;
        
        // Stop the current track if it's playing
        const currentTrack = this.backgroundTracks[this.currentBackgroundTrack];
        if (currentTrack && currentTrack.isPlaying) {
            currentTrack.stop();
        }
        
        // Move to the next track
        this.currentBackgroundTrack = (this.currentBackgroundTrack + 1) % this.backgroundTracks.length;
        
        // Play the new current track
        const nextTrack = this.backgroundTracks[this.currentBackgroundTrack];
        if (nextTrack && nextTrack.buffer) {
            console.log(`Playing background track ${this.currentBackgroundTrack + 1}`);
            nextTrack.play();
        }
    }
} 