var gamejs = require('gamejs')
    , view = require('./view')
    , input = require('./input')
    , Unit = require('./actors').Unit
    , SpriteSheet = require('./actors').SpriteSheet;

var main = function() {
    gamejs.display.setCaption('Game Off')
    var display = gamejs.display.setMode([800, 600]);
	
    var map = new view.Map('./data/grassland.tmx');

    var units = new gamejs.sprite.Group();
    // Spawn a character, normally our main player, but what if we 
    // want to introduce baddies?!
    var spawn = function(spriteSheet, isPlayer, yPos, animation) {
        var pos = [0, 0];
        
        var unit = new Unit(
            pos,
            spriteSheet,
            true, // isPlayer
            animation
        );
        units.add(unit);
        return unit;
    };
//The nitty gritties of our player character
	var filename = 'images/MegaMan7Sheet4.png';
	var dimensions = {width:42, height:50};
	var spriteSheet = new SpriteSheet(filename, dimensions);
    var player_animation = {
        'static': [0],
        'running':[5,14],
        'jumping':[18],
    }
//Rise!
    var player = spawn(
        spriteSheet,
        true,
        null,
        player_animation
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
		
        //Get the input values from the game controller and apply to player
        //undefined angle is bad - only set angle when it's defined
        if (typeof gameController.angle() !== "undefined") {
            player.angle = gameController.angle();
        }
        player.isRunning = gameController.isRunning();
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
