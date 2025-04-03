// Manages parallax scrolling sky background with multiple cloud layers

// Define layer properties: image name and relative speed (higher = faster)
const LAYER_CONFIG = [
    { name: 'cloud_layer_1', speed: 0.2 },
    { name: 'cloud_layer_2', speed: 0.5 },
    { name: 'cloud_layer_3', speed: 1.0 },
    // Add 'sky_background' here if using an image, likely with speed 0 or very slow
];

export class Background {
    constructor(canvas, assets) { // Added assets parameter
        this.canvas = canvas;
        this.assets = assets;
        this.layers = [];
        this.initLayers();
    }

    initLayers() {
        LAYER_CONFIG.forEach(config => {
            const image = this.assets.getImage(config.name);
            if (image) {
                this.layers.push({
                    image: image,
                    speed: config.speed,
                    y: 0, // Initial y position
                    height: image.height // Store height for wrapping calculation
                });
            } else {
                console.warn(`Background layer image not found: ${config.name}`);
            }
        });
        // Sort layers by speed so slower layers are drawn first (further back)
        this.layers.sort((a, b) => a.speed - b.speed);
    }

    update(deltaTime, gameSpeed = 5) { // Use gameSpeed (like player's base fall speed) for reference
        this.layers.forEach(layer => {
            // Move layer based on its speed relative to game speed
            layer.y += layer.speed * gameSpeed * (deltaTime / 16.67); // Normalize speed based on 60fps

            // Wrap layer vertically for seamless scrolling
            // Use layer image height for wrapping calculation
            if (layer.y >= layer.height) {
                layer.y = 0;
            }
        });
    }

    render(ctx) {
        // Render background layers from back to front
        this.layers.forEach(layer => {
            // Calculate scale factor to fit width (maintains aspect ratio)
            const scale = this.canvas.width / layer.image.width;
            const scaledHeight = layer.image.height * scale;

            // Draw the image twice vertically to cover the screen during wrap-around
            ctx.drawImage(layer.image, 0, layer.y, this.canvas.width, scaledHeight);
            // Draw the second copy above the first one
            ctx.drawImage(layer.image, 0, layer.y - scaledHeight, this.canvas.width, scaledHeight);

             // If layer.y is positive, a third draw might be needed below the second one
             // to cover the bottom edge fully during the wrap.
             if (layer.y > 0) {
                 ctx.drawImage(layer.image, 0, layer.y + scaledHeight, this.canvas.width, scaledHeight);
             }
        });
    }
}
