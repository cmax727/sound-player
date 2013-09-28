var Q = require("q");
var util = require("util");

exports.wrap = function (callback) {
    return function (req, res) {
        if (req.session.user) {
            res.locals.user = req.session.user
            return callback(req, res);

        } else {
            res.redirect('/');
        }
    }
};

exports.callback1 = function(req, res, next){
    //res.locals.user = req.session.user;
    //process.exit(0);
    next();
}

exports.login = function (req, res) {	
	global.myconn.query('SELECT * FROM users WHERE username=? AND password=SHA1(?)', [req.body.username, req.body.password], function (err, user) {
        if (user) {
            req.session.user = user[0];
            res.redirect('/welcome');
        } else {
            res.redirect('/');
        }
    });
};


exports.logout = function (req, res) {
    req.session.user = null;

    res.redirect('/');
};



/*
 *  API Calls - consult w.merkt@gmail.com before changing lines.
 */
exports.createUser = function (req, res) { 
    global.myconn.query('INSERT INTO users(email, password, username, name) VALUES (?, SHA1(?), ?, ?);', [req.body.email, req.body.password, req.body.username, req.body.name], function (err, user) {
        console.log(err);
        if (!err) {
            res.writeHead(200);
            res.end();
        } else {
            res.writeHead(500);
            if (err.message.indexOf("ER_DUP_ENTRY") > -1) {
                res.end('Error while creating user: Username exists already.');    
            } else {
                res.end('Error while creating user: '+err);
            }            
        }
    });
};

exports.getUser = function (req, res) { 
    global.myconn.query('SELECT id, email, username, name FROM users;', function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(500);
            res.end('Error while reading user list: '+err);            
        }
    });
};

exports.deleteUser = function (req, res) { 
    global.myconn.query('DELETE FROM users WHERE id='+global.myconn.escape(req.params.id)+';', function (err, user) {
        if (!err) {
            res.writeHead(200);
            res.end();
        } else {
            res.writeHead(500);
            res.end('Error while deleting user: '+err);
        }
    });
};

exports.userSearches = function(req, res) {
    global.myconn.query('SELECT search FROM searches WHERE user_id='+global.myconn.escape(req.params.id)+';', function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(500);
            res.end('Error while getting user\'s searches: '+err);
        }
    });
};

exports.userPlaylists = function(req, res) {
    global.myconn.query('SELECT name FROM playlists WHERE user_id='+global.myconn.escape(req.params.id)+';', function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(500);
            res.end('Error while getting user\'s playlists: '+err);
        }
    });
};

exports.top10SearchTerms = function(req, res) {
    global.myconn.query('SELECT search, COUNT(*) as count FROM searches GROUP BY search ORDER BY count DESC LIMIT 10;', function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(500);
            res.end('Error while getting user\'s playlists: '+err);
        }
    });
};

exports.last100SearchTerms = function(req, res) {
    global.myconn.query('SELECT search FROM searches GROUP BY search ORDER BY id DESC LIMIT 100;', function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(500);
            res.end('Error while getting user\'s playlists: '+err);
        }
    });
};

exports.top100Downloads = function(req, res) { // todo !! - there is a download algorithm in download.history(req, res)
    global.myconn.query('SELECT tracks.track_title, COUNT(downloads.track_id) as count FROM downloads, tracks WHERE downloads.track_id=tracks.id GROUP BY track_id ORDER BY count DESC LIMIT 100;', function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(500);
            res.end('Error while getting user\'s playlists: '+err);
        }
    });
};

exports.last100SearchTermsCSV = function(req, res) {
    global.myconn.query('SELECT search FROM searches GROUP BY search ORDER BY id DESC LIMIT 100;', function (err, data) {
        if (!err) {
            res.setHeader('Content-disposition', 'attachment; filename=last100_searchterms.csv');
            res.setHeader('Content-type', 'text/csv');
            res.send("Searchterm");
            for (i in data) {
                res.send(data[i].search);
            }
            res.end();
        } else {
            res.writeHead(500);
            res.end('Error while getting user\'s playlists: '+err);
        }
    });
};

exports.top100DownloadsCSV = function(req, res) {
    global.myconn.query('SELECT tracks.track_title, COUNT(downloads.track_id) as count FROM downloads, tracks WHERE downloads.track_id=tracks.id GROUP BY track_id ORDER BY count DESC LIMIT 100;', function (err, data) {
        if (!err) {
            res.setHeader('Content-disposition', 'attachment; filename=top100_downloads.csv');
            res.setHeader('Content-type', 'text/csv');
            res.send("Tracktitle,Downloadcount");
            for (i in data) {
                res.send(data[i].track_title+","+data[i].count);
            }
            res.end();
        } else {
            res.writeHead(500);
            res.end('Error while getting user\'s playlists: '+err);
        }
    });
};

/*
 * Track Management
 */
exports.getTrackList = function(req, res) {
    global.myconn.query('SELECT id, track_title, genre, type, tempo, keywords FROM tracks ORDER BY id DESC LIMIT ?,?;', [parseInt(req.params.lower), parseInt(req.params.upper)], function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(500);
            console.log(err);
            res.end('Error while getting track list: '+err);
        }
    });
};

exports.getTrack = function(req, res) {
    global.myconn.query('SELECT * FROM tracks WHERE id=?;', [parseInt(req.params.id)], function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(500);
            console.log(err);
            res.end('Error while getting track list: '+err);
        }
    });
};

exports.setTrack = function(req, res) {
    req.body.soundalike=req.body["sound-alike"];
    var query = "UPDATE tracks SET track_title="+global.myconn.escape(req.body.track_title)+", artist_composer="+global.myconn.escape(req.body.artist_composer)+", type="+global.myconn.escape(req.body.type)+", genre="+global.myconn.escape(req.body.genre)+",subgenre_1="+global.myconn.escape(req.body.subgenre_1)+",instrument="+global.myconn.escape(req.body.instrument)+",tempo="+global.myconn.escape(req.body.tempo)+",mood="+global.myconn.escape(req.body.mood)+",scene="+global.myconn.escape(req.body.scene)+",`sound-alike`="+global.myconn.escape(req.body.soundalike)+", keywords="+global.myconn.escape(req.body.keywords)+",parent_track_title="+global.myconn.escape(req.body.parent_track_title)+" WHERE id="+global.myconn.escape(req.body.id)+";";
    global.myconn.query(query, function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(JSON.stringify(data));
        } else {
            res.writeHead(500);
            console.log(err);
            res.end('Error while getting track list: '+err);
        }
    });
};

exports.getTotalAmountofTracks = function(req, res) {
    global.myconn.query('SELECT COUNT(id) as count FROM tracks;', function (err, data) {
        if (!err) {
            res.writeHead(200);
            res.end(data[0].count.toString());
        } else {
            res.writeHead(500);
            console.log(err);
            res.end('Error while getting amount of tracks: '+err);
        }
    });
};

exports.getGenres = function(req, res) {
    global.myconn.query('select distinct(`genre`) from tracks;', function (err, data) {
        if (!err) {
            res.writeHead(200);
            var tmp=[];
            for (i in data) { 
                tmp.push(data[i].genre); 
                if (tmp.length == data.length) cb1(tmp);
            }
            
            function cb1(tmp) {
                res.end(JSON.stringify(tmp));
            }
        } else {
            res.writeHead(500);
            console.log(err);
            res.end('Error while getting genre list: '+err);
        }
    });
};

exports.getTempi = function(req, res) {
    global.myconn.query('select distinct(`tempo`) from tracks ORDER BY tempo ASC;', function (err, data) {
        if (!err) {
            res.writeHead(200);
            var tmp=[];
            for (i in data) { 
                tmp.push(data[i].tempo); 
                if (tmp.length == data.length) cb1(tmp);
            }
            
            function cb1(tmp) {
                res.end(JSON.stringify(tmp));
            }
        } else {
            res.writeHead(500);
            console.log(err);
            res.end('Error while getting genre list: '+err);
        }
    });
};

/*
 * File Upload
 */
