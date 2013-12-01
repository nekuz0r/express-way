express-way
===========

Express auto routing and jade precompiling

```js
var express = require('express');
var http = require('http');
var way = require('express-way');
var app = express();

app.locals.basedir = __dirname + '/views';
app.configure(function () {
    app.set('port', process.env.PORT || 3030);
    app.set('views', __dirname + '/views');
    app.set('routes', __dirname + '/routes');
    app.set('view engine', 'jade');
    app.use(app.router);
});

way(app, { precompileViews : true });

var httpServer = http.createServer(app);
httpServer.listen(app.get('port'), function() {
    console.log('Express server listening on port', app.get('port'));
});
```

License
=======

The MIT License (MIT)

Copyright (c) 2013 Gohy Leandre

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of
the Software, and to permit persons to whom the Software is furnished to do so,
subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

