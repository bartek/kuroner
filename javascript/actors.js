var gamejs = require('gamejs')
    , objects = require('gamejs/utils/objects')
    , CollisionMap = require('./view').CollisionMap;

var terminalVelocity = 10;

var Unit = function(pos, spriteSheet, animation) {
    Unit.superConstructor.apply(this, arguments);

    // Accel & Decel are a fraction of max speed added per tick - between 0 and 1
    this.accel = 0.1;
    this.decel = 0.1;
    this.speed = 0;

    // Player states
    this.isFalling = false;
    this.isAscending = false;
    this.isGrounded = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isGrabbing = false;
    this.canDrop = false;

    // States controlled by the controller.
    this.isRunning;
    this.jumped;
    this.angle = null;

    this.maxSpeed = 200;

    // The lower, the higher we jump. Strange?
    this.jumpHeight = -12;

    this.origImage = spriteSheet.get(0);
    this.animation = new Animation(spriteSheet, animation, 12);
    this.animation.start('static');

    // To prevent image blurring from decimal position, object has exact_rect to 
    // store exact position and rect, which will always be a whole-integer-rounded 
    // version of exact_rect - only rect is rendered
    this.rect = new gamejs.Rect(pos, [spriteSheet.width, spriteSheet.height]);
    this.exact_rect = new gamejs.Rect(this.rect);

    this.previousX = this.exact_rect.x;
    this.previousY = this.exact_rect.y;

    // Action state attributes
    this.canJump = false;

    this.dy = 0.0;

    console.log(pos);
    return this;
};
objects.extend(Unit, gamejs.sprite.Sprite);

// Various locations on the sprite that are used for collision detecting.
Unit.prototype.setCollisionPoints= function() {
    this.collisionPoints = {
     H: this.exact_rect.y + (this.exact_rect.height - 10)
    };
};

Unit.prototype.setState = function() {
    // Reset
    this.isFalling = false;
    this.isGrounded = false;
    this.isAscending = false;

    /* ---------------------
     * Unit States
     * ---------------------
     */
    if (this.exact_rect.y === this.previousY) {
      this.isGrounded = true;
    } else if (this.exact_rect.y > this.previousY) {
      this.isFalling = true;
    } else if (this.exact_rect.y < this.previousY) {
      this.isAscending = true;
    }

    if (this.angle == Math.PI) {
      this.isMovingLeft = true;
      this.isMovingRight = false;
    } else if (this.angle == 0) {
      this.isMovingRight = true;
      this.isMovingLeft = false;
    }
}

Unit.prototype.update = function(msDuration) {
    // Sprite animation
    this.animation.update(msDuration);
    this.image = this.animation.image;

    // DEBUG: Character reset
    if (this.reset) {
        this.dy = 0;
        this.isGrounded = false;
        this.rect.moveIp(-this.rect.topleft[0], -this.rect.topleft[1]);
    }

    this.setState();

    if (!this.isMovingRight) {
        this.image = gamejs.transform.flip(this.image, true, false);
    }

    // Collision detection and jumping
    this.colliding = CollisionMap.collisionTest(this);

    // We have the side of the tile the player is colliding with. With this, we
    // can determine if we should stop them on the ground, let them continue
    // falling, etc.
    // We need to check if the object is colliding, but also from which side,
    // otherwise it gets really wonky trying to determine how we want to handle
    // dy, etc.
    if (this.colliding.length > 0) {
      if (this.colliding.indexOf("bottom") > -1) {
        this.isGrounded = true;
        this.dy = 0;
      } else if (this.isAscending) {
        // This is a stub. TODO
        this.isGrounded = false;
      }
    } else {
      this.isGrounded = false;
    }

    if (this.isGrounded) {
      if (this.jumped) {
        if (this.canJump) {
          this.dy = this.jumpHeight;
          this.canJump = false;
        };
      } else {
        this.canJump = true;
      }
    };

    if (!this.isGrounded) {
        this.dy += 0.5;
    };

    if (this.jumped && !this.isGrounded && this.dy > 0) {
        this.dy -=  0.1;
    };

    if (this.dy > terminalVelocity) {
        this.dy = terminalVelocity;
    };

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

    this.setCollisionPoints();
};

var Player = exports.Player = function(pos, spriteSheet, animation, objs) {
    Player.superConstructor.apply(this, arguments);
    this.objs = objs;
};
objects.extend(Player, Unit);

Player.prototype.update = function(msDuration){
    Unit.prototype.update.apply(this, arguments);

    objs_colliding = gamejs.sprite.spriteCollide(this, this.objs, false);

    if (objs_colliding.length > 0) {
        if (this.isGrabbing) {
            if (this.canDrop) {
                if (objs_colliding[0].isCarried){
                    objs_colliding[0].isCarried = false;
                    if (this.isMovingRight) {
                        arc_angle = -(Math.PI/4);
                    } else if (this.isMovingLeft) {
                        arc_angle = Math.PI + (Math.PI/4);
                    }
                    objs_colliding[0].angle = arc_angle;
                    objs_colliding[0].speed = 250 + this.speed;
                } else {
                    objs_colliding[0].isCarried = true;
                }
                this.canDrop = false;
            }
        } else {
            this.canDrop = true;
        }
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

    if (!this.isGrounded && this.currentAnimation!='jumping' ) {
        this.animation.start('jumping');
    }
};

var Pickup = exports.Pickup = function(pos, spriteSheet, animation, player) {
    Pickup.superConstructor.apply(this, arguments);
    this.player = player;
    gamejs.log(player);
    this.isCarried = false;
}
objects.extend(Pickup, Unit);

Pickup.prototype.update = function(msDuration){
    Unit.prototype.update.apply(this, arguments);
    if (this.isCarried) {
        this.exact_rect.top = this.player.exact_rect.top;
        this.exact_rect.left = this.player.exact_rect.left;
        this.dy = 0;
    }
    if (this.speed >= 0) {
        this.speed -= (this.decel * this.maxSpeed);
    }
    if (this.speed < 0) {
        this.speed = 0;
    }
}

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
