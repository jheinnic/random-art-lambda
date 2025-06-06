export class CanvasPixelPainter {
    canvas;
    context;
    finished = false;
    constructor(canvas) {
        this.canvas = canvas;
        this.context = canvas.getContext("2d", { alpha: false, pixelFormat: 'RGB24' });
        if (this.context === null) {
            throw new Error("Canvas failed to return a 2D context object?");
        }
    }
    paint(pixelX, pixelY, color) {
        if (this.finished) {
            throw new Error("Already done painting");
        }
        this.context.fillStyle = color;
        this.context.fillRect(pixelX, pixelY, 1, 1);
    }
    finish() {
        this.finished = true;
    }
    isDone() {
        return this.finished;
    }
    getCanvas() {
        if (!this.finished) {
            throw new Error("Not finished painting yet.  Try again later.");
        }
        this.canvas.toBuffer();
        return this.canvas;
    }
}
//# sourceMappingURL=CanvasPixelPainter.js.map