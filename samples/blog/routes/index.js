'use strict';

exports.get = {};

exports.get.default = function (req, res) {
    var self = this;
    req.db.all('SELECT rowid, title, content FROM posts ORDER BY rowid', function(err, rows) {
        self.render({ posts : rows });
    });
}

exports.get.post = function (req, res) {
    var self = this;
    req.db.get('SELECT title, content FROM posts WHERE rowid = ?', req.params.id, function(err, row) {
        self.render({ post : row });
    });
}
exports.get.post.params = '/:id';