// Manages all UI elements including score display and milestone notifications

export class UI {
    constructor(canvas) {
        this.canvas = canvas;
        this.score = 0; // Store the current score
        this.messages = []; // For later use
        // Basic styling for score display
        this.scoreFont = '24px sans-serif'; // Default font, update later
        this.scoreColor = 'white';
        this.scorePosition = { x: 20, y: 40 };
        // Styling for messages
        this.messageFont = '30px sans-serif'; // Example font
        this.messageColor = 'yellow';
        this.messageDuration = 2000;
        // Snapshot Button properties
        this.snapButton = {
            x: 0, // Positioned dynamically in resize
            y: 0,
            width: 80,
            height: 40,
            text: "SNAP",
            font: '18px sans-serif',
            color: 'rgba(255, 255, 255, 0.7)',
            hoverColor: 'rgba(255, 255, 255, 1.0)',
            visible: true, // Button appears early
            isHovering: false
        };
        this.snapshotManager = null; // Reference to snapshot manager
        this.boundHandleClick = this.handleClick.bind(this); // Bind click handler
        this.init();
    }

    init() {
        this.resizeButton(); // Initial positioning
        this.canvas.addEventListener('click', this.boundHandleClick);
        // Add touch listener later if needed, mapping touch to click logic
        // this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this));

        // Optional: Add hover effect listener
        // this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    }

    // Called when the main game resizes
    resizeButton() {
        // Position button e.g., bottom-right corner
        this.snapButton.x = this.canvas.width - this.snapButton.width - 20;
        this.snapButton.y = this.canvas.height - this.snapButton.height - 20;
    }

    // Link to the snapshot manager
    setSnapshotManager(manager) {
        this.snapshotManager = manager;
    }

    showMessage(text, duration = this.messageDuration) {
        this.messages.push({
            text: text,
            timer: duration
        });
    }

    update(deltaTime) { // Add update method to handle message timers
        // Update message timers and remove expired messages
        for (let i = this.messages.length - 1; i >= 0; i--) {
            this.messages[i].timer -= deltaTime;
            if (this.messages[i].timer <= 0) {
                this.messages.splice(i, 1);
            }
        }
    }

    updateScore(newScore) {
        this.score = newScore;
    }

    // Check if pointer coordinates are inside the button
    isPointerInsideButton(x, y) {
        const btn = this.snapButton;
        return (
            btn.visible &&
            x >= btn.x &&
            x <= btn.x + btn.width &&
            y >= btn.y &&
            y <= btn.y + btn.height
        );
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        if (this.isPointerInsideButton(clickX, clickY)) {
            console.log("Snap button clicked!");
            if (this.snapshotManager) {
                this.snapshotManager.trigger();
            }
        }
    }

    // handleMouseMove(event) { ... implement hover logic ... }

    render(ctx) {
        // Render the score
        ctx.font = this.scoreFont;
        ctx.fillStyle = this.scoreColor;
        ctx.textAlign = 'left'; // Align text to the left
        ctx.textBaseline = 'top'; // Align text from the top
        ctx.fillText(`Score: ${this.score}`, this.scorePosition.x, this.scorePosition.y);

        // Render active messages (e.g., centered below score)
        ctx.font = this.messageFont;
        ctx.fillStyle = this.messageColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        this.messages.forEach((msg, index) => {
            // Simple vertical stacking for multiple messages
            const yPos = this.scorePosition.y + 60 + (index * 40);
            // Optional: Add fade effect based on timer?
            // ctx.globalAlpha = Math.min(1, msg.timer / 500);
            ctx.fillText(msg.text, this.canvas.width / 2, yPos);
            // ctx.globalAlpha = 1.0;
        });

        // Render active messages... (code omitted for brevity) ...

        // Render Snapshot Button
        if (this.snapButton.visible) {
            const btn = this.snapButton;
            ctx.fillStyle = btn.isHovering ? btn.hoverColor : btn.color;
            ctx.fillRect(btn.x, btn.y, btn.width, btn.height);

            ctx.font = btn.font;
            ctx.fillStyle = 'black';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(btn.text, btn.x + btn.width / 2, btn.y + btn.height / 2);
        }
    }

    // Clean up listeners if UI is ever destroyed
    destroy() {
        this.canvas.removeEventListener('click', this.boundHandleClick);
        // Remove other listeners if added
    }
}
