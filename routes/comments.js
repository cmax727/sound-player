var Q = require('q')
    , util = require('util');


exports.index = function(req, res) {
    Q.spread([
            Q.ninvoke(global.myconn, 'query', 'SELECT * FROM playlists WHERE user_id=?', [req.session.user.id]),
            Q.ninvoke(global.myconn, 'query', 'SELECT * FROM tracks WHERE id=?', [req.params.id]),
            Q.ninvoke(global.myconn, 'query', 'SELECT * FROM comments WHERE track_id=? AND user_id=?', [req.params.id, req.session.user.id])
            ],
            function (playlists, tracks, comments) {
                playlists = playlists[0];
                comments = comments[0];
                tracks = global.massageTracks(tracks);

                res.render("comments", {
                    "trackid": req.params.id,
                    "tracktitle": tracks[0].track_title_pretty,

                    "playlists": playlists,

                    "comments": comments,
                    "hascomments": comments.length > 0,

                    "tracks": tracks,
                    "hastracks": !!tracks,
                    "tracksjson": JSON.stringify(tracks)
                });
            });
};


exports.add = function(req, res) {
    global.myconn.query("INSERT INTO comments (user_id, track_id, created_on, comment) VALUES (?, ?, NOW(), ?)", [req.session.user.id, req.params.id, req.body.comment], function(err, data) {
        res.redirect('/comments/' + req.params.id);
    });
};


