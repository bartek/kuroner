var gamejs = require('gamejs')
    , globals = require('./globals')
    , config = require('./config')
    , view = require('./view')
    , TileMap = require('./view').TileMap
    , input = require('./input')
    , Physics = require('./physics').Physics
    , Pickup = require('./actors').Pickup
    , Player = require('./actors').Player
    , EnemyManager = require('./enemy').EnemyManager
    , SpriteSheet = require('./actors').SpriteSheet;

var physics = null;

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

    gBackground = gamejs.image.load('./images/background-adventure.jpg');

    gMap = new view.Map('./data/mini.tmx', physics.world);

    gUnits = new gamejs.sprite.Group();

    // Spawn our main player.
    gPlayer = Player.Spawn(config.actors.finn, TileMap.startingPosition, physics);
    gUnits.add(gPlayer);

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
    gPlayer.hasJumped = gameController.jumped();
};

gamejs.preload(config.IMAGES);
gamejs.ready(main);
