// Handles preloading and management of all game assets (images, audio)

export class Assets {
    constructor() {
        this.images = {};
        this.audio = {};
        this.loaded = false;
    }

    async load() {
        // Load all game assets
    }

    loadImage(name, path) {
        // Load individual image
    }

    loadAudio(name, path) {
        // Load individual audio file
    }
}
