var util = require('util');
var Q = require('q');

exports.listtracks = function (req, res) {
    Q.spread([
            Q.ninvoke(global.myconn, 'query', 'SELECT * FROM playlists WHERE user_id=?', [req.session.user.id]),
            Q.ninvoke(global.myconn, "query", 'SELECT t1.*, COUNT(t2.id) AS stems , f.id as idfavor FROM tracks AS t1  ' +
                ' LEFT JOIN tracks AS t2 ON t1.track_title=t2.parent_track_title or (t1.parent_track_title <> "" and t1.parent_track_title = t2.track_title) ' +
                ' LEFT JOIN favorites as f ON f.user_id=?  and f.track_id=t1.id WHERE t1.genre=? GROUP BY t1.id',[req.session.user.id, req.params.name]),

            Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT CONCAT(top_genre," - ",genre) as genre        FROM tracks ORDER BY 1'),
//            Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT genre        FROM tracks ORDER BY 1'),
            Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT instrument   FROM tracks ORDER BY 1'),
            Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT tempo        FROM tracks ORDER BY 1'),
            Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT type         FROM tracks ORDER BY 1')
        ],

        function (playlists, tracks, genres, instruments, tempos, types) {
            playlists = playlists[0];
            tracks = global.massageTracks(tracks);

console.log(genres);

for (i in tracks) {
	tracks[i].genre = tracks[i].genre + " - " + tracks[i].top_genre;
}

            genres = massageFilter(genres, 'genre', req.query.genre);
            instruments = massageFilter(instruments, 'instrument', req.query.instrument);
            tempos = massageFilter(tempos, 'tempo', req.query.tempo);
            types = massageFilter(types, 'type', req.query.type);


            res.render('genre', {
                playlists: playlists,

                tracks: tracks,
                hastracks: !!tracks,
                tracksjson: JSON.stringify(tracks),

                genres: genres,
                instruments: instruments,
                tempos: tempos,
                types: types


            });
        }).fail(function (err) {
            util.debug("Failed in promise: " + err);
        });
};

function massageFilter(dataset, field, current) {
    return dataset[0].map(function (i) {
        if (i[field] == current) { i.selected = 'selected="selected"'; }
        return i;
    });
}

