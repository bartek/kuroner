/*
 * Create a camera around a display.
 *
 * Create a constrainted view around a specific region, and/or 
 * follow specific positions on the map.
 *
 * Example usage:
 *
 *  var gamejs = require('gamejs')
 *      , Camera = require('gramework/camera').Camera;
 *
 *  var surfaceWidth = 640
 *      , surfaceHeight = 480;
 *
 *  var display = gamejs.display.setMode([surfaceWidth, surfaceHeight]);
 *  var surface = new gamejs.Surface([surfaceWidth, surfaceHeight]);
 *  var camera = new Camera(surface, {
 *      width: surfaceWidth / 2,
 *      height: surfaceHeight / 2
 *  })
 *
 *  And, on tick:
 *
 *  var tick = function(msDuration) {
 *      camera.update(msDuration);
 *
 *      // Draw all your actors, backgrounds, etc on primary surface.
 *      display.clear()
 *      surface.blit(aBackground);
 *      actors.draw(surface);
 *
 *      // Then, given the camera has the surface which you've blitted
 *      // everything onto, it will create a constrained view of the surface, which
 *      // you can blit back onto the screen. Performance should be ideal.
 *      var view = camera.draw();
 *      display.blit(view);
 *  };
 */

var gamejs = require('gamejs');

/* Camera initialization.
 *
 * `surface`, an instance of gamejs.Surface.
 * `options`, a hash containing optional keys for `width` and `height`
 *      of the camera. As well as a `zoom` level (default: 1).
 *
 *
 */
var Camera = exports.Camera = function(surface, options) {
    this.width = options.width || 1024;
    this.height = options.height || 500;
    this.zoom = options.zoom || 1;
    this.rect = new gamejs.Rect([0,0], [this.width, this.height]);

    this.surface = surface;
    this.surfaceSize = this.surface.getSize();

    this.center = null;
    this.dest = null;
    this.xSpeed = 0;
    this.ySpeed = 0;
    this.zoom_multiplier = 1;
    this.targetZoom = null;
    this.sharp = options.sharp || true;

    // Our constrainted camera view
    this.view = new gamejs.Surface([this.width, this.height]);
    return this;
};

Camera.prototype.update = function(msDuration) {
    // Pan to dest
    if (this.dest !== null) {
        if (this.rect.center[0] < this.dest[0]) {this.rect.moveIp(this.xSpeed,0);}
        if (this.rect.center[0] > this.dest[0]) {this.rect.moveIp(this.xSpeed,0);}
        if (this.rect.center[1] < this.dest[1]) {this.rect.moveIp(0,this.ySpeed);}
        if (this.rect.center[1] > this.dest[1]) {this.rect.moveIp(0,this.ySpeed);}

        this.xSpeed = (this.dest[0] - this.rect.center[0]) / 10;
        this.ySpeed = (this.dest[1] - this.rect.center[1]) / 10;

        if (this.dest == this.rect.center) {
            this.dest = null;
            this.xSpeed = 0;
            this.ySpeed = 0;
        }
    }
    if (this.center !==null) {
        this.dest = this.center;
    }

    if (this.targetZoom !== null) {
        if (this.targetZoom > this.zoom) {
            this.zoom_multiplier = 1 + ((this.targetZoom - this.zoom) * 0.1);
        }
        if (this.targetZoom < this.zoom) {
            this.zoom_multiplier = 1 + ((this.targetZoom - this.zoom) * 0.1);
        }
        if (this.targetZoom == this.zoom) {
            this.targetZoom = null;
            this.zoom_multiplier = 1;
        }
    }

    if (this.rect.width <= this.surfaceSize[0] && this.rect.height <= this.surfaceSize[1]) {
        this.zoom = this.zoom * this.zoom_multiplier;
    }
    this.rect.width = this.width / this.zoom;
    this.rect.height = this.height / this.zoom;

    if (this.sharp) {
        this.rect.left = Math.round(this.rect.left);
        this.rect.top = Math.round(this.rect.top);
    }

    // The camera's extent cannot be bigger than the current surface's size
    if (this.rect.width > this.surfaceSize[0]) {
        this.rect.width = this.surfaceSize[0];
    }

    if (this.rect.height > this.surfaceSize[1]) {
        this.rect.height = this.surfaceSize[1];
    }

    // The camera cannot pan beyond the extents of the scene
    if (this.rect.top < 0) {
        this.rect.top = 0;
    }
    if (this.rect.left < 0) {
        this.rect.left = 0;
    }
    if (this.rect.bottom > this.surfaceSize[1]) {
        this.rect.bottom = this.surfaceSize[1];
    }
    if (this.rect.right > this.surfaceSize[0]) {
        this.rect.right = this.surfaceSize[0];
    }

    // Take our existing surface, and blit it onto our camera view. It'll scale
    // appropriately
    this.view.blit(this.surface, [0, 0], this.rect);
    return;
};

Camera.prototype.draw = function() {
    return this.view;
};

Camera.prototype.panTo = function(pos) {
    this.dest = pos;
    return;
};

Camera.prototype.follow = function(pos) {
    this.center = pos;
    return;
};

Camera.prototype.unfollow = function() {
    this.center = null;
    return;
};

Camera.prototype.zoomTo = function(zoom) {
    this.targetZoom = zoom;
    return;
};
