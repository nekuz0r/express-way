'use strict';

var express = require('express');
var http = require('http');
var way = require('express-way');
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');
var app = express();

app.locals.basedir = __dirname + '/views';
app.configure(function () {
    app.set('port', process.env.PORT || 3030);
    app.set('views', __dirname + '/views');
    app.set('routes', __dirname + '/routes');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(function(req, res, next) {
        req.db = db;
        next();
    });
    app.use(app.router);
});

way(app, { precompileViews : true });

var httpServer = http.createServer(app);
httpServer.listen(app.get('port'), function() {
    console.log('Express server listening on port', app.get('port'));
    
    // Initialize in memory database
    db.serialize(function() {
        db.run('CREATE TABLE posts (title TEXT, content TEXT)');
        var statement = db.prepare('INSERT INTO posts VALUES (?, ?)');
        statement.run('Hello world !', 'Foo bar');
        statement.finalize();
    });
});

// Handle CTRL-C cleanly 
process.on('SIGINT', function() {
    db.close();
    process.exit();
});