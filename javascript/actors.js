var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');

var Unit = exports.Unit = function(pos, image, isPlayer) {
    Unit.superConstructor.apply(this, arguments);

    this.speed = 200;

    this.gravity = 150;
    this.jump = 50;

    this.angle = null;

    this.origImage = image;
    var imgSize = this.origImage.getSize();

    this.image = new gamejs.Surface(imgSize);
    this.image.blit(this.origImage);

    this.rect = new gamejs.Rect(pos, imgSize);

    this.canJump = false;
    this.onGround;

    this.dx = 0.0;
    this.dy = 0.0;

    return this;
};
objects.extend(Unit, gamejs.sprite.Sprite);

Unit.prototype.update = function(msDuration, map) {
    // Check that this sprites group is not colliding with the map
    var colliding = false;
    gamejs.sprite.groupCollide(this.groups[0], map.collisionable).forEach(function(collision) {
        colliding = true;
        });

    this.x = Math.round(this.rect.topright[0]);
    this.y = Math.round(this.rect.topright[1]);

    // moveIp = move in place
    if (this.angle !== null) {
        this.rect.moveIp(
            Math.cos(this.angle) * this.speed * (msDuration / 1000),
            Math.sin(this.angle) * this.speed * (msDuration / 1000)
        );
    }

    // Play with gravity.
    if (colliding) {
        this.onGround = true;
        this.dy = 0;
    } else {
        this.onGround = false;
    }

    if (this.onGround) {
        if (this.jumped) {
            console.log(this.x, this.y)
            if (this.canJump) {
                this.dy = -8;
                this.canJump = false;
            };
        } else {
            this.canJump = true;
        }
    };

    if (!this.onGround) {
        this.dy += 0.5;
    };

    if (this.jumped && !this.onGround && this.dy > 0) {
        this.dy -=  0.1;
    };

    if (this.dy > 5) {
        this.dy = 5;
    };

    this.rect.moveIp(
        this.dx,
        this.dy
        )
};

