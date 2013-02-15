var gamejs = require('gamejs')
    , view = require('./view')
    , TileMap = require('./view').TileMap
    , input = require('./input')
    , Pickup = require('./actors').Pickup
    , Player = require('./actors').Player
    , EnemyManager = require('./enemy').EnemyManager
    , SpriteSheet = require('./actors').SpriteSheet;

var main = function() {
    gamejs.display.setCaption('Game Off')
    var display = gamejs.display.setMode([800, 600]);
    var background = gamejs.image.load('images/background1.jpg')

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
    var filename = 'images/finn_01.png';
    var dimensions = {width:25, height:26};
    var player_pos = TileMap.startingPosition;
    var player_spriteSheet = new SpriteSheet(filename, dimensions);
    var player_animation = {
        'static': [0],
        'running':[1,4],
        'jumping':[0]
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

    // Lasers and stuff.
    var enemies = new EnemyManager(player);

    var gameController = new input.GameController(player);

    // The game loop
    var tick = function(msDuration) {
        gamejs.event.get().forEach(function(event) {
            gameController.handle(event);
        });
        map.update(msDuration);
        units.update(msDuration);
        objs.update(msDuration);
        enemies.update(msDuration);

        // Collisions
        enemies.collide();

        // Draw
        display.clear();
        display.blit(background);

        map.draw(display);
        units.draw(display);
        objs.draw(display);
        enemies.draw(display);

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
    'images/finn_01.png',
    'images/rock.png',
    'images/background1.jpg',
];


gamejs.preload(IMAGES);
gamejs.ready(main);
