// Manages VibeShot feature for score screenshots and slow-motion effects in 3D

export class SnapshotManager {
    constructor(game) { // Game object reference (contains scene, renderer, etc.)
        this.game = game;
        this.active = false;
        this.slowMoDuration = 2000; // ms
        this.slowMoTimer = 0;
        this.slowMoFactor = 0.2; // Speed factor
    }

    trigger() {
        if (!this.active) {
            console.log("VibeShot triggered (3D)!");
            this.active = true;
            this.slowMoTimer = this.slowMoDuration;

            // Play sounds (Requires Assets manager refactoring first)
            // if (this.game.assets) {
            //     this.game.assets.playSound('sfx_snap_click');
            //     this.game.assets.playSound('sfx_snap_slowmo');
            // }

            // TODO: Trigger player pose animation if implemented
            // TODO: Trigger UI changes (e.g., show overlay) if implemented
        }
    }

    update(rawDeltaTime) { // Expects raw delta time (in seconds from THREE.Clock)
        if (this.active) {
            // Convert rawDeltaTime (seconds) to ms for timer comparison
            this.slowMoTimer -= (rawDeltaTime * 1000);
            if (this.slowMoTimer <= 0) {
                this.reset();
                this.captureScreen(); // Capture screen at the end
            }
        }
    }

    reset() {
        console.log("VibeShot reset (3D).");
        this.active = false;
        this.slowMoTimer = 0;
        // TODO: Reset player pose animation
        // TODO: Reset UI changes
    }

    // Returns the effective delta time (in seconds) considering slow-motion
    getEffectiveDeltaTime(rawDeltaTime) {
        return this.active ? rawDeltaTime * this.slowMoFactor : rawDeltaTime;
    }

    captureScreen() {
        console.log("Capturing WebGL screen...");
        // Option 1: Capture only WebGL canvas
        if (this.game.renderer) {
            try {
                const dataURL = this.game.renderer.domElement.toDataURL('image/png');
                // TODO: Add watermark to the dataURL or canvas before capture
                // TODO: Trigger download or display image
                console.log("Screenshot Data URL (first 100 chars):", dataURL.substring(0, 100));
                // Example download trigger:
                // const link = document.createElement('a');
                // link.download = 'skyfalldrop_snapshot.png';
                // link.href = dataURL;
                // link.click();
            } catch (e) {
                console.error("Error capturing WebGL canvas:", e);
            }
        }

        // Option 2: Use html2canvas (if installed) to capture canvas + HTML overlays
        // Requires installing html2canvas: npm install html2canvas
        // import html2canvas from 'html2canvas';
        // html2canvas(document.body).then(canvas => { // Or capture a specific container
        //     const dataURL = canvas.toDataURL('image/png');
        //     // TODO: Add watermark, trigger download/display
        //     console.log("html2canvas Screenshot Data URL:", dataURL.substring(0, 100));
        // });
    }
}
