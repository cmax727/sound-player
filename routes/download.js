var Q = require("q");
var util = require("util");
var email = require("emailjs");
var fs = require("fs");
var archiver = require('archiver');


exports.history = function (req, res) {
    Q.spread([
            Q.ninvoke(global.myconn, 'query', 'SELECT * FROM playlists WHERE user_id=?', [req.session.user.id]),
            Q.ninvoke(global.myconn, "query", 'SELECT downloads.*, tracks.track_title, playlists.name FROM downloads LEFT JOIN tracks ON downloads.track_id=tracks.id LEFT JOIN playlists ON downloads.playlist_id=playlists.id WHERE downloads.user_id=?', [req.session.user.id])
            ],
            function (playlists, history) {
                playlists = playlists[0];
                history = history[0].map(function (r) {
                    if (r.track_title) {
                        r['track_title_pretty'] = r.track_title.replace(/^(SIG[0-9]{0,2}_)/, '').replace(/_/g, ' ').toLowerCase();
                    }

                    return r;
                });

                res.render("downloadhistory", {
                    "playlists": playlists,
                    
                    "hashistory": history.length > 0,
                    "history": history
                });
            }, function (fail) {
                util.debug("shit: " + util.inspect(fail));
            });
    
};


exports.downloadtrack = function (req, res) {
    global.myconn.query("SELECT * FROM tracks WHERE id=?", [req.params.id], function (err, data) {
        if (data.length > 0) {
            path = require('path');
            global.myconn.query("INSERT INTO downloads (created_on, user_id, track_id) VALUES (NOW(),?,?)",
                [req.session.user.id, req.params.id], function (err, downloads) {
                    var filename = path.basename(data[0].track_title, path.extname(data[0].track_title)) + (req.params.format == 1 ? '.aiff' : '.mp3');
                    var file = 'public/audio_files/' + filename;
                    file = path.resolve(file);
                    res.status(200).attachment(filename).sendfile(file);
                });
        } else {
            res.redirect('/');
        }
    });
};

exports.downloadplaylist = function (req, res) {
    global.myconn.query("SELECT tracks.track_title FROM playlist_track LEFT JOIN tracks ON playlist_track.track_id=tracks.id WHERE playlist_track.playlist_id=?", [req.params.id], function (err, data) {
        path = require('path');
        if (data.length > 0) {
            global.myconn.query("INSERT INTO downloads (created_on, user_id, playlist_id) VALUES (NOW(),?,?)",
                [req.session.user.id, req.params.id], function (err, downloads) {
                    var timestamp = new Date().getTime();
                    var output = fs.createWriteStream('Archive_'+timestamp+'.zip');
                    var archive = archiver('zip',{zlib:{level:9}});

                    archive.on('error', function(err) {
                      console.log(error);
                      res.writeHead(500);
                      res.end(err);
                    });

                    archive.pipe(output);

                    var format = req.params.format == 1 ? ".aiff" : ".mp3";

                    var files = data.map(function (e) {
                        if (e.track_title!=null) {
                            archive.append(fs.createReadStream("public/audio_files/" + path.basename(e.track_title, ".mp3") + format), { name: path.basename(e.track_title, ".mp3") + format });
                        }
                    });

                    archive.finalize(function(err, written) {
                      if (err) throw err;
                      console.log(written + ' total bytes written');
                      res.attachment("Archive.zip").sendfile('Archive_'+timestamp+'.zip');
                    });
                });
        } else {
            res.redirect('/');
        }
    });
};

exports.downloadfavorites = function (req, res) {
    global.myconn.query("SELECT tracks.track_title FROM favorites LEFT JOIN tracks ON favorites.track_id=tracks.id WHERE favorites.user_id=?", [req.session.user.id], function (err, data) {

        path = require('path');
        if (data.length > 0) {
            global.myconn.query("INSERT INTO downloads (created_on, user_id, playlist_id) VALUES (NOW(),?,?)",
                [req.session.user.id, "userfavs_"+req.session.user.id], function (err, downloads) {
                    var timestamp = new Date().getTime();
                    var output = fs.createWriteStream('Favorites_'+timestamp+'.zip');
                    var archive = archiver('zip',{zlib:{level:9}});

                    archive.on('error', function(err) {
                      console.log(error);
                      res.writeHead(500);
                      res.end(err);
                    });

                    archive.pipe(output);

                    var format = req.params.format == 1 ? ".aiff" : ".mp3";

                    var files = data.map(function (e) {
                        if (e.track_title!=null) {
                            archive.append(fs.createReadStream("public/audio_files/" + path.basename(e.track_title, ".mp3") + format), { name: path.basename(e.track_title, ".mp3") + format });
                        }
                    });

                    archive.finalize(function(err, written) {
                      if (err) throw err;
                      console.log(written + ' total bytes written');
                      res.attachment("Favorites.zip").sendfile('Favorites_'+timestamp+'.zip');
                    });
                });
        } else {
            res.redirect('/');
        }
    });
};


exports.requestplaylist = function(req, res) {
    Q.spread([
            Q.ninvoke(global.myconn, 'query', 'SELECT * FROM playlists WHERE user_id=?', [req.session.user.id]),
            Q.ninvoke(global.myconn, "query", 'SELECT * FROM playlists WHERE id=?', [req.body.id])
            ],
            function (playlists, playlist) {
                playlists = playlists[0];
                playlist = playlist[0];

                if (false && req.body.type == "ajax") {
                    res.send("200", {result:"OK"});
                }else{
                    res.render("requestplaylist", {
                        "playlists": playlists,
                        "title": playlist[0].name,
                        "id": playlist[0].id,
                        "target": req.session.user.email
                    });
                }
            });
};


exports.requesttrack = function(req, res) {
    Q.spread([
            Q.ninvoke(global.myconn, 'query', 'SELECT * FROM playlists WHERE user_id=?', [req.session.user.id]),
            Q.ninvoke(global.myconn, "query", 'SELECT * FROM tracks WHERE id=?', [req.params.id])
            ],
            function (playlists, track) {
                playlists = playlists[0];
                track = global.massageTracks(track);

                res.render("requestfile", {
                    "playlists": playlists,

                    "title": track[0].track_title_pretty,
                    "id": track[0].id,
                    "target": req.session.user.email
                });
            });
};

exports.sendtrackinfo = function(req, res) {
    var body = "Your MP3 file can be downloaded from: http://stplayer.yitzak.com/download/transfer/track/" + req.body.trackid + "/" + req.body.format;

    var server = email.server.connect({
       user:    "stplayer@yitzak.com", 
       password:"YW9atGp_hMfJ9arbmyJIPQ", 
       host:    "smtp.mandrillapp.com", 
       ssl:     true
    });

    server.send({
        text:    body, 
        from:    "Signature Tracks - Signature Player Download <music@signaturetracks.com>", 
        to:      req.body.target,
        subject: "Signature Tracks: Track Download from Signature Player"
    }, function(err, message) {
        console.log(err || message);
        res.redirect('/download/track/' + req.body.trackid);
    });
};


exports.sendplaylistinfo = function(req, res) {
    var body = "<h2>Signature Tracks</h2><h4><em>From the Signature Player:</em></h4><p>Your playlist archive can be downloaded from the link below:</p> <h5><strong>http://stplayer.yitzak.com/download/transfer/playlist/" + req.body.playlistid + "/</strong></h5>" + req.body.format;

    var server = email.server.connect({
       user:    "stplayer@yitzak.com", 
       password:"YW9atGp_hMfJ9arbmyJIPQ", 
       host:    "smtp.mandrillapp.com", 
       ssl:     true
    });

    server.send({
        text:    body, 
        from:    "Signature Tracks - Signature Player Download <music@signaturetracks.com>",
        to:      req.body.target,
        subject: "Signature Tracks: Playlist Download from Signature Player"
    }, function(err, message) {
        if ( err)
            res.send("200", err.message);
        else
            res.redirect('/playlist');
    });
};