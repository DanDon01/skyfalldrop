export class TouchControls {
    constructor(canvas) {
        this.canvas = canvas;
        this.left = false;
        this.right = false;
        this.touchStartX = 0;
        this.init();
    }

    init() {
        this.canvas.addEventListener('touchstart', (e) => this.handleTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.handleTouchMove(e));
        this.canvas.addEventListener('touchend', () => this.handleTouchEnd());
    }

    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.touchStartX = touch.clientX;
        this.updateDirection(touch.clientX);
    }

    handleTouchMove(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.updateDirection(touch.clientX);
    }

    handleTouchEnd() {
        this.left = false;
        this.right = false;
    }

    updateDirection(touchX) {
        const halfWidth = this.canvas.width / 2;
        this.left = touchX < halfWidth;
        this.right = touchX >= halfWidth;
    }
}
