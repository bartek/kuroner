var gamejs = require('gamejs')
    , TileMap = require('./view').TileMap;

var Laser = function(pos, frequency, angle, player, size) {
    Laser.superConstructor.apply(this, arguments);

    var speed = 5000; // Lasers, how do they work!
    this.player = player;
    this.isActive = false;
    this.angle = Math.PI - (Math.PI * 0.25); // Shoot down by default.

    // Adjust rect because lasers shoot out of a spout on the tile, not the
    // topleft corner of it.
    this.rect = new gamejs.Rect([pos[0] + 16, pos[1] + 16], [8, 8]);
    this.frequency = frequency;
    this.size = size;

    var _counter = 0;
    this.update = function(msDuration) {
        _counter += 0.5;

        if (_counter > this.frequency) {
            this.isActive = true;

            if (_counter > this.frequency * 3) {
                this.isActive = false;
                _counter = 0;
            }
        }

        // The rect of the laser needs constant updating in case something
        // blocks it. It's dimensions will change based on what's available
        // below it.
        this.rect.height += Math.sin(this.angle) * speed * (msDuration / 1000)
    };

    this.draw = function(surface) {
        if (this.isActive) {
            gamejs.draw.line(surface, '#f00',
                [this.rect.left, this.rect.top], 
                [this.rect.left, this.rect.top + this.rect.height]
            );
        }
    };
    return this;
};
gamejs.utils.objects.extend(Laser, gamejs.sprite.Sprite);

var EnemyManager = exports.EnemyManager = function(player) {
    this.player = player;
    this.weapons = new gamejs.sprite.Group();

    // Add some lasers based on map data.
    var weapons = this.weapons;
    var player = this.player;
    TileMap.activeTiles.forEach(function(tile) {
        if (tile.properties.active === 'laser') {
            var pos = tile.rect;
            weapons.add(new Laser([pos.left, pos.top], 25, 0, player));
        }
    });
    
    this.update = function(msDuration) {
        this.weapons.update(msDuration)
    };

    this.draw = function(surface) {
        this.weapons.draw(surface);
    };

    this.collide = function() {
        var player = this.player;

        gamejs.sprite.spriteCollide(player, this.weapons).forEach(function(weapon) {
            if (weapon.isActive) {
                player.setDeath();
            }
        });
    };

    return this;
};
