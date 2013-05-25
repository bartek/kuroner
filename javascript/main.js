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
    , Camera = require('./contrib/camera').Camera
    , SpriteSheet = require('./actors').SpriteSheet;

var physics = null;

// objects and units
var gPlayer = null;
var gUnits = null;

var gDisplay = null;
var gMap = null;
var gameController = null;
var gBackground = null;
var gCamera = null;
var gSurface = null;

var main = function() {
    var width = window.innerWidth
        , height = window.innerHeight;

    gDisplay = gamejs.display.setMode([width, height]);
    gSurface = new gamejs.Surface([width, height]);
    gCamera = new Camera(gSurface, {
        width: width,
        height: height
    });

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
    gCamera.update(msDuration);
    gCamera.follow([gPlayer.rect.x, gPlayer.rect.y]);

    // Draw! The idea here with the camera class is that we have to blit
    // everything onto the surface that we've given the camera class. Then
    // finally, once ready, we blit the constrainted view surface from the
    // camera module onto our main gDisplay
    gDisplay.clear();
    gSurface.blit(gBackground);

    gMap.draw(gSurface);
    gUnits.draw(gSurface);

    var view = gCamera.draw();
    gDisplay.blit(view);

    physics.step(msDuration)

    if (typeof gameController.angle() !== "undefined") {
        gPlayer.angle = gameController.angle();
    }
    gPlayer.isRunning = gameController.isRunning();
    gPlayer.hasJumped = gameController.jumped();
};

gamejs.preload(config.IMAGES);
gamejs.ready(main);
