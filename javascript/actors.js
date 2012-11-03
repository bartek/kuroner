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

Unit.prototype.update = function(msDuration) {

    this.x = Math.round(this.rect.topright[0]);
    this.y = Math.round(this.rect.topright[1]);

    // moveIp = move in place
    if (this.angle !== null) {
        this.rect.moveIp(
            Math.cos(this.angle) * this.speed * (msDuration / 1000),
            Math.sin(this.angle) * this.speed * (msDuration / 1000)
        );
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

    if (this.rect.y >= 200) {
        this.rect.y = 200;
        this.dy = 0;
        this.onGround = true;
    };   


    // // Play with gravity.
    // if (this.rect.y < 200) {
    //     this.rect.moveIp(
    //         0, 
    //         Math.sin(Math.PI * 0.5) * this.speed * (msDuration / 1000)
    //     );
    // }

};

