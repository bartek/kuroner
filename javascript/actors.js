var gamejs = require('gamejs')
    , box2d = require('./contrib/Box2dWeb-2.1.a.3')
    , objects = require('gamejs/utils/objects')
    , TileMap = require('./view').TileMap
    , Animation = require('./animate').Animation
    , globals = require('./globals')
    , config = require('./config').config;

var terminalVelocity = 10;

var Unit = function(pos, spriteSheet, animation, objs, world) {
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

    this.countJump = 0;
    this.endJump = true;

    // States controlled by the controller.
    this.isRunning;
    this.jumped;
    this.angle = null;

    this.maxSpeed = 200;
    this.jumpHeight = 12;

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

    // Setup box2d.
    var fixDef = new box2d.b2FixtureDef;
    fixDef.density = 1.0;
    fixDef.friction = 0.5;
    fixDef.restitution = 0.2;

    var bodyDef = new box2d.b2BodyDef;
    bodyDef.type = box2d.b2Body.b2_dynamicBody;
    bodyDef.position.x = this.realRect.center[0] / globals.BOX2D_SCALE;
    bodyDef.position.y = this.realRect.center[1] / globals.BOX2D_SCALE;
    bodyDef.fixedRotation = true;
    fixDef.shape = new box2d.b2PolygonShape;

    var b2Padding = 4;
    fixDef.shape.SetAsBox(
            (this.realRect.width - b2Padding) * 0.5 / globals.BOX2D_SCALE,
            (this.realRect.height - b2Padding) * 0.5 / globals.BOX2D_SCALE
    );

    this.b2Body = world.CreateBody(bodyDef);
    this.b2Body.CreateFixture(fixDef);
    this.b2Body.SetUserData(this);
    this.kind = 'player';
    this.vel = this.b2Body.GetLinearVelocity();

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

    if (this.angle == Math.PI) {
      this.isMovingLeft = true;
      this.isMovingRight = false;
    } else if (this.angle == 0) {
      this.isMovingRight = true;
      this.isMovingLeft = false;
    }
}

Unit.prototype.moveUnit = function(msDuration) {
    gamejs.log(this.vel.x, this.vel.y);
    this.b2Body.ApplyForce(this.vel, this.b2Body.GetPosition());
    this.b2Body.SetLinearDamping(1.5);

    this.vel.x = Math.cos(this.angle) * this.speed * (msDuration / 1000);

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

    if (this.jumped) {
        if (this.countJump < 1 && this.endJump) {
            if (this.endJump) {
                this.b2Body.SetLinearVelocity(this.vel);
            }
            this.vel.y = -8;
            this.endJump = false;
            this.countJump++;
        }
    }

    if (this.b2Body.GetLinearVelocity().y === 0) {
        this.countJump = 0;
        this.endJump = true;
    }

    var pos = this.moveUnit(msDuration);
    // Update the rect containing the sprite relative to the real award.
    this.rect.x = pos.x;
    this.rect.y = pos.y;

    // Collision detection and jumping
    /*
    this.colliding = TileMap.collisionTest(this);

    // We have the side of the tile the player is colliding with. With this, we
    // can determine if we should stop them on the ground, let them continue
    // falling, etc.
    // We need to check if the object is colliding, but also from which side,
    // otherwise it gets really wonky trying to determine how we want to handle
    // dy, etc.
    if (this.colliding.blocking.length > 0) {
      var colBottom = this.colliding.blocking.indexOf("bottom") > -1;
      var colRight = this.colliding.blocking.indexOf("right") > -1;
      var colLeft = this.colliding.blocking.indexOf("left") > -1;
      var tolTop = this.colliding.blocking.indexOf("top") > -1;

      var actBottom = function(that) {
        that.isGrounded = true;
        that.dy = 0;
      }

      var actRight = function(that) {
        that.speed = 0;
        that.realRect.moveIp(-1, 0);
      }

      var actLeft = function(that) {
        that.speed = 0;
        that.realRect.moveIp(1, 0);
      }

      // TODO: Note. Perhaps use the BLOCKS idea to determine which directions
      // of collisions are happening. Then, we can simply call the correct
      // functions instead of managing a massive if statement.

      // This is going to get messy, checking so many directions. Better ideas?
      if (colBottom && colRight) {
        gamejs.log("Bottom and right collision");
        actBottom(this);
        actRight(this);
      } else if (colBottom && colLeft) {
        actBottom(this);
        actLeft(this);
      } else if (colBottom) {
        actBottom(this);
      } else if (colRight) {
        actRight(this);
      } else if (colLeft) {
        actLeft(this);
      } else if (this.isAscending) {
        this.isGrounded = false;
      }
    } else {
      this.isGrounded = false;
    }

    if (this.isGrounded) {
      if (this.jumped) {
        if (this.canJump) {
          this.dy = -this.jumpHeight;
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

    this.previousX = this.realRect.x;
    this.previousY = this.realRect.y;


    this.setCollisionPoints();
    */
};

var Player = exports.Player = function(pos, spriteSheet, animation, objs, world) {
    Player.superConstructor.apply(this, arguments);

    // Player attributes. These are modified by the players pain stage
    this.painStage = 0;
    this.canLift = true;

    this.objs = objs;
};
objects.extend(Player, Unit);

Player.prototype.updatePainStage = function() {
  this.painStage += 1;

  gamejs.log("Pain Stage", this.painStage);

  if (this.painStage === 1) {
    this.maxSpeed = 150;
    this.canLift = true;
    this.jumpHeight = 10;
  } else if (this.painStage === 2) {
    this.maxSpeed = 100;
    this.canLift = false;
    this.jumpHeight = 8;
  }
};

// Player has been killed in some manner. Play death animation and reset the
// player in a position that is available (e.g. not a tile that could kill the
// player.) 
Unit.prototype.setDeath = function() {
    [x, y] = TileMap.startingPosition;

    this.realRect.x = x;
    this.realRect.y = y;

    this.updatePainStage();
}

Player.prototype.update = function(msDuration) {
    Unit.prototype.update.apply(this, arguments);

    // DEBUG: Character reset
    if (this.reset) {
      this.setDeath();
    }

    /*
    objs_colliding = gamejs.sprite.spriteCollide(this, this.objs, false);

    if (this.canLift && objs_colliding.length > 0) {
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
    */

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

    /*
    if (!this.isGrounded && this.currentAnimation!='static' ) {
        this.animation.start('static');
    }
    */
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
