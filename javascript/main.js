var gamejs = require('gamejs')
    , view = require('./view')
    , input = require('./input')
    , Unit = require('./actors').Unit
    , SpriteSheet = require('./actors').SpriteSheet;

var main = function() {
    gamejs.display.setCaption('Game Off')
    var display = gamejs.display.setMode([800, 600]);
	
    var map = new view.Map('./data/grassland.tmx');

    var CollisionMap = require('./view').CollisionMap

    var units = new gamejs.sprite.Group();
    // Spawn a character, normally our main player, but what if we 
    // want to introduce baddies?!
    var spawn = function(spriteSheet, isPlayer, yPos) {
        var pos = [0, 0];
        
        var unit = new Unit(
            pos,
            spriteSheet,
            true // isPlayer
        );
        units.add(unit);
        return unit;
    };

	var filename = 'images/MegaMan7Sheet4.png';
	var dimensions = {width:42, height:50};
	var spriteSheet = new SpriteSheet(filename, dimensions);
    // meat!
    var player = spawn(
        spriteSheet,
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

        // Draw
        display.clear();
        map.draw(display);
        units.draw(display);
		
        player.angle = gameController.angle();
        player.jumped = gameController.jumped();
        player.climb = gameController.climb();
        player.reset = gameController.reset();

    };
    gamejs.time.fpsCallback(tick, this, 60);
};

var IMAGES = [
    // World
    './data/grasstilesheet.png',
    'images/meatboy.png',
    'images/MegaMan7Sheet4.png'
];


gamejs.preload(IMAGES);
gamejs.ready(main);
