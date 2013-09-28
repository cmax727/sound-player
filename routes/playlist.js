var util = require('util');
var Q = require('q');

exports.details = function (req, res) {
    global.myconn.query('SELECT * FROM playlists WHERE user_id=?',
            [req.session.user.id], function (err, playlists) {
            Q.invoke(global.myconn, 'query',
                'SELECT t1.*, COUNT(t2.id) AS stems FROM playlist_track AS pt JOIN tracks AS t1 ON pt.track_id=t1.id ' +
                    ' LEFT JOIN tracks AS t2 ON t1.track_title=t2.parent_track_title or (t1.parent_track_title <> "" and t1.parent_track_title = t2.track_title) ' +
                    ' WHERE pt.playlist_id=? GROUP BY t1.id;',
                [req.params.id], function (err, tracks) {
            playlists = playlists.map(function (e) {
                e.active = req.params.id == e.id ? 'active' : '';

                return e;
            });

            tracks = global.massageTracks([tracks]);

            res.render('playlist', { playlistid: req.params.id, playlists: playlists, tracks: tracks, hastracks: tracks.length ? true : false, tracksjson: JSON.stringify(tracks) });
        });
    });
};


exports.index = function (req, res) {

    Q.spread([
        Q.ninvoke(global.myconn, 'query', 'SELECT playlists.*, COUNT(tracks.id) AS track_count FROM playlists LEFT JOIN playlist_track ON playlists.id=playlist_track.playlist_id LEFT JOIN tracks ON playlist_track.track_id=tracks.id WHERE playlists.user_id=? GROUP BY playlists.id', [req.session.user.id]),
        Q.ninvoke(global.myconn, "query", 'SELECT t1.* FROM favorites AS f LEFT JOIN tracks AS t1 ON f.track_id=t1.id AND f.user_id=?', [req.session.user.id])
    ],
        function (playlists, favorites) {
            playlists = playlists[0];
            favorites = favorites[0];
            res.render('playlists', {
                layout:'layouts/layoutpl',
                hasplaylists: playlists.length ? true : false,
                playlists: playlists,
                favorites: favorites
             });
        });

};


exports.create = function (req, res) {
    if (req.body.name) {
        global.myconn.query('INSERT INTO playlists (user_id, name) VALUES (?, ?)',
            [req.session.user.id, req.body.name], function (err, results, field) {
            if (req.body.type == "ajax") {
                res.send("200", {newid:results.insertId, name:req.body.name});
            }else{
                res.redirect('/playlist');
            }
        });
    } else {
        if (req.body.type == "ajax") {
            res.send("404", "error");
        }else{
            res.redirect('/playlist');
        }
    }


};



// TODO: security!
exports.delete = function (req, res) {
    global.myconn.query('DELETE FROM playlist_track WHERE playlist_id=?',
            [req.body.id], function () {
                global.myconn.query('DELETE FROM playlists WHERE user_id=? AND id=?', [req.session.user.id, req.body.id], function () {
                    res.redirect('/playlist');
                });

            });
};


// TODO: security!
exports.addtrack = function (req, res) {
    global.myconn.query('INSERT INTO playlist_track (playlist_id, track_id) VALUES (?, ?)',
            [req.body.playlistid, req.body.trackid], function () {
                res.send(200);
            });
};


// TODO: security!
exports.removetrack = function (req, res) {
    global.myconn.query('DELETE FROM playlist_track WHERE playlist_id=? AND track_id=?',
            [req.body.playlistid, req.body.trackid], function () {
                res.redirect('/playlist/' + req.body.playlistid);
            });
};


exports.togglefavorite = function (req, res) {
    global.myconn.query('SELECT COUNT(*) AS total FROM favorites WHERE user_id=? AND track_id=?',
            [req.session.user.id, req.body.trackid], function (err, exists) {
                if (exists[0].total > 0) {
                    global.myconn.query('DELETE FROM favorites WHERE user_id=? AND track_id=?',
                        [req.session.user.id, req.body.trackid], function (err, exists) {
                            res.send(200, "0");
                        });

                } else {
                    global.myconn.query('INSERT INTO favorites (user_id, track_id) VALUES (?, ?)',
                        [req.session.user.id, req.body.trackid], function (err, exists) {
                            res.send(200, "1");
                        });
                }
            });
};


exports.getfavorite = function(req, res) {
    global.myconn.query('SELECT COUNT(*) AS total FROM favorites WHERE user_id=? AND track_id=?',
            [req.session.user.id, req.params.trackid], function (err, exists) {
                if (exists[0].total > 0) {
                    res.send(200, "1");
                } else {
                    res.send(200, "0");
                }
            });
};


exports.getfavorites = function (req, res) {
    global.myconn.query("SELECT track_id, COUNT(*) AS total FROM favorites WHERE user_id=? AND track_id IN (?)", [req.session.user.id, req.params.trackids.split(",")], function (err, favs) {
        res.send(200, util.inspect(favs));
    });
};


exports.favorites = function (req, res) {
    Q.spread([
            Q.ninvoke(global.myconn, 'query', 'SELECT * FROM playlists WHERE user_id=?', [req.session.user.id]),
            Q.ninvoke(global.myconn, "query", 'SELECT t1.* FROM favorites AS f JOIN tracks AS t1 ON f.track_id=t1.id AND f.user_id=?', [req.session.user.id])
            ], 
            function (playlists, tracks) {
                playlists = playlists[0];
                tracks = global.massageTracks(tracks);

                res.render('favorites', {
                    playlists: playlists,

                    tracks: tracks,
                    hastracks: tracks.length ? true : false,
                    tracksjson: JSON.stringify(tracks)
                });
            });

};

