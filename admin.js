var express = require('express')
  , security = require('./routes/security')
  , index = require('./routes/index')
  , dashboard = require('./routes/dashboard')
  , search = require('./routes/search')
  , search2 = require('./routes/search2')
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

var formidable = require('formidable'),
  multipart = require('multipart'),
  util = require('util');

var exec = require('child_process').exec;


global.myconn = mysql.createConnection({
    host: 'localhost'
    , database: 'node_music'

    //,user: 'root'
    //,password: ''

    , user: 'musicadmin'
    , password: 'm4$!c@dm!n'
    , multipleStatements: true // enabled for input of track data, be aware that you need to escape carefully now!
});
global.myconn.connect();

/*
 * Debug & Development Mode
 */
var debug = true;



setTimeout(function () {
    global.myconn.query('SELECT 1+1', function (err, rows) {
      if (err) throw err;
      else if (rows.length > 0) console.log("MySQL Connection established");
    });
}, 10000);


global.massageTracks = function (trackset) {
    return trackset[0].map(function (r) {
        require ('path');

        ttp = r.track_title.replace(/^(SIG[0-9]{0,2}_[0-9][0-9]_)/, '').replace(/^(SIG[0-9]{0,2}_)/, '').replace(/_/g, ' ').toLowerCase();
        r['track_title_pretty'] = path.basename(ttp, path.extname(ttp));
        r['basename'] = path.basename(r['track_title'], path.extname(r['track_title']));
        r['wave-on'] = r['basename'] + "-on.png";
        r['wave-off'] = r['basename'] + "-off.png";
        r['genre_pretty'] = r.genre.toLowerCase() + " - " + r.top_genre.toLowerCase();
        r['length_pretty'] = global.formatLength(r['length']);
        return r;
    });
}

global.formatLength = function(l) {
    var hours = parseInt(l/3600);
    var minutes = parseInt((l%3600)/60);
    var seconds = ((l%3600)%60).toFixed(2);

    if (hours < 10) { hours = "0" + hours; }
    if (minutes < 10) { minutes = "0" + minutes; }
    if (seconds < 10) { seconds = "0" + seconds; }

    return hours + ":" + minutes + ":" + seconds;
}

var app = express();

hbs.registerHelper('_length', global.formatLength);

app.configure(function() {
    if (debug) {
      app.set('port', process.env.PORT || 80); // 80
      app.use(express.logger('dev'));
    } else {
      app.set('port', process.env.PORT || 80);
    }

    app.set('view engine', 'hbs');
    app.engine('hbs', hbs.express3({
        partialsDir: __dirname + '/views/partials',
        defaultLayout: __dirname + '/views/layouts/layout.hbs',
        views:  __dirname + '/views'
    }));

    //app.use(express.favicon());
    app.use(express.bodyParser({ keepExtensions: true, uploadDir: "uploads" }));
    app.use(express.methodOverride());
    app.use(express.cookieParser('constricting snakes mix cocktails')); // do not change this!
    app.use(express.compress());
    app.use(express.session());
    app.use(security.callback1);

    app.use(express.static(path.join(__dirname, 'public')));

    app.use(express.bodyParser({ uploadDir:__dirname + '/public/uploads' })); // todo:

    app.use(app.router);
});


app.configure('development', function(){
    app.use(express.errorHandler());
});


app.get('/', index.index);
app.get('/welcome', security.wrap(index.welcome));

app.post('/login', security.login);
app.get('/logout', security.logout);

app.get('/dashboard/:genre', security.wrap(dashboard.index));
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
app.post('/download/playlist/:playlistid', security.wrap(download.sendplaylistinfo));
app.get('/download/transfer/playlist/:id/:format', security.wrap(download.downloadplaylist));

app.get('/download/transfer/favorites/:format', security.wrap(download.downloadfavorites));

app.get('/stems/:id', security.wrap(stems.stems));
app.get('/comments/:id', security.wrap(comments.index));
app.post('/comments/add/:id', security.wrap(comments.add));

app.post("/ratings/rate/:trackid", security.wrap(ratings.rate));
app.get("/ratings/:id", security.wrap(ratings.getrating));

app.get("/userinfo", security.wrap(userinfo.showinfo));
app.post("/userinfo", security.wrap(userinfo.saveinfo));


/*
 *  API calls - consult w.merkt@gmail.com before changing
 */
app.get("/adminpanel", security.wrap(function(req,res) { res.sendfile('admin_panel/admin.html'); }));

app.post("/api/user", security.wrap(security.createUser));
app.put("/api/user", security.wrap(security.createUser));
app.get("/api/user", security.wrap(security.getUser));
app.delete("/api/user/:id", security.wrap(security.deleteUser));
app.get("/api/user/:id/playlists", security.wrap(security.userPlaylists));
app.get("/api/user/:id/searches", security.wrap(security.userSearches));
app.get("/api/search/top10", security.wrap(security.top10SearchTerms));
app.get("/api/search/last100", security.wrap(security.last100SearchTerms));
app.get("/api/downloads/top100", security.wrap(security.top100Downloads));
app.get("/api/search/last100.csv", security.wrap(security.last100SearchTermsCSV));
app.get("/api/downloads/top100.csv", security.wrap(security.top100DownloadsCSV));
app.get("/api/tracks/count", security.wrap(security.getTotalAmountofTracks));
app.get("/api/genres", security.wrap(security.getGenres));
app.get("/api/tempi", security.wrap(security.getTempi));
app.get("/api/track/:id", security.wrap(security.getTrack));
app.put("/api/track/:id", security.wrap(security.setTrack));
app.post("/api/track/:id", security.wrap(security.setTrack));
app.get("/api/tracks/:lower/:upper", security.wrap(security.getTrackList));
app.get("/api/search", security.wrap(search2.index));

/**
  * MP3 file fix (description: sometimes it looks for files with the double ending .mp3.mp3)
  */
app.get("/audio_files/:name.mp3.mp3", function(req, res) {
  console.log("double mp3 requested", req.params.name);
  res.sendfile(path.join(__dirname,"public","audio_files",req.params.name,".mp3"));
});

/*
 * Update / Replace track data
 */
app.post("/api/trackdata", function (request, response) {
  var newTrackData = {};
  newTrackData.path = request.files.file.path;
  newTrackData.name = request.files.file.name;
  newTrackData.replace = (request.body.action=="replace")?true:false;

  var _table = "tracks2"; // todo: change to real table

  fs.rename(newTrackData.path, path.join(__dirname, "trackdata_conv", path.basename(newTrackData.path)), function(err) {
    if (err) {
      console.log("Error", err);
      response.writeHead(500);response.end();
    } else {
      exec('./trackdata_conv/xlsx2csv.py "./trackdata_conv/'+path.basename(newTrackData.path)+'" > "./trackdata_conv/'+path.basename(newTrackData.path,".xlsx")+'.csv"', function (error, output) {
        if (!error) {
          var sqlQuery = "";
          if (newTrackData.replace) {
            sqlQuery = "TRUNCATE TABLE "+_table+";"
          }
          sqlQuery += "LOAD DATA LOCAL INFILE '"+path.join(__dirname,"trackdata_conv",path.basename(newTrackData.path,".xlsx"))+".csv' REPLACE INTO TABLE "+_table+" FIELDS TERMINATED BY ',' ENCLOSED BY '\"' LINES TERMINATED BY '\n' IGNORE 1 LINES (track_title,artist_composer,album,type,genre,subgenre_1,subgenre_2,subgenre_3,subgenre_4,instrument,tempo,mood,scene,`sound-alike`,keywords,parent_track_title);";
          sqlQuery += "UPDATE "+_table+" SET full_genre=genre, top_genre=substring_index(genre,' - ',1), genre=substring_index(genre,' - ',-1);";

          global.myconn.query(sqlQuery, function(err, rows) {
            console.log(err || rows);
            if (!err) {
              response.writeHead(200);response.end(sqlQuery);
            } else {
              response.writeHead(500);response.end(JSON.stringify(err));
            }
          });
        } else {
          console.log("Error", error);
          response.writeHead(500);
          response.end(JSON.stringify(error));
        }
      });
    }
  });
});

/*
 * Upload Tracks
 */
var finishedFileUploads = [];

app.post("/api/upload", function (request, response) {
  finishedFileUploads = fs.readdirSync(path.join(__dirname, "public", "audio_files"));

  if (request.files.file[1]==undefined) {
    _postTrackUpload(request.files.file);
  } else {
    for (i=0;i<request.files.file.length;i++) {
      _postTrackUpload(request.files.file[i]);
    }
  }
  if (request.files.file.length != undefined) console.log("Posted: ", request.files.file.length);

  response.end();
});

function _postTrackUpload(file) {
  // Check whether file was already treated
  if (finishedFileUploads.indexOf(file.name) > -1) {
    // already uploaded & treated
    console.log("A file with this name has already been uploaded");
  } else {
    tmp_path = file.path;
    target_path = path.join(__dirname, "public", "audio_files", file.name);
    fs.rename(tmp_path, target_path, function(err) {
      if (err) console.log("Error", err);
      exec('./generate.sh "'+path.join(__dirname, "public", "audio_files", file.name)+'" "'+path.join(__dirname, "public", "audio_images")+'"', function (error, output) {
        if (!error) {
          console.log(output);
        } else {
          console.log("Error", error);
        }
      });

      exec('./convert-single.sh "'+path.join(__dirname, "public", "audio_files", file.name)+'" "'+path.join(__dirname, "public", "audio_files")+'"', function (error, output) {
        if (!error) {
          console.log(output);
        } else {
          console.log("Error", error);
        }
      });

      finishedFileUploads.push(file.name);

      console.log("File uploaded: ", file.name);
      // todo: call length
    });  
  }
};

http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});