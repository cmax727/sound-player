var limestone = require("limestone").SphinxClient();
var util = require('util');
var Q = require('q');


exports.index = function (req, res) {
    if (!req.query.q) {
        res.redirect('/');
        return;
    }

    var ftsearch = {
        indexes: 'tracks',
        query: req.query.q,
        limit: 1000,
        weights: [{track_title : 30}, {keywords: 15}, {scene:11}, {mood:8}, {genre:6}, {"sound-alike": 3}]
        //sort: limestone.Sphinx.sortMode.EXTENDED,
        // //sortby: "track_title ASC, keywords ASC"
    };

    var shsearch = {
        indexes: 'searches',
        query: req.query.q,
        limit: 10
    };


    limestone.connect("9312", true, function (err) {
        Q.spread([ Q.ninvoke(limestone, "query", ftsearch),
            Q.ninvoke(limestone, "query", shsearch)],
            function (ftresult, shresult) {
                if (ftresult.matches.length == 0) {
                    // Fake value to satisfy IN operator in the query below
                    ftresult.matches = [{doc: -1}];
                }

                if (shresult.matches.length == 0) {
                    shresult.matches = [{doc: -1}];
                }

                var ids = ftresult.matches.map(function (x) { return x.doc; });

//console.log('SELECT t1.*, COUNT(t2.id) AS stems FROM tracks AS t1 ' +
//                ' LEFT JOIN tracks AS t2 ON t1.track_title=t2.parent_track_title or (t1.parent_track_title <> "" and t1.parent_track_title = t2.track_title) ' +
//                ' WHERE t1.id IN ('+ids+')  GROUP BY t1.id ORDER BY field(t1.id, '+ids+')');

                return [
            Q.ninvoke(global.myconn, "query", 'SELECT * FROM playlists WHERE user_id=?', [req.session.user.id]),

            Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT genre        FROM tracks ORDER BY 1'),
            Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT instrument   FROM tracks ORDER BY 1'),
            Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT tempo        FROM tracks ORDER BY 1'),
            Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT type         FROM tracks ORDER BY 1'),

            //Q.ninvoke(global.myconn, "query", 'SELECT t1.*, COUNT(t2.id) AS stems FROM tracks AS t1 LEFT JOIN tracks AS t2 ON t1.track_title=t2.parent_track_title WHERE t1.id IN (?) AND t1.genre LIKE ? AND t1.instrument LIKE ? AND t1.tempo LIKE ? AND t1.type LIKE ? GROUP BY t1.id ' +
            //    'ORDER BY field(id, ?)' , [

            Q.ninvoke(global.myconn, "query", 'SELECT t1.*, COUNT(t2.id) AS stems FROM tracks AS t1 ' +
                ' LEFT JOIN tracks AS t2 ON t1.track_title=t2.parent_track_title or (t1.parent_track_title <> "" and t1.parent_track_title = t2.track_title) ' +
                ' WHERE t1.id IN (?)  GROUP BY t1.id ORDER BY field(t1.id, ?)' , [
                    ids,
                    ids
                ]),
//Q.ninvoke(global.myconn, "query", 'SELECT * from tracks WHERE id IN (?);', [ids]),

            Q.ninvoke(global.myconn, "query", 'INSERT INTO searches (user_id, search) VALUES (?, ?)', [req.session.user.id, req.query.q]),

            Q.ninvoke(global.myconn, "query", "SELECT DISTINCT(search) FROM searches WHERE id+1000000 IN (?)",
                    [ shresult.matches.map(function (x) { return x.doc; }) ])
                ];

            }).spread(function (playlists, genres, instruments, tempos, types, tracks, save, searches) {
//            }).spread(function (playlists, genres, instruments, tempos, types, save, searches) {
                searches = searches[0];
                playlists = playlists[0];

                genres = massageFilter(genres, 'genre', req.query.genre);
                instruments = massageFilter(instruments, 'instrument', req.query.instrument);
                tempos = massageFilter(tempos, 'tempo', req.query.tempo);
                types = massageFilter(types, 'type', req.query.type);

                tracks = global.massageTracks(tracks);

                var data = {
                    genres: genres,
                instruments: instruments,
                tempos: tempos,
                types: types,

                playlists: playlists,

                search: req.query.q,
                tracks: tracks,
                hastracks: !!tracks,
                tracksjson: JSON.stringify(tracks),

                searches: searches
                };

                res.render('search', data);

                limestone.disconnect();

            }).fail(function (err) {
                util.debug("Failed in promise: " + err);
            });
    });
};


function massageFilter(dataset, field, current) {
    return dataset[0].map(function (i) {
        if (i[field] == current) { i.selected = 'selected="selected"'; }
        return i;
    });
}




exports.searchhistory = function (req, res) {
    global.myconn.query('SELECT DISTINCT(search) FROM searches WHERE user_id=? ORDER BY id DESC LIMIT 50',
            [req.session.user.id], function (err, searches) {
                res.render('searchhistory', {
                    hassearches: searches.length ? true : false,
                searches: searches.reverse()
                });
            });
}


