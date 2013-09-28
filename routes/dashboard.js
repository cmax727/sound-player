var util = require('util')
    , Q = require('q');

exports.index = function (req, res) {
    top_genre = req.params.genre;
    if ( top_genre == "All" || top_genre == undefined){
        top_genre = "All";
        genre_query = "%";
    }else{
        genre_query = top_genre;
    }

    Q.spread([
        Q.ninvoke(global.myconn, "query", 'SELECT * FROM playlists WHERE user_id=?', [req.session.user.id]),
        Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT(search) FROM searches WHERE user_id=? ORDER BY id DESC LIMIT 5', [req.session.user.id]),
//        Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT(CONCAT(top_genre,' - ',genre)) as genre FROM tracks WHERE top_genre like ? ORDER BY genre', genre_query),
//original        Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT(genre) FROM tracks WHERE top_genre like ? ORDER BY genre', genre_query),
        Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT(full_genre) as genre, genre as genre_link FROM tracks WHERE top_genre like ? ORDER BY full_genre', genre_query),
        Q.ninvoke(global.myconn, "query", 'SELECT DISTINCT(top_genre) FROM tracks WHERE 1=1 ORDER BY top_genre'),



    ], function (playlists, searches, genres, top_genres) {
        top_genres[0].unshift({top_genre : "All"});
        top_genre == top_genre ? top_genre : "All";

        top_genres[0].forEach(function(el){
            el['class'] = top_genre == el["top_genre"] ? " active " : "";
        })

        res.render('dashboard', {
            playlists: playlists[0],
            searches: searches[0].reverse(),
            genres: genres[0],
            top_genres: top_genres[0]

        });
    });
};

