var gamejs = require('gamejs');
var view = require('./view');

gamejs.preload(['./data/tilesheet.png']);

gamejs.ready(function() {
    gamejs.display.setCaption('Game Off')
    var display = gamejs.display.setMode([800, 600]);

    var map = new view.Map('./data/example.tmx');

    // The game loop
    var tick = function(msDuration) {
        gamejs.event.get().forEach(function(event) {
            map.handle(event);
        });
        map.update(msDuration);
        display.clear();
        map.draw(display);
    };
    gamejs.time.fpsCallback(tick, this, 60);
});
