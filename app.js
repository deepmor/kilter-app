var express = require('express');
var logger = require('morgan');
var bodyParser = require('body-parser');
var mongoose = require('mongoose');
var passport = require('passport');
var config = require('./config/database');
var NotFoundError = require("./errors/NotFoundError.js");
var authUtil = require('./utils/auth');

mongoose.Promise = require('bluebird');
mongoose.connect(config.database, {useMongoClient: true});
var api = require('./routes/api');

var app = express();

app.use(logger('dev'));

// parse application/json
app.use(bodyParser.json());

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: true}));

// Enable CORS
app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers',
      'Origin, X-Requested-With, Content-Type, Accept');
  next();
});

app.use(passport.initialize());

app.get('/', function(req, res) {
  res.json({'message': 'Hi.'});
});

app.use('/api/v1', api);


// all other requests redirect to 404
app.all("*", function (req, res, next) {
  next(new NotFoundError("404"));
});

// error handler for all the applications
app.use(function (err, req, res, next) {
  var errorType = typeof err,
      code = 500,
      msg = { message: "Internal Server Error" };

  console.log(err.name);
  console.log(err.stack);

  switch (err.name) {
    case "UnauthorizedError":
    case "InternalOAuthError":
      authUtil.authFailed(res);
      break;

    case "BadRequestError":
    case "UnauthorizedAccessError":
      code = err.status;
      msg = err.inner;
      break;
    case "NotFoundError":
      code = err.status;
      msg = {msg: "404 Page Not Found"};
      break;
    case "ValidationError":
      code = 409;
      msg = err.message;
      break;
    default:
      break;
  }

  return res.status(code).json(msg);
});

module.exports = app;