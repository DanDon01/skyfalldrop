// Manages HTML overlay UI elements

export class UI {
    constructor() {
        // Select HTML elements
        this.scoreElement = document.getElementById('score-display');
        this.messageArea = document.getElementById('message-area');
        this.snapshotButton = document.getElementById('snapshot-button');

        this.messages = []; // Stores { element, timer }
        this.messageDuration = 2000; // Default duration in ms
        this.snapshotManager = null;

        this.init();
    }

    init() {
        if (!this.scoreElement || !this.messageArea || !this.snapshotButton) {
            console.error("UI elements not found in the DOM!");
            return;
        }

        // Add event listener for the snapshot button
        this.snapshotButton.addEventListener('click', () => {
            if (this.snapshotManager) {
                this.snapshotManager.trigger();
            } else {
                console.warn("Snapshot manager not linked to UI button.");
            }
        });

        console.log("HTML UI Initialized.");
    }

    // Link to the snapshot manager (called from main.js)
    setSnapshotManager(manager) {
        this.snapshotManager = manager;
    }

    showMessage(text, duration = this.messageDuration) {
        if (!this.messageArea) return;

        // Create a new element for the message
        const messageElement = document.createElement('div');
        messageElement.textContent = text;
        // Add basic styling or classes if needed
        // messageElement.style.opacity = '1';
        // messageElement.style.transition = 'opacity 0.5s ease-out';

        this.messageArea.appendChild(messageElement);

        const timer = setTimeout(() => {
            // Fade out effect (optional)
            // messageElement.style.opacity = '0';
            // setTimeout(() => {
            if (messageElement.parentNode === this.messageArea) {
                 this.messageArea.removeChild(messageElement);
            }
            // }, 500); // Match fade-out duration

            // Remove from internal tracking if needed (not strictly necessary with setTimeout)
        }, duration);

        // Store message data if more complex management is needed later
        // this.messages.push({ element: messageElement, timerId: timer });
    }

    update(deltaTime) {
        // No canvas drawing needed here anymore
        // Message timers are handled by setTimeout in showMessage
    }

    updateScore(newScore) {
        if (this.scoreElement) {
            this.scoreElement.innerText = `Score: ${newScore}`;
        }
    }

    // No render method needed for HTML elements
    // destroy() method could be added to remove listeners if necessary
}
