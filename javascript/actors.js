var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');

var Unit = exports.Unit = function(pos, image, isPlayer) {
    Unit.superConstructor.apply(this, arguments);

    this.speed = 300;
    this.angle = null;

    this.origImage = image;
    var imgSize = this.origImage.getSize();

    this.image = new gamejs.Surface(imgSize);
    this.image.blit(this.origImage);

    this.rect = new gamejs.Rect(pos, imgSize)

    return this;
};
objects.extend(Unit, gamejs.sprite.Sprite);

Unit.prototype.update = function(msDuration) {
    // moveIp = move in place
    if (this.angle !== null) {
        this.rect.moveIp(
            Math.cos(this.angle) * this.speed * (msDuration / 1000),
            Math.sin(this.angle) * this.speed * (msDuration / 1000)
        );
    }
};

