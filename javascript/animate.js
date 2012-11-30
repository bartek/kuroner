var Animation = exports.Animation = function(spriteSheet, animationSpec, fps) {
    this.fps = fps || 6;
    this.frameDuration = 1000 / this.fps;
    this.spec = animationSpec;

    this.currentFrame = null;
    this.currentFrameDuration = 0;
    this.currentAnimation = null;

    this.spriteSheet = spriteSheet;

    this.loopFinished = false;

    this.image = spriteSheet.get(0);
    return this;
};

Animation.prototype.start = function(animation) {
    this.currentAnimation = animation;
    this.currentFrame = this.spec[animation][0];
    this.currentFrameDuration = 0;
    this.update(0);
    return;
};

Animation.prototype.update = function(msDuration) {
    if (!this.currentAnimation) {
        throw new Error('No animation started.');
    }

    this.currentFrameDuration += msDuration;
    if (this.currentFrameDuration >= this.frameDuration){
        this.currentFrame++;
        this.currentFrameDuration = 0;

        var aniSpec = this.spec[this.currentAnimation];
        if (aniSpec.length == 1 || this.currentFrame > aniSpec[1]) {
            this.loopFinished = true;
            
            if (aniSpec.length === 3 && aniSpec[2] === false) {
                this.currentFrame--;
            } else {
                this.currentFrame = aniSpec[0];
            }
        }
    }

    this.image = this.spriteSheet.get(this.currentFrame);
    return;
};
