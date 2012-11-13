var gamejs = require('gamejs')
    , tmx = require('gamejs/tmx')
    , objects = require('gamejs/utils/objects');


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
var CollisionMapCollection = function() {
    this.tiles = new gamejs.sprite.Group();
};

CollisionMapCollection.prototype.pushOrIgnore = function(tile) {
    if (tile.properties && tile.properties.block) {
        this.tiles.add(tile)
    }
};

// Check if the passed sprite is colliding with any of our blocking tiles.
// Return an object telling us where the collision is happening, so we can
// propel the sprite in the right direction.
CollisionMapCollection.prototype.collisionTest = function(sprite) {
    // TODO: For now, we assume each tile is "always" blocking. So, it blocks from
    // all directions. 
    var collisions = gamejs.sprite.groupCollide(sprite.groups[0], this.tiles);

    var collidingAt = [];

    collisions.forEach(function(collision) {
      // Tile is below the players hot spot.
      if ((!sprite.isAscending) && (collision.b.rect.top > sprite.collisionPoints.H)) {
        collidingAt.push("bottom");
      }
    });
    return collidingAt;
};
var CollisionMap = exports.CollisionMap = new CollisionMapCollection();

// Loads the Map at `url` and holds all layers.
var Tile = function(rect, properties) {
    Tile.superConstructor.apply(this, arguments);

    this.rect = rect;
    this.properties = properties;

    return this;
};
objects.extend(Tile, gamejs.sprite.Sprite);

var Map = exports.Map = function(url) {
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
                var tileRect = new gamejs.Rect(
                        [j * opts.tileWidth, i * opts.tileHeight],
                        [opts.tileWidth, opts.tileHeight]
                );
                this.surface.blit(tileSurface, tileRect);
                var tile = new Tile(tileRect, tileProperties);

                // Push or ignore the tile. Only kept if its relevant.
                CollisionMap.pushOrIgnore(tile);
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
