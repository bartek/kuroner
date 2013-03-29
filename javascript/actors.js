var gamejs = require('gamejs')
    , objects = require('gamejs/utils/objects')
    , TileMap = require('./view').TileMap
    , Animation = require('./animate').Animation
    , globals = require('./globals')
    , config = require('./config').config;

var Unit = function(pos, spriteSheet, animation, physics) {
    Unit.superConstructor.apply(this, arguments);

    // Accel & Decel are a fraction of max speed added per tick - between 0 and 1
    this.accel = 0.1;
    this.decel = 0.1;
    this.speed = 0;

    // Player states
    this.isFalling = false;
    this.isAscending = false;
    this.isGrounded = false;
    this.isJumping = false;
    this.isMovingLeft = false;
    this.isMovingRight = false;
    this.isGrabbing = false;
    this.canDrop = false;

    this.countJump = 0;
    this.hasJumped = false;
    this.endJump = true;

    // States controlled by the controller.
    this.isRunning;
    this.angle = null;

    // TODO: It should be adjusted so that friction is only 0 when jumping, so it
    // gives a "super mario" effect.
    this._defaultFriction = 0;

    this.maxSpeed = 200;
    this.jumpHeight = 8;

    this.origImage = spriteSheet.get(0);
    this.animation = new Animation(spriteSheet, animation, 12);
    this.animation.start('static');

    // To prevent image blurring from decimal position, object has realRect to 
    // store exact position and rect, which will always be a whole-integer-rounded 
    // version of realRect - only rect is rendered
    this.rect = new gamejs.Rect(pos, [spriteSheet.width, spriteSheet.height]);
    this.realRect = new gamejs.Rect(this.rect);

    this.previousX = this.realRect.x;
    this.previousY = this.realRect.y;

    this.b2Body = physics.createBody(this.realRect, 'dynamic', {
        friction: this._defaultFriction
    });
    this.b2Body.SetUserData(this);
    this.kind = 'player';

    this.velVector = this.b2Body.GetLinearVelocity();

    // Action state attributes
    this.canJump = false;

    this.dy = 0.0;

    return this;
};
objects.extend(Unit, gamejs.sprite.Sprite);

// Various locations on the sprite that are used for collision detecting.
Unit.prototype.setCollisionPoints = function() {
    // These numbers are kind of hacky. The reason the realRect width/height
    // is larger than the actual sprite is because all frames in the animation
    // must be the same size, and that makes the rect larger than it should be.
    this.collisionPoints = {
     // Hot spot for ground collisions
     H: {
      x: this.realRect.x + ((this.realRect.width / 2) - 5),
      y: this.realRect.y + (this.realRect.height - 10)
     },
     // Right top side of the player
     R: {
      x: this.realRect.x + this.realRect.width - 10,
      y: this.realRect.y + 15
     },
     L: {
      x: this.realRect.x + 5,
      y: this.realRect.y + 15
     }
    };

    // Draw the collision points for reference.
    if (config.debug) {
      var rRect = new gamejs.Rect(
        [this.collisionPoints.R.x, this.collisionPoints.R.y],
        [5, 5]
      );
      gamejs.draw.rect(this.image, '#ff00cc', rRect);

      var lRect = new gamejs.Rect(
        [this.collisionPoints.L.x, this.collisionPoints.L.y],
        [5, 5]
      );
      gamejs.draw.rect(this.image, '#ff00cc', lRect);

      var hRect = new gamejs.Rect(
        [this.collisionPoints.H.x, this.collisionPoints.H.y],
        [5, 5]
      );
      gamejs.draw.rect(this.image, '#ff00cc', hRect);
    }
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
    if (this.realRect.y === this.previousY) {
    } else if (this.realRect.y > this.previousY) {
      this.isFalling = true;
    } else if (this.realRect.y < this.previousY) {
      this.isAscending = true;
    }

    if (this.b2Body.GetLinearVelocity().y === 0) {
        this.isGrounded = true;
    }

    if (this.angle == Math.PI) {
      this.isMovingLeft = true;
      this.isMovingRight = false;
    } else if (this.angle == 0) {
      this.isMovingRight = true;
      this.isMovingLeft = false;
    }
}

// Move an object using box2d physics.
Unit.prototype.moveUnit = function(msDuration) {
    this.b2Body.ApplyForce(this.velVector, this.b2Body.GetWorldCenter()); //GetPosition());
    this.b2Body.SetLinearDamping(1.5);

    this.velVector.x = Math.cos(this.angle) * this.speed * (msDuration / 1000);

    var x = (this.b2Body.GetPosition().x * globals.BOX2D_SCALE) - this.image.getSize()[0] * 0.5;
    var y = (this.b2Body.GetPosition().y * globals.BOX2D_SCALE) - this.image.getSize()[1] * 0.5;
    return {x: x, y: y};
}

Unit.prototype.update = function(msDuration) {
    // Sprite animation
    this.animation.update(msDuration);
    this.image = this.animation.image;

    this.setState();

    if (!this.isMovingRight) {
        this.image = gamejs.transform.flip(this.image, true, false);
    }

    // Jumping!
    if (this.hasJumped) {
        if (this.countJump < 1 && this.endJump) {
            if (this.endJump) {
                this.b2Body.SetLinearVelocity(this.velVector);
            }
            this.velVector.y = -this.jumpHeight;
            this.endJump = false;
            this.countJump++;
        }
    }

    if (this.isGrounded) {
        this.countJump = 0;
        this.endJump = true;
    }

    var pos = this.moveUnit(msDuration);
    // Update the rect containing the sprite relative to the real award.
    this.rect.x = pos.x;
    this.rect.y = pos.y;
};

var Player = exports.Player = function(pos, spriteSheet, animation, physics) {
    Player.superConstructor.apply(this, arguments);

    // Player attributes. These are modified by the players pain stage
    this.painStage = 0;
    this.canLift = true;
};
objects.extend(Player, Unit);

Player.Spawn = function(actor, pos, physics) {
    var player = new Player(
        pos,
        new SpriteSheet(actor.filename, actor.dimensions),
        actor.animation,
        physics
    );
    return player;
}


// Player has been killed in some manner. Play death animation and reset the
// player in a position that is available (e.g. not a tile that could kill the
// player.) 
Unit.prototype.setDeath = function() {
    [x, y] = TileMap.startingPosition;

    this.realRect.x = x;
    this.realRect.y = y;
}

Player.prototype.update = function(msDuration) {
    Unit.prototype.update.apply(this, arguments);

    // DEBUG: Character reset
    if (this.reset) {
      this.setDeath();
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
};

var Pickup = exports.Pickup = function(pos, spriteSheet, animation, player) {
    Pickup.superConstructor.apply(this, arguments);
    this.player = player;
    this.isCarried = false;
}
objects.extend(Pickup, Unit);

Pickup.prototype.update = function(msDuration){
    Unit.prototype.update.apply(this, arguments);
    if (this.isCarried) {
        this.realRect.top = this.player.realRect.top;
        this.realRect.left = this.player.realRect.left;
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
