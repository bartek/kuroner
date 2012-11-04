var gamejs = require('gamejs');
var view = require('./view');
var input = require('./input');
var Unit = require('./actors').Unit;
var SpriteSheet = require('./actors').SpriteSheet;

var main = function() {
    gamejs.display.setCaption('Game Off')
    var display = gamejs.display.setMode([800, 600]);
	
    var map = new view.Map('./data/grassland.tmx');

    var units = new gamejs.sprite.Group();
	console.debug('easy');
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
	console.debug('check');
	
	var filename = 'images/meatboy.png';
	var dimensions = {width:28, height:19};
	console.debug('gonna make a spritesheet');
	var spriteSheet = new SpriteSheet(filename, dimensions);
	console.debug('about to make a guy');
    // meat!
    var player = spawn(
        spriteSheet,
        true,
        null
    );
	console.debug('made a guy');
    var gameController = new input.GameController(player);

    // The game loop
    var tick = function(msDuration) {
        gamejs.event.get().forEach(function(event) {
            gameController.handle(event);
        });
        map.update(msDuration);
        units.update(msDuration, map);
        display.clear();

        // Draw
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
    'images/meatboy.png'
];


gamejs.preload(IMAGES);
gamejs.ready(main);
