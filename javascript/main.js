window.gravityForce = 9.8;

var gamejs = require('gamejs')
    , globals = require('./globals')
    , view = require('./view')
    , TileMap = require('./view').TileMap
    , input = require('./input')
    , Physics = require('./physics').Physics
    , Pickup = require('./actors').Pickup
    , Player = require('./actors').Player
    , EnemyManager = require('./enemy').EnemyManager
    , SpriteSheet = require('./actors').SpriteSheet;

var physics = null;

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
    gDisplay = gamejs.display.setMode([window.innerWidth, window.innerHeight]);

    physics = new Physics(document.getElementById('gjs-canvas'));
    //physics.debug();

    /*
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
    */

    gBackground = gamejs.image.load('./images/background-adventure.jpg');

    gMap = new view.Map('./data/mini.tmx', physics.world);

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
            physics.world
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
    var filename = './images/sprite-finn.png';
    var dimensions = {width: 78, height: 94};
    var player_pos = TileMap.startingPosition;
    var player_spriteSheet = new SpriteSheet(filename, dimensions);
    var player_animation = {
        'static': [0],
        'running':[1,3], //5,14],
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

    gMap.update(msDuration);
    gUnits.update(msDuration);

    // Draw!
    gDisplay.clear();
    gDisplay.blit(gBackground);

    gMap.draw(gDisplay);
    gUnits.draw(gDisplay);

    physics.step(msDuration)

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
    // For the kids!
    './images/background-adventure.jpg',
    './images/sprite-finn.png',
    './data/mininicular.png',
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
