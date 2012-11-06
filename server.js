var express = require('express')
    , mu = require('mu2');

mu.root = __dirname;

var app = express();
app.use(express.bodyParser());

function renderPage(res, template, variables) {
    var stream = mu.compileAndRender(template, variables);
    res.header('Content-Type', 'text/html');
    stream.pipe(res);
}

app.get('/', function(req, res) {
    renderPage(res, 'index.html', {});
});

// TODO: Move these all into a /static/ dir.
app.use('/javascript', express.static(__dirname + '/javascript'));
app.use('/data', express.static(__dirname + '/data'));
app.use('/images', express.static(__dirname + '/images'));

app.listen(4000);
console.log("Listening on port 4000");
