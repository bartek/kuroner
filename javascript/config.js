var config = exports.config = {
  debug: true
}

var actors = exports.actors = {
    finn: {
        filename: './images/sprite-finn.png',
        dimensions: {
            width: 78,
            height: 94
        },
        animation: {
            'static': [0],
            'running': [1,3],
            'jumping': [18]
        }
    }
}

var IMAGES = exports.IMAGES =  [
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
]
