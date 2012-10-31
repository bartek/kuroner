var gamejs = require('gamejs');
var objects = require('gamejs/utils/objects');

var Unit = exports.Unit = function(pos, image, isPlayer) {
    Unit.superConstructor.apply(this, arguments);

    this.origImage = image;
    var imgSize = this.origImage.getSize();

    this.image = new gamejs.Surface(imgSize);
    this.image.blit(this.origImage);

    this.rect = new gamejs.Rect(pos, imgSize)

    this.velocity = 5;

    return this;
};
objects.extend(Unit, gamejs.sprite.Sprite);

