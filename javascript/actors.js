var gamejs = require('gamejs')
    , objects = require('gamejs/utils/objects')
    , CollisionMap = require('./view').CollisionMap;

var terminalVelocity = 10;

var Unit = exports.Unit = function(pos, spriteSheet, isPlayer, animation) {
    Unit.superConstructor.apply(this, arguments);
		
    this.accel = 10;
    this.decel = 1;
    this.speed = 0;

    this.maxSpeed = 200;

    this.gravity = 150;
    this.jump = -12;

    this.angle = null;

    this.origImage = spriteSheet.get(0);
	this.animation = new Animation(spriteSheet, animation, 12);
	this.animation.start('static');
		
    this.rect = new gamejs.Rect(pos, [42,50]);

    //Action state attributes
    this.canJump = false;
    this.onGround;
    this.isRunning;

    this.direction = 'right';

    this.dy = 0.0;

    return this;
};
objects.extend(Unit, gamejs.sprite.Sprite);

Unit.prototype.update = function(msDuration) {
    // Sprite animation
    this.animation.update(msDuration);
    this.image = this.animation.image;

    // Character reset
    if (this.reset) {
        this.dy = 0;
        this.onGround = false;
        this.rect.moveIp(-this.rect.topleft[0], -this.rect.topleft[1]);
    }

    if (this.angle == Math.PI) {
        this.direction = 'left';
    } else if (this.angle == 0) {
        this.direction = 'right';
    }

    if (this.direction == 'left') {
        this.image = gamejs.transform.flip(this.image, true, false);
    }
    // Basic directional movement
    if (this.isRunning) {
        if (this.speed <= this.maxSpeed) {
            this.speed += this.accel;
        }
        if (this.speed > this.maxSpeed) {
            this.speed = this.maxSpeed;
        }
        if (this.animation.currentAnimation != 'running') {
            this.animation.start('running');
        }
    } else {
        this.animation.start('static');
        if (this.speed >= 0) {
            this.speed -= this.decel;
        }
        if (this.speed < 0) {
            this.speed = 0;
        }
    }
    if (this.speed == 0) {
        this.angle = null;
    }

    this.rect.moveIp(
        Math.cos(this.angle) * this.speed * (msDuration / 1000),
        Math.sin(this.angle) * this.speed * (msDuration / 1000)
    );

    // Collision detection and jumping
    this.colliding = CollisionMap.collisionTest(this);

    if (this.colliding) {
        this.onGround = true;
        this.dy = 0;
    } else {
        this.onGround = false;
    }

    if (this.onGround) {
        if (this.jumped) {
            if (this.canJump) {
                this.dy = this.jump; // This is the value to change to alter jump height
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

    if (this.dy > terminalVelocity) {
        this.dy = terminalVelocity;
    };

    this.rect.moveIp(
        0,
        this.dy
    );
};

var SpriteSheet = exports.SpriteSheet = function(imagePath, sheetSpec) {
   this.get = function(id) {
      return surfaceCache[id];
   };

   var width = sheetSpec.width;
   var height = sheetSpec.height;
   var image = gamejs.image.load(imagePath);
   var surfaceCache = [];
   var imgSize = new gamejs.Rect([0,0],[width,height]);
   // extract the single images from big spritesheet image
   for (var i=0; i<image.rect.height; i+=height) {
       for (var j=0;j<image.rect.width;j+=width) {
         var surface = new gamejs.Surface([width, height]);
         var rect = new gamejs.Rect(j, i, width, height);
         surface.blit(image, imgSize, rect);
         surfaceCache.push(surface);
      }
   }
   return this;
};

var Animation = function(spriteSheet, animationSpec, fps) {
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
