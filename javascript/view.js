var gamejs = require('gamejs')
    , objects = require('gamejs/utils/objects')
    , tmx = require('gamejs/tmx')
    , box2d = require('./contrib/Box2dWeb-2.1.a.3')
    , globals = require('./globals');

/*
* Each tile can hold a "block" property detailing its desired
* blocking behaviour. Possible blocking data values are:
* - "none" -> Tile does not block.
* - "always" -> Tile blocks.
* - "north" -> Tile does not allow to go through its north border.
* - "east" -> Tile does not allow to go through its east border.
* - "south" -> Tile does not allow to go through its south border.
* - "west" -> Tile does not allow to go through its west border.
*
* Several restrictions can be added separated by commas; for example,
* an upper left corner should be "west,north". Restrictions are
* cumulative, so, for example, "west,always" would be the same as
* "always" and "east,none,north" would be the same as "east,north".
* 
* Note that "never" and "always" override any blocking information associated
* to a tile. This property cannot be changed in runtime.
*/
var BLOCK = {
    none: parseInt('0000', 2),
    north: parseInt('0001', 2),
    east: parseInt('0001', 2),
    south: parseInt('0100', 2),
    west: parseInt('1000', 2),
    always: parseInt('1111', 2)
};

// Store tiles that can be collided with 
var TileMapModel = function() {
    this.tiles = new gamejs.sprite.Group();
    this.deadlyTiles = new gamejs.sprite.Group();

    // Tiles with active actions on them (lasers, doors, etc.)
    this.activeTiles = new gamejs.sprite.Group();

    // We need to know where to start for this map. The tile should be defined
    // by a `start:true` property.
    this.startingPosition = [100, 0];
};

TileMapModel.prototype.createMatrix = function(opts) {
    this.matrix = [];
    this.tileWidth = opts.width;
    this.tileHeight = opts.height;

    var i = opts.height;
    while (i-->0) {
        var j = opts.width;
        this.matrix[i] = [];
        while (j-->0) {
            this.matrix[i][j] = BLOCK.none;
        }
    }
};

// Add tiles that can block the player into the blockable tiles group.
TileMapModel.prototype.push = function(tile, tilePos, i, j) {

    if (tile.properties) {
      if (tile.properties.start) {
        this.startingPosition = tilePos;
      } else if (tile.properties.active) {
        this.activeTiles.add(tile);
      } else if (tile.properties.block) {
        this.tiles.add(tile)

        // Add tile to the matrix. For simplicity sake at this point, simply add it
        // as a BLOCK.always tile if there is a blocking property on it.
        this.matrix[i][j] = BLOCK.always;
      }
      if (tile.properties.pain) {
        this.deadlyTiles.add(tile);
      }
    }
};

// Check if the passed sprite is colliding with any of our blocking tiles.
// Return an object telling us where the collision is happening, so we can
// propel the sprite in the right direction.
TileMapModel.prototype.collisionTest = function(sprite) {
    // How about testing for collisions with deadly tiles?
    // TODO: For now, we assume each tile is "always" blocking. So, it blocks from
    // all directions. 
    var collisions = gamejs.sprite.spriteCollide(sprite, this.tiles);
    var collidingAt = {};
    var isDeath = false;

    /* We can define functions for each collision type. For example, a south
     * tile would have a function along the lines of:
     *
     * var southCheck = function(collision) {
     *  if ((sprite.isAscending) && (collision.rect.top + collision.rect.height)
     *  < sprite.collisionPoints.T.y) {
     *  collidingAt.top = true;
     *  }
     *
     *  Then, given the `collision`, or .. tile, as it actually is, check which
     *  direction it blocks, so technically, we could skip some checks if
     *  necessary.
     * }
     *
     * These are excellent reads, perhaps need to do something similar:
     * http://gamedev.stackexchange.com/questions/25444/collision-detection-player-correction
     * http://gamedev.stackexchange.com/questions/29371/how-do-i-prevent-my-platformers-character-from-clipping-on-wall-tiles
     */

    // Check the tiles we are colliding with. If they are tiles stacked on top
    // of each other, only resolve the the player is nearest to?
    // We can use a custom collision detecting function. In this function, we
    // can test the NEXT point of collision for our sprite. This fixes the
    // entire "stuck" issue in theory. We can get the NEXT location by adjusting
    // the movement into its own function that returns the change.

    collisions.forEach(function(collision) {
      // Tile is below the players hot spot.
      if ((!sprite.isAscending) && (collision.rect.top > sprite.collisionPoints.H.y)) {
        collidingAt.bottom = true;
      // Tile is to the right of the player right side.
      } else if ((sprite.isMovingRight) && (collision.rect.left > sprite.collisionPoints.R.x)) {
        collidingAt.right = true;
      } else if ((sprite.isMovingLeft) && ((collision.rect.left + collision.rect.width) < sprite.collisionPoints.L.x)) {
        collidingAt.left = true;
        gamejs.log("Left collide");
      }
    });
    
    /* Since we'll be supporting more than just blocking tiles, perhaps we'll
     * need to adjust what is returned here. We want to identify the directions
     * a collision happens but we also want to identify what has been collided
     * with. So something like
     *
     * return {
     *  blocking: ['bottom', 'left']
     *  actions: ['death', 'hurt', 'spring', 'etc..'],
     * }
     *
     */
    return {
      blocking: Object.keys(collidingAt),
      death: isDeath
    }
};

// Loads the Map at `url` and holds all layers.
var Tile = function(rect, properties, b2World) {
    Tile.superConstructor.apply(this, arguments);

    var tilePadding = 1;

    this.rect = rect;
    this.properties = properties;
    gamejs.log("Tile", properties, this.rect.center[0]);

    if (properties.block === 'always') {
        // Define fixture to set on the body eventually.
        var fixDef = new box2d.b2FixtureDef;
        fixDef.density = 1.0;
        fixDef.friction = 0.5;
        fixDef.restitution = 0.2;

        // Create a body, setting the initial postion, type.
        var bodyDef = new box2d.b2BodyDef;
        bodyDef.type = box2d.b2Body.b2_staticBody;
        bodyDef.position.x = this.rect.center[0] / globals.BOX2D_SCALE;
        bodyDef.position.y = this.rect.center[1] / globals.BOX2D_SCALE;
        fixDef.shape = new box2d.b2PolygonShape;

        // Create a box around this polygon, with the box centered on the origin
        // of the tile.
        fixDef.shape.SetAsBox(
                (this.rect.width - tilePadding) * 0.5 / globals.BOX2D_SCALE,
                (this.rect.height - tilePadding) * 0.5 / globals.BOX2D_SCALE
        );

        this.b2Body = b2World.CreateBody(bodyDef);
        this.b2Body.CreateFixture(fixDef);

        this.b2Body.SetUserData(this);
    }
    this.kind = 'tile';

    return this;
};
objects.extend(Tile, gamejs.sprite.Sprite);

var TileMap = exports.TileMap = new TileMapModel();

var Map = exports.Map = function(url, b2World) {
    this.b2World = b2World;

    // Draw each layer
    this.draw = function(display) {
        layerViews.forEach(function(layerView) {
            layerView.draw(display, mapController.offset);
        }, this);
    };

    // Input events.
    this.handle = function(event) {
        mapController.handle(event);
    };
    
    // Called on each tick.
    this.update = function(msDuration) {
        mapController.update(msDuration);
    };

    // Initialize.
    var self = this;
    var map = new tmx.Map(url);
    var mapController = new MapController();

    TileMap.createMatrix({
        width: map.tileWidth, 
        height: map.tileHeight
    });

    // Given the TMX Map we've loaded, go through each layer (via map.layers,
    // provided by gamejs), and return a LayerView that we can deal with.
    var layerViews = map.layers.map(function(layer) {
        return new LayerView(self, layer, {
            tileWidth: map.tileWidth,
            tileHeight: map.tileHeight,
            width: map.width,
            height: map.height,
            tiles: map.tiles
        });
    });
    return this;
};

var LayerView = function(map, layer, opts) {
    this.draw = function(display, offset) {
        // `blit` basically means draw.
        display.blit(this.surface, offset);
    };

    // Initialize.
    this.surface = new gamejs.Surface(
        opts.width * opts.tileWidth,
        opts.height * opts.tileHeight
    );
    this.surface.setAlpha(layer.opacity);

    // Note how below we look up the "gid" of the tile images in the TileSet 
    // from the Map ('opt.tiles') to get the actual Surfaces.
    layer.gids.forEach(function(row, i) {
        row.forEach(function(gid, j) {
            if (gid === 0) {
                return;
            }

            var tileProperties = opts.tiles.getProperties(gid);
            var tileSurface = opts.tiles.getSurface(gid);

            if (tileSurface) {
                var tilePos = [j * opts.tileWidth, i * opts.tileHeight];
                var tileRect = new gamejs.Rect(
                  tilePos,
                  [opts.tileWidth, opts.tileHeight]
                );
                this.surface.blit(tileSurface, tileRect);
                var tile = new Tile(tileRect, tileProperties, map.b2World);

                // Push or ignore the tile. Only kept if its relevant.
                TileMap.push(tile, tilePos, i, j);
            } else {
                gamejs.log('No GID ', gid, i, j, 'layer', i);
            }
        }, this);
    }, this);
    return this;
};

// Input Controller
var MapController = function() {
    this.offset = [0, 0];

    this.handle = function(event) {
        if (event.type === gamejs.event.KEY_DOWN) {
            if (event.key === gamejs.event.K_LEFT) {
               this.offset[0] += 50;
            } else if (event.key === gamejs.event.K_RIGHT) {
               this.offset[0] -= 50;
            } else if (event.key === gamejs.event.K_DOWN) {
               this.offset[1] -= 50;
            } else if (event.key === gamejs.event.K_UP) {
               this.offset[1] += 50;
            }
        }
    };

    this.update = function(msDuration) {
        // tick
    };
    return this;
};
