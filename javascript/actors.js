var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');

var Unit = exports.Unit = function(pos, image, isPlayer) {
    Unit.superConstructor.apply(this, arguments);

    this.speed = 100;

    this.gravity = 2;
    this.jump = 50;

    this.canJump = true;
    this.angle = null;
    this.jumped = false;

    this.origImage = image;
    var imgSize = this.origImage.getSize();

    this.image = new gamejs.Surface(imgSize);
    this.image.blit(this.origImage);

    this.rect = new gamejs.Rect(pos, imgSize)

    return this;
};
objects.extend(Unit, gamejs.sprite.Sprite);

Unit.prototype.update = function(msDuration, map) {
    // Check that this sprites group is not colliding with the map
    var colliding = false;
    gamejs.sprite.groupCollide(this.groups[0], map.collisionable).forEach(function(collision) {
        colliding = true;
        });

    // moveIp = move in place
    if (this.angle !== null) {
        this.rect.moveIp(
            Math.cos(this.angle) * this.speed * (msDuration / 1000),
            Math.sin(this.angle) * this.speed * (msDuration / 1000)
        );
    }

    // Play with gravity.
    if (colliding) {
        return;
    }

    if (this.rect.y < 800) {
        this.rect.moveIp(
            0, 
            Math.sin(Math.PI * 0.5) * this.speed * (msDuration / 1000)
        );
    } else {
        if (this.rect.y > 200) {
            this.canJump = true;
            
            if (this.jumped) {
                console.log("I jumped!");
                this.rect.moveIp(
                    0, 
                    Math.sin(Math.PI + (Math.PI * 0.5)) * this.speed * (msDuration / 1000)
                );
            }
        }
    }
};

