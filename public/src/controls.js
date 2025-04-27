// Handles keyboard and touch input management

export class Controls {
    constructor() {
        this.left = false;
        this.right = false;
        this.initKeyboard();
        // this.initTouch(); // Initialize touch separately
    }

    initKeyboard() {
        window.addEventListener('keydown', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A': // Handle uppercase 'A' as well
                    this.left = true;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D': // Handle uppercase 'D' as well
                    this.right = true;
                    break;
            }
        });

        window.addEventListener('keyup', (e) => {
            switch (e.key) {
                case 'ArrowLeft':
                case 'a':
                case 'A':
                    this.left = false;
                    break;
                case 'ArrowRight':
                case 'd':
                case 'D':
                    this.right = false;
                    break;
            }
        });
    }

    // initTouch() will be implemented in controls-touch.js or handled later
}
