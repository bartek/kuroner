var gamejs = require('gamejs');
var tmx = require('gamejs/tmx');

// Loads the Map at `url` and holds all layers.
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
    var map = new tmx.Map(url);
    var mapController = new MapController();


    // Given the TMX Map we've loaded, go through each layer (via map.layers,
    // provided by gamejs), and return a LayerView that we can deal with.
    var layerViews = map.layers.map(function(layer) {
        return new LayerView(layer, {
            tileWidth: map.tileWidth,
            tileHeight: map.tileHeight,
            width: map.width,
            height: map.height,
            tiles: map.tiles
        });
    });
    return this;
};

var LayerView = function(layer, opts) {
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

            var tileSurface = opts.tiles.getSurface(gid);
            if (tileSurface) {
                this.surface.blit(tileSurface,
                    new gamejs.Rect(
                        [j * opts.tileWidth, i * opts.tileHeight],
                        [opts.tileWidth, opts.tileHeight]
                    ));
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
