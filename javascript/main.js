var gamejs = require('gamejs')
    , view = require('./view')
    , input = require('./input')
    , Pickup = require('./actors').Pickup
    , Player = require('./actors').Player
    , SpriteSheet = require('./actors').SpriteSheet;

var main = function() {
    gamejs.display.setCaption('Game Off')
    var display = gamejs.display.setMode([800, 600]);
    var map = new view.Map('./data/grassland.tmx');

    var units = new gamejs.sprite.Group();
    var objs = new gamejs.sprite.Group();

    // Spawn a character, normally our main player, but what if we 
    // want to introduce baddies?!
    var spawn = function(spriteSheet, pos, animation, objs) {
        var unit = new Player(
            pos,
            spriteSheet,
            animation,
            objs
        );
        units.add(unit);
        return unit;
    };
    var objs_spawn = function(spriteSheet, pos, animation, player) {
        var unit = new Pickup(
            pos,
            spriteSheet,
            animation,
            player
        );
        objs.add(unit);
        unit.decel = 0.02;
        return unit;
    };

    var rock_file = 'images/rock.png';
    var rock_dims = {width:32, height:32};
    var rock_pos = [100,0];
    var rock_sheet = new SpriteSheet(rock_file, rock_dims);
    var rock_anims = {
        'static': [0]
    };
    
    //The nitty gritties of our player character
    var filename = 'images/MegaMan7Sheet4.png';
    var dimensions = {width:42, height:50};
    var player_pos = [0, 0];
    var player_spriteSheet = new SpriteSheet(filename, dimensions);
    var player_animation = {
        'static': [0],
        'running':[5,14],
        'jumping':[18]
    };

    // Rise!
    var player = spawn(
        player_spriteSheet,
        player_pos,
        player_animation,
        objs
    );

    var rock = objs_spawn(
        rock_sheet,
        rock_pos,
        rock_anims,
        player
    );

    var gameController = new input.GameController(player);

    // The game loop
    var tick = function(msDuration) {
        gamejs.event.get().forEach(function(event) {
            gameController.handle(event);
        });
        map.update(msDuration);
        units.update(msDuration);
        objs.update(msDuration);

        // Draw
        display.clear();
        map.draw(display);
        units.draw(display);
        objs.draw(display);

        //Get the input values from the game controller and apply to player
        //undefined angle is bad - only set angle when it's defined
        if (typeof gameController.angle() !== "undefined") {
            player.angle = gameController.angle();
        }
        player.isRunning = gameController.isRunning();
        player.isGrabbing = gameController.isGrabbing();
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
    'images/MegaMan7Sheet4.png',
    'images/rock.png',
];


gamejs.preload(IMAGES);
gamejs.ready(main);
