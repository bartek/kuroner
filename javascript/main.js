var gamejs = require('gamejs');
var view = require('./view');
var input = require('./input');
var Unit = require('./actors').Unit;

var main = function() {
    gamejs.display.setCaption('Game Off')
    var display = gamejs.display.setMode([800, 600]);

    var map = new view.Map('./data/grassland.tmx');

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

    var gameController = new input.GameController(player);

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

        player.angle = gameController.angle();
        player.jumped = gameController.jumped();
    };
    gamejs.time.fpsCallback(tick, this, 60);
};

var IMAGES = [
    // World
    './data/grasstilesheet.png',
    'images/meatboy.png'
];


gamejs.preload(IMAGES);
gamejs.ready(main);
