var gamejs = require('gamejs');
var view = require('./view');
var Unit = require('./actors').Unit;

gamejs.preload(['./data/tilesheet.png']);

var main = function() {
    gamejs.display.setCaption('Game Off')
    var display = gamejs.display.setMode([800, 600]);

    var map = new view.Map('./data/example.tmx');

    var units = new gamejs.sprite.Group();

    // Spawn a character, normally our main player, but what if we 
    // want to introduce baddies?!
    var spawn = function(image, isPlayer, yPos) {
        var pos = [0, 0];
        
        var unit = new Unit(
            pos,
            image,
            true // isPlayer
        );
        units.add(unit);
        return unit;
    };

    // meat!
    var player = spawn(
        gamejs.image.load('images/meatboy.png'),
        true,
        null
    );

    var GameController = function(player) {
        player.rect.left = 0
        player.rect.top = 0

        this.handle = function(event) {
            if (event.type === gamejs.event.KEY_DOWN) {
                if (event.key === gamejs.event.K_LEFT) {
                    player.rect.left -= player.velocity;
                } else if (event.key === gamejs.event.K_RIGHT) {
                    player.rect.left += player.velocity;
                } else if (event.key === gamejs.event.K_DOWN) {
                    player.rect.top += player.velocity;
                } else if (event.key === gamejs.event.K_UP) {
                    player.rect.top -= player.velocity;
                }
            }
        }
        return this;
    };

    var gameController = new GameController(player);

    // The game loop
    var tick = function(msDuration) {
        gamejs.event.get().forEach(function(event) {
            gameController.handle(event);
        });
        map.update(msDuration);
        units.update(msDuration);
        display.clear();

        // Draw
        map.draw(display);
        units.draw(display);
    };
    gamejs.time.fpsCallback(tick, this, 60);
};

var IMAGES = [
    'images/meatboy.png'
];

gamejs.preload(IMAGES);
gamejs.ready(main);
