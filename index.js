var fs = require('fs');
var path = require('path');

var verbs = [ 'get', 'post', 'put', 'head', 'delete', 'trace', 'options', 'connect', 'path' ];

function readModules(basePath) {
  var _files = [];
  var _directories = [];
  var _underscore_directories = [];
  
  var files = fs.readdirSync(basePath);
  for (var index = 0; index < files.length; index++) {
    if (files[index][0] === '.') {
      continue;
    }
    
    var stats = fs.statSync(path.join(basePath, files[index]));
    
    if (stats.isDirectory()) {
      var res = readModules(path.join(basePath, files[index]));
      if (files[index][0] === '_') {
        _underscore_directories = _underscore_directories.concat(res);
      }
      else {
        _directories = _directories.concat(res);
      }
    }
    else {
      if (path.extname(files[index]) === '.js') {
        _files.push(path.join(basePath, path.basename(files[index], path.extname(files[index]))));
      }
    }
  }
  
  return _files.concat(_directories).concat(_underscore_directories);
}

function createRouteHandler(baseURL, action, actionHandler) {
  return function (req, res) {
    var viewName, context;
    
    viewName = path.join(baseURL, action);
    context = {};
    context.actionName = action;
    context.currentLink = viewName;
    context.parentLink = baseURL;
    if (!action) {
      context.parentLink = context.parentLink.substring(0, context.parentLink.lastIndexOf('/'));
    }
    
    context.render = function (opts) {
      opts = opts || {};
      opts.thisPage = context;
      return res.render(viewName.replace(':', '_').substr(1), opts);
    };
    
    var placeholderName, placeholderValue, placeholderRegexp;
    for (placeholderName in req.params) {
      if (req.params.hasOwnProperty(placeholderName)) {
        placeholderValue = '/' + req.params[placeholderName];
        placeholderRegexp = new RegExp('\\/:' + placeholderName + '\\??', 'i');
        context.currentLink = context.currentLink.replace(placeholderRegexp, placeholderValue);
        context.parentLink = context.parentLink.replace(placeholderRegexp, placeholderValue);
      }
    }
    
    return actionHandler.apply(context, [ req, res ]);
  };
}

function registerModule(app, module) {
  var globalMiddlewares = module.middlewares || [];
  for (var verb in module) {
    if (module.hasOwnProperty(verb) && verbs.indexOf(verb) !== -1) {
      var verbObj = module[verb];
      for (var action in verbObj) {
        if (verbObj.hasOwnProperty(action)) {
          var actionHandler = verbObj[action];
          var localMiddlewares = actionHandler.middlewares || [];
          action = (action === 'default') ? String() : action;
          var actionParams = actionHandler.params || String();
          var route = path.join(module.baseURL, action, actionParams);
          var routeHandler = createRouteHandler(module.baseURL, action, actionHandler);
          console.log(verb, '=>', route);
          app[verb](route, globalMiddlewares.concat(localMiddlewares), routeHandler);
        }
      }
    }
  }
}

function loadModules(app) {
  var path = app.get('routes');
  var modules = readModules(path);

  for (var index = 0; index < modules.length; index++) {
    var module = require(modules[index]);
    module.baseURL = modules[index].substr(path.length).replace(/\/index$/g, String()).replace(/\/_.*?\/?/g, "/:") || '/';
    registerModule(app, module);
  }
}

module.exports = function (app) {
  loadModules(app);
};