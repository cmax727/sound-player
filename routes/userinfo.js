var Q = require("q");
var util = require("util");


exports.showinfo = function (req, res) {
    util.debug(util.inspect(req.session.user));
    res.render("showuserinfo", req.session.user);
};


exports.saveinfo = function (req, res) {
    global.myconn.query('UPDATE users SET name=?, company=?, phone=? WHERE id=?',
            [req.body.name, req.body.company, req.body.phone, req.session.user.id],
            function () {
                if (req.body.pass1 !== "" && req.body.pass1 == req.body.pass2) {
                    global.myconn.query('UPDATE users SET password=SHA1(?) WHERE id=?',
                        [req.body.pass1, req.session.user.id], function () {
                            req.session.user = null;
                            res.redirect('/');
                        });
                } else {
                    res.redirect("/");
                }
            });
};
