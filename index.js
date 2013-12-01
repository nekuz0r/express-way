'use strict';

var fs = require('fs');
var path = require('path');
var jade = require('jade');
var precompiledViews = {};
var options;

function extend (destination, source) {
    var property;
    for (property in source) {
        destination[property] = source[property];
    }
    return destination;
}

function replaceUnderscore(match) {
    return '/:' + match.slice(2);
}

function readDirectorySync (dir) {
    var files = fs.readdirSync(dir)
    .map(function(v) {
        return {
            filename: v,
            isDirectory: fs.lstatSync(path.join(dir, v)).isDirectory()
        };
    })
    .sort(function(a, b) {
        return (a.isDirectory & !b.isDirectory);
    });
    return files;
}

function loadRoutes (app, currentPath) {
    var fileIndex, file, modName, mod;
    currentPath = currentPath || app.get('routes');
    
    var files = readDirectorySync(currentPath);
    for (fileIndex = 0; fileIndex < files.length; fileIndex++) {
        file = files[fileIndex];
        if (file.filename[0] === '.') continue; //Ignore filename beginning with a dot
        
        modName = path.basename(file.filename, path.extname(file.filename));
        if (file.isDirectory === true) {
            loadRoutes(app, path.join(currentPath, file.filename));
        }
        else {
            mod = require(path.join(currentPath, modName));
            mod.baseUrl = path.join(currentPath, ((modName === 'index') ? String() : modName)).slice(app.get('routes').length);
            registerRoutes(app, mod);
        }
    }
}

function registerRoutes (app, mod) {
    var methods = [ 'get', 'post', 'put', 'head', 'delete', 'trace', 'options', 'connect', 'path' ];
    //console.log(mod.baseUrl);
    var methodName, methodObj, actionName, actionNameOrg, actionHandler, dynamicParams, localMiddlewares, finalHandler, routeUrl, viewName, viewPath;
    var globalMiddlewares = mod.middlewares || [];
    for (methodName in mod) {
        if (mod.hasOwnProperty(methodName)) {
            if (methods.indexOf(methodName) !== -1) {
                methodObj = mod[methodName];
                for (actionName in methodObj) {
                    if (methodObj.hasOwnProperty(actionName)) {
                        actionHandler = methodObj[actionName];
                        localMiddlewares = actionHandler.middlewares || [];
                        actionNameOrg = actionName;
                        if (actionName === 'default') actionName = String();
                        dynamicParams = actionHandler.params || String();
                        routeUrl = path.join(mod.baseUrl, actionName, dynamicParams).replace(/(\/_.*?\/?)/g, replaceUnderscore);
                        finalHandler = createHandler(mod.baseUrl, actionName, actionHandler);
                        app[methodName](routeUrl, globalMiddlewares.concat(localMiddlewares), finalHandler);
                        //methodObj[actionNameOrg] = extend(finalHandler, actionHandler);
                        console.log(methodName.toUpperCase(), ':', routeUrl);
                        
                        if (options.precompileViews === true) {
                            viewName = path.join(mod.baseUrl, ((actionName.length) ? actionName : 'index'));
                            if (precompiledViews[viewName] === undefined) {
                                viewPath = path.join(app.get('views'), viewName) + '.jade';
                                if (fs.existsSync(viewPath)) {
                                    console.log('PRECOMPILE', ':', viewName, '@', viewPath);
                                    precompiledViews[viewName] = jade.compile(fs.readFileSync(viewPath, { encoding: 'utf8' }), options);
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function createHandler (modUrl, actionName, actionHandler) {
    return function (req, res) {
        var viewName = path.join(modUrl, actionName) || 'index';
        var thisObject = {};
        thisObject.actionName = actionName;
        thisObject.currentLink = path.join(modUrl, actionName).replace(/(\/_.*?\/?)/g, replaceUnderscore);
        thisObject.parentLink = modUrl;
        thisObject.render = function (opts) {
            opts = opts || {};
            opts.thisPage = thisObject;
            var ofn = precompiledViews[viewName] || precompiledViews[viewName + '/index'];
            if (ofn) return res.send(ofn(opts));
            return res.render(viewName, opts);
        }
        
        //Replace placeholders
        var phName, phValue, phNameRE;
        for (phName in req.params) {
            if (req.params.hasOwnProperty(phName)) {
                phValue = req.params[phName];
                phValue = (phValue !== undefined) ? '/' + phValue : String();
                phNameRE = new RegExp('\\/:' + phName + '\\??', 'i');
                thisObject.currentLink = thisObject.currentLink.replace(phNameRE, phValue);
                thisObject.parentLink = thisObject.parentLink.replace(phNameRE, phValue);
            }
        }
        
        actionHandler.apply(thisObject, [ req, res ]);
    }
}

module.exports = function (app, opt) {
    options = opt || {};
    loadRoutes(app);
}