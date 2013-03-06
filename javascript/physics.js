var box2d = require('./contrib/Box2dWeb-2.1.a.3')
    , globals = require('./globals')
    , objects = require('gamejs/utils/objects')
    , _ = require('./contrib/underscore')._;

var Physics = exports.Physics = function(element, scale) {
    // Adjust threshold so characters don't "stick" to walls
    box2d.Box2D.Common.b2Settings.b2_velocityThreshold = 0.9;
    var gravity = new box2d.b2Vec2(0, 9.8);
    this.world = new box2d.b2World(gravity, true);
    this.element = element;
    this.context = element.getContext('2d');
    this.scale = scale || 30;
    this.dtRemaining = 0;
    this.stepAmount = 1/24;
    return this;
};

Physics.prototype.step = function(dt) {
    // What do these mean? See http://www.box2d.org/manual.html#_Toc253068188
    this.world.Step(this.stepAmount,
    8, // velocity iterations
    3); // position iterations.
    this.world.ClearForces();

    if (this.debugDraw) {
        this.world.DrawDebugData();
    }
};

Physics.prototype.debug = function() {
    this.debugDraw = new box2d.b2DebugDraw();
    this.debugDraw.SetSprite(this.context);
    this.debugDraw.SetDrawScale(this.scale);
    this.debugDraw.SetFillAlpha(0.3);
    this.debugDraw.SetLineThickness(1.0);
    this.debugDraw.SetFlags(box2d.b2DebugDraw.e_shapeBit | box2d.b2DebugDraw.e_jointBit);
    this.world.SetDebugDraw(this.debugDraw);
};

// Define a body around a rect.
// Must provide a 'type', which can either be 'dynamic' or 'static'
// Then, override defaults with an options hash.
Physics.prototype.createBody = function(rect, type, userOptions) {
    var options = {
        friction: 0.2,
        density: 1.0,
        restitution: 0.2,
        padding: 30,
    };
    _.extend(options, (userOptions || {}));

    // Setup the fixture, which will be bound to the body. It defines material
    // properties such as density, friction, and restitution.
    var fixDef = new box2d.b2FixtureDef;
    fixDef.density = options.density;
    fixDef.friction = options.friction;
    fixDef.restitution = options.restitution;

    var bodyDef = new box2d.b2BodyDef;
    bodyDef.type = box2d.b2Body.b2_dynamicBody;
    bodyDef.position.x = rect.center[0] / globals.BOX2D_SCALE;
    bodyDef.position.y = rect.center[1] / globals.BOX2D_SCALE;
    bodyDef.fixedRotation = true;
    fixDef.shape = new box2d.b2PolygonShape;

    var b2Padding = options.padding;
    fixDef.shape.SetAsBox(
            (rect.width - b2Padding) * 0.5 / globals.BOX2D_SCALE,
            (rect.height - b2Padding) * 0.5 / globals.BOX2D_SCALE
    );

    var createdBody = this.world.CreateBody(bodyDef);
    createdBody.CreateFixture(fixDef);

    return createdBody;
};

