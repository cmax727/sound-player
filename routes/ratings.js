var Q = require("q"),
    util = require("util");


exports.getrating = function(req, res) {
    global.myconn.query('SELECT * FROM ratings WHERE user_id=? AND track_id=?', [req.session.user.id, req.params.id], function (err, data) {
        if (data.length > 0) {
            // Express will figure 3 is a HTTP status code, so force it into int
            res.send(200, data[0].rating + "");

        } else {
            res.send(200, "0");
        }
    });
};


exports.rate = function(req, res) {
    global.myconn.query('INSERT INTO ratings (user_id, track_id, rating) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating=?', [req.session.user.id, req.params.trackid, req.body.rating, req.body.rating], function (err, data) {
        res.send(200);
    });
};
