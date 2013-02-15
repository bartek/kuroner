var box2d = require('./contrib/Box2dWeb-2.1.a.3')
    , objects = require('gamejs/utils/objects');

var Physics = exports.Physics = function(element, scale) {
    // Adjust threshold so characters don't "stick" to walls
    box2d.Box2D.Common.b2Settings.b2_velocityThreshold = 0.9;
    var gravity = new box2d.b2Vec2(0, window.gravityForce);
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


