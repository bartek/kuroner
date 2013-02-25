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
var gObjs = null;

var gDisplay = null;
var gMap = null;
var gameController = null;
var gBackground = null;

var main = function() {
    gDisplay = gamejs.display.setMode([window.innerWidth, window.innerHeight]);

    physics = new Physics(document.getElementById('gjs-canvas'));
    physics.debug();

    gBackground = gamejs.image.load('./images/background-adventure.jpg');

    gMap = new view.Map('./data/mini.tmx', physics.world);

    gUnits = new gamejs.sprite.Group();
    gObjs = new gamejs.sprite.Group();

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
            player,
            physics.world
        );
        gObjs.add(unit);
        unit.decel = 0.02;
        return unit;
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
        gObjs
    );

    var jake_sheet = new SpriteSheet('./images/sprite-jake.png', 
                                {width: 44, height: 50});
    var jake_anims = { 'static': [0] };
    objs_spawn(jake_sheet, [1050, 300], jake_anims, gPlayer);

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
    gObjs.update(msDuration);

    // Draw!
    gDisplay.clear();
    gDisplay.blit(gBackground);

    gMap.draw(gDisplay);
    gUnits.draw(gDisplay);
    gObjs.draw(gDisplay);

    physics.step(msDuration)

    if (typeof gameController.angle() !== "undefined") {
        gPlayer.angle = gameController.angle();
    }
    gPlayer.isRunning = gameController.isRunning();
    gPlayer.hasJumped = gameController.jumped();
};

var IMAGES = [
    // For the kids!
    './images/background-adventure.jpg',
    './images/sprite-finn.png',
    './images/sprite-jake.png',
    './data/mininicular.png',
    // World
    './data/grasstilesheet.png',
    './data/set-cave_bright.png',
    'images/meatboy.png',
    'images/MegaMan7Sheet4.png',
    'images/background1.jpg',
];


gamejs.preload(IMAGES);
gamejs.ready(main);
