exports.wrap = function (callback) {
    return function (req, res) {
        if (req.session.user) {
		//console.log("security OK");
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
	console.log(req.body.username);
	
	global.myconn.query('SELECT * FROM users WHERE email=? AND password=SHA1(?)', [req.body.username, req.body.password], function (err, user) {
        if (user) {
			console.log("user", user[0]);
//			res.render('index', {layout: null});
//			console.log("hello" + user[0]);
//			return;

            req.session.user = user[0];
            res.redirect('/welcome');


        } else {
console.log("not authenticated",err);
            res.redirect('/');
        }
    });
};


exports.logout = function (req, res) {
    req.session.user = null;

    res.redirect('/');
};

