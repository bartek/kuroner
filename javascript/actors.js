var gamejs = require('gamejs')
    , objects = require('gamejs/utils/objects')
    , CollisionMap = require('./view').CollisionMap;

var terminalVelocity = 10;

var Unit = exports.Unit = function(pos, spriteSheet, isPlayer, animation) {
    Unit.superConstructor.apply(this, arguments);
	
    // Accel & Decel are a fraction of max speed added per tick - between 0 and 1
    this.accel = 0.1;
    this.decel = 0.1;
    this.speed = 0;
    this.isPlayer = isPlayer;

    this.maxSpeed = 200;

    this.jump = -12;

    this.angle = null;

    this.origImage = spriteSheet.get(0);
    this.animation = new Animation(spriteSheet, animation, 12);
    this.animation.start('static');

    // To prevent image blurring from decimal position, object has exact_rect to 
    // store exact position and rect, which will always be a whole-integer-rounded 
    // version of exact_rect - only rect is rendered
    this.rect = new gamejs.Rect(pos, [spriteSheet.width, spriteSheet.height]);
    this.exact_rect = new gamejs.Rect(this.rect);

    this.previousX = this.rect.x;
    this.previousY = this.rect.y;

    // Action state attributes
    this.canJump = false;
    this.onGround;
    this.isRunning;

    this.dy = 0.0;

    this.directions = {
      up: false,
      down: false,
      right: false,
      left: false
    };

    console.log(pos);
    return this;
};
objects.extend(Unit, gamejs.sprite.Sprite);

Unit.prototype.update = function(msDuration) {
    // Sprite animation
    this.animation.update(msDuration);
    this.image = this.animation.image;

    // DEBUG: Character reset
    if (this.reset) {
        this.dy = 0;
        this.onGround = false;
        this.rect.moveIp(-this.rect.topleft[0], -this.rect.topleft[1]);
    }

    // Rustic direction checking.
    if (this.exact_rect.y === this.previousY) {
      this.directions.down = false;
      this.directions.up = false;
    } else if (this.exact_rect.y > this.previousY) {
      this.directions.down = true;
      this.directions.up = false;
    } else if (this.exact_rect.y < this.previousY) {
      this.directions.down = false;
      this.directions.up = true;
    }

    if (this.angle == Math.PI) {
      this.directions.left = true;
      this.directions.right = false;
    } else if (this.angle == 0) {
      this.directions.right = true;
      this.directions.left = false;
    }

    if (this.directions.left) {
        this.image = gamejs.transform.flip(this.image, true, false);
    }

    // Basic directional movement
    if (this.isRunning) {
        if (this.speed <= this.maxSpeed) {
            this.speed += (this.accel * this.maxSpeed);
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
            this.speed -= (this.decel * this.maxSpeed);
        }
        if (this.speed < 0) {
            this.speed = 0;
        }
    }
    if (this.speed == 0) {
        this.angle = null;
    }

    // Collision detection and jumping
    this.colliding = CollisionMap.collisionTest(this);

    // We need to check if the object is colliding, but also from which side,
    // otherwise it gets really wonky trying to determine how we want to handle
    // dy, etc.
    if (this.colliding) {
      if (this.directions.down) {
        this.onGround = true;
        this.dy = 0;
      } else if (this.directions.up) {
        // This is a stub. TODO
        this.onGround = false;
      }
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

    if (!this.onGround && this.currentAnimation!='jumping' ) {
        this.animation.start('jumping');
    }

    this.previousX = this.exact_rect.x;
    this.previousY = this.exact_rect.y;

    this.exact_rect.moveIp(
        Math.cos(this.angle) * this.speed * (msDuration / 1000),
        Math.sin(this.angle) * this.speed * (msDuration / 1000) + this.dy
    );

    // Set the position of the rendered rectangle to a rounded version of the 
    // exact rect
    this.rect.top = Math.round(this.exact_rect.top);
    this.rect.left = Math.round(this.exact_rect.left);
};

var SpriteSheet = exports.SpriteSheet = function(imagePath, sheetSpec) {
   this.get = function(id) {
      return surfaceCache[id];
   };

   this.width = sheetSpec.width;
   this.height = sheetSpec.height;
   var image = gamejs.image.load(imagePath);
   var surfaceCache = [];
   var imgSize = new gamejs.Rect([0,0],[this.width,this.height]);
   // extract the single images from big spritesheet image
   for (var i=0; i<image.rect.height; i+=this.height) {
       for (var j=0;j<image.rect.width;j+=this.width) {
         var surface = new gamejs.Surface([this.width, this.height]);
         var rect = new gamejs.Rect(j, i, this.width, this.height);
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
