var express = require('express')
  , security = require('./routes/security')
  , index = require('./routes/index')
  , dashboard = require('./routes/dashboard')
  , search = require('./routes/search')
  , playlist = require('./routes/playlist')
  , genre = require('./routes/genre')
  , download = require('./routes/download')
  , stems = require('./routes/stems')
  , comments = require('./routes/comments')
  , ratings = require("./routes/ratings")
  , userinfo = require("./routes/userinfo")
  , http = require('http')
  , path = require('path')
  , mysql = require('mysql')
  , hbs = require('express-hbs')
  , fs = require('fs');


global.myconn = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'music'
});

setTimeout(function () {
    global.myconn.query('SELECT 1+1', function () {});
}, 10000);


global.massageTracks = function (trackset) {
    return trackset[0].map(function (r) {
       r['track_title_pretty'] = r.track_title.substr(4, r.track_title.length-4).replace(/_/g, ' ').toLowerCase();
       r['genre_pretty'] = r.genre.toLowerCase();
       r['length_pretty'] = global.formatLength(r['length']);
       return r;
    });
}

global.formatLength = function(l) {
    var hours = parseInt(l/3600);
    var minutes = parseInt((l%3600)/60);
    var seconds = (l%3600)%60;

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }


    return hours + ":" + minutes + ":" + seconds;
}

var app = express();

hbs.registerHelper('_length', global.formatLength);

app.configure(function() {
    app.set('port', process.env.PORT || 3000);

    app.set('view engine', 'hbs');
    app.engine('hbs', hbs.express3({
        partialsDir: __dirname + '/views/partials',
        defaultLayout: __dirname + '/views/layout.hbs'
    }));
    app.set('views', __dirname + '/views');

    app.use(express.favicon());
    app.use(express.logger('dev'));
    app.use(express.bodyParser());
    app.use(express.methodOverride());
    app.use(express.cookieParser('constricting snakes mix cocktails')); // do not change this!
    app.use(express.session());
    app.use(app.router);
    app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function(){
    app.use(express.errorHandler());
});

app.get('/', index.index);
app.post('/login', security.login);
app.get('/logout', security.logout);

app.get('/dashboard', security.wrap(dashboard.index));

app.get('/search', security.wrap(search.index));
app.get('/searchhistory', security.wrap(search.searchhistory));

app.get('/genre/:name', security.wrap(genre.listtracks));

app.get('/playlist', security.wrap(playlist.index));
app.post('/playlist/create', security.wrap(playlist.create));
app.post('/playlist/delete', security.wrap(playlist.delete));
app.get('/playlist/:id', security.wrap(playlist.details));
app.get('/favorites', security.wrap(playlist.favorites));

app.post('/playlist/addtrack', security.wrap(playlist.addtrack));
app.post('/playlist/removetrack', security.wrap(playlist.removetrack));
app.post('/playlist/togglefavorite', security.wrap(playlist.togglefavorite));
app.get('/playlist/getfavorite/:trackid', security.wrap(playlist.getfavorite));
app.get('/playlist/getfavorites/:trackids', security.wrap(playlist.getfavorites));

app.get("/downloadhistory", security.wrap(download.history));

app.get('/download/track/:id', security.wrap(download.requesttrack));
app.post('/download/track/:id', security.wrap(download.sendtrackinfo));
app.get('/download/transfer/track/:id/:format', security.wrap(download.downloadtrack));

app.post('/download/playlist/', security.wrap(download.requestplaylist));
app.post('/download/playlist/:id', security.wrap(download.sendplaylistinfo));
app.get('/download/transfer/playlist/:id/:format', security.wrap(download.downloadplaylist));

app.get('/stems/:id', security.wrap(stems.stems));
app.get('/comments/:id', security.wrap(comments.index));
app.post('/comments/add/:id', security.wrap(comments.add));

app.post("/ratings/rate/:trackid", security.wrap(ratings.rate));
app.get("/ratings/:id", security.wrap(ratings.getrating));

app.get("/userinfo", security.wrap(userinfo.showinfo));
app.post("/userinfo", security.wrap(userinfo.saveinfo));

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});


