'use strict';

var _ = require('underscore');

exports.get = {};
exports.post = {};

exports.get.default = function (req, res) {
    var self = this;
    req.db.all('SELECT rowid, title, content FROM posts ORDER BY rowid', function(err, rows) {
        self.render({ posts : rows });
    });
}

exports.get.create = function (req, res) {
    this.render();
}

exports.post.create = function (req, res) {
    var self = this;
    req.db.run('INSERT INTO posts VALUES (?, ?)', _.values(req.body), function(err) {
        if (err) return res.send(500);
        return res.redirect(self.parentLink);
    });
}

exports.get.edit = function (req, res) {
    var self = this;
    req.db.get('SELECT title, content FROM posts WHERE rowid = ?', req.params.id, function(err, row) {
        self.render({ values : row });
    });
}
exports.get.edit.params = '/:id';

exports.post.edit = function (req, res) {
    var self = this;
    req.body.rowid = req.params.id;
    req.db.run('UPDATE posts SET title = ?, content = ? WHERE rowid = ?', _.values(req.body), function(err) {
        if (err) return res.send(500);
        res.redirect(self.parentLink);
    });
}
exports.post.edit.params = '/:id';

exports.get.delete = function (req, res) {
    var self = this;
    req.db.run('DELETE FROM posts WHERE rowid = ?', req.params.id, function(err) {
        if (err) return res.send(500);
        return res.redirect(self.parentLink);
    });
}
exports.get.delete.params = '/:id';
