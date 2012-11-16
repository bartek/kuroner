var gamejs = require('gamejs');

// A class to allow the player to control their character.
var GameController = exports.GameController = function(player) {
    this.player = player;
    this.direction = null;

    this.up = this.down = this.left = this.right  = false;

    this.handle = function(event) {
        if (event.type === gamejs.event.KEY_DOWN) {
            if (event.key === gamejs.event.K_LEFT) {
                this.left = true;
            } else if (event.key === gamejs.event.K_RIGHT) {
                this.right = true;
            } else if (event.key === gamejs.event.K_UP) {
                this.up = true;
            } else if (event.key === gamejs.event.K_SPACE) {
                this.space = true;
            } else if (event.key === gamejs.event.K_r) {
                this.r = true;
            } else if (event.key === gamejs.event.K_SHIFT) {
                this.shift = true;
            } else {
                console.debug(event.key);
            }
        } else if (event.type === gamejs.event.KEY_UP) {
            if (event.key === gamejs.event.K_LEFT) {
                this.left = false;
            } else if (event.key === gamejs.event.K_RIGHT) {
                this.right = false;
            } else if (event.key === gamejs.event.K_UP) {
                this.up = false;
            } else if (event.key === gamejs.event.K_SPACE) {
                this.space = false;
            } else if (event.key === gamejs.event.K_r) {
                this.r = false;
            } else if (event.key === gamejs.event.K_SHIFT) {
                this.shift = false;
            } else {
                console.debug(event.key);
            }
        }
    }

    // Get the angle depending on the keys currently pressed.
    this.angle = function() {
        if (this.down && this.left) {
            return Math.PI - (Math.PI * 0.25);
        } else if (this.down && this.right) {
            return Math.PI * 0.25;
        } else if (this.down) {
            return Math.PI * 0.5;
        } else  if (this.left) {
            return Math.PI;
        } else if (this.right) {
            return 0;
        }
    }

    this.isRunning = function() {
        if (this.left || this.right) {
            return true;
        }
        return false;
    }

    this.isGrabbing = function() {
        if (this.shift) {
            return true;
        }
        return false;
    }

    this.jumped = function() {
        if (this.space) {
            return true;
        }
        return false;
    }

    this.climb = function() {
        if (this.up) {
            return true;
        }
        return false;
    }

    this.reset = function() {
        if (this.r) {
            return true;
        }
        return false;
    }

    return this;

}
