var JwtStrategy = require('passport-jwt').Strategy,
    ExtractJwt = require('passport-jwt').ExtractJwt;

// load up the user model
var User = require('../models/user');

var config = require('../config/database'); // get db config file
var facebook = require('../config/facebook');
var linkedin = require('../config/linkedin');
var FacebookTokenStrategy = require('passport-facebook-token');
var LinkedInTokenStrategy = require('passport-linkedin-token-oauth2').Strategy;

// TODO: REmove the .Strategy if not required. ***********---------------<<<<<

module.exports = function(passport) {
  var opts = {};
  opts.jwtFromRequest = ExtractJwt.fromAuthHeaderWithScheme('jwt');
  opts.secretOrKey = config.secret;

  // Passport Local Mongoose
  passport.use(User.createStrategy());
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  passport.use(new FacebookTokenStrategy({
        clientID: facebook.clientID,
        clientSecret: facebook.clientSecret,
        passReqToCallback: true,
      },
      function(req, accessToken, refreshToken, profile, done) {
        User.upsertFbUser(req, accessToken, refreshToken, profile,
            function(err, user) {
              return done(err, user);
            });
      })
  );

  var myLinkedinStrategy = new LinkedInTokenStrategy({
        clientID: linkedin.clientId,
        clientSecret: linkedin.clientSecret,
        passReqToCallback: true,
        customHeaders: {
          'x-li-src': 'msdk',
        },
      },
      function(req, accessToken, tokenSecret, profile, done) {
        // tokenSecret? is it refreshToken instead? Not used right now.
        User.upsertLinkedinUser(req, accessToken, tokenSecret, profile,
            function(err, user) {
              return done(err, user);
            });
      }
  );
  myLinkedinStrategy._oauth2.useAuthorizationHeaderforGET(true);
  passport.use(myLinkedinStrategy);
};