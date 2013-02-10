var gamejs = require('gamejs')
    , box2d = require('./contrib/Box2dWeb-2.1.a.3')
    , view = require('./view')
    , TileMap = require('./view').TileMap
    , input = require('./input')
    , Pickup = require('./actors').Pickup
    , Player = require('./actors').Player
    , EnemyManager = require('./enemy').EnemyManager
    , SpriteSheet = require('./actors').SpriteSheet;

var b2World = null;
var b2Draw = null;
var b2Listener = null;

// objects and units
var gPlayer = null;
var gUnits = null;

var gDisplay = null;
var gMap = null;
var gameController = null;
var gBackground = null;

var main = function() {
    gDisplay = gamejs.display.setMode([800, 600]);

    // Box2d.
    b2World = new box2d.b2World(
            new box2d.b2Vec2(0, 20), // gravity
            true // allow sleep
    );

    var b2Listener = box2d.Box2D.Dynamics.b2ContactListener;
    b2Listener.BeginContact = function(contact) {
        //gamejs.log("BeginContact", contact.GetFixtureA().GetBody().GetUserData());
    };
    b2Listener.EndContact = function(contact) {
        //gamejs.log("EndContact", contact.GetFixtureA().GetBody().GetUserData());
    };
    b2Listener.PostSolve = function(contact, impulse) {
        //gamejs.log("PostSolve", contact, impulse);
    };
    b2Listener.PreSolve = function(contact, oldManifold) {
        // PreSolve
    };
    b2World.SetContactListener(b2Listener);

    gBackground = gamejs.image.load('images/background1.jpg')

    gMap = new view.Map('./data/cave.tmx', b2World);

    gUnits = new gamejs.sprite.Group();
    var objs = new gamejs.sprite.Group();

    // Spawn a character, normally our main player, but what if we 
    // want to introduce baddies?!
    var spawn = function(spriteSheet, pos, animation, objs) {
        var unit = new Player(
            pos,
            spriteSheet,
            animation,
            objs,
            b2World
        );
        gUnits.add(unit);
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
    var player_pos = TileMap.startingPosition;
    var player_spriteSheet = new SpriteSheet(filename, dimensions);
    var player_animation = {
        'static': [0],
        'running':[5,14],
        'jumping':[18]
    };

    // Rise!
    gPlayer = spawn(
        player_spriteSheet,
        player_pos,
        player_animation,
        objs
    );

    // Lasers and stuff.
    var enemies = new EnemyManager(gPlayer);
    gameController = new input.GameController(gPlayer);

    gamejs.time.fpsCallback(tick, this, 24);
};

// The game loop
var tick = function(msDuration) {
    gamejs.event.get().forEach(function(event) {
        gameController.handle(event);
    });

    // Update physics.
    b2World.Step(
        1 / 24, // frame rate
        10, // velocity iterations
        10 // position iterations.
    );
    b2World.ClearForces();

    gMap.update(msDuration);
    gUnits.update(msDuration);

    // Draw!
    gDisplay.clear();
    gDisplay.blit(gBackground);

    gMap.draw(gDisplay);
    gUnits.draw(gDisplay);

    if (typeof gameController.angle() !== "undefined") {
        gPlayer.angle = gameController.angle();
    }
    gPlayer.isRunning = gameController.isRunning();
    gPlayer.jumped = gameController.jumped();

    /*
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
    */
};

var IMAGES = [
    // World
    './data/grasstilesheet.png',
    './data/set-cave_bright.png',
    'images/meatboy.png',
    'images/MegaMan7Sheet4.png',
    'images/rock.png',
    'images/background1.jpg',
];


gamejs.preload(IMAGES);
gamejs.ready(main);
