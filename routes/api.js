var passport = require('passport');
var config = require('../config/database');
require('../config/passport')(passport);
var express = require('express');
var jwt = require('jsonwebtoken');
var expressJwt = require('express-jwt');
var router = express.Router();
var User = require('../models/user');
var authUtil = require('../utils/auth.js');
var staticValues = require('./static-values.js');
var mailgunClient = require('../utils/mailgun-client');
var url = require('url');
var randToken = require('rand-token');

function baseUrl(req) {
  return url.format({
    protocol: req.protocol,
    host: req.get('host')
  });
}

var filterUserData = function(user) {
  delete user['facebookProvider'];
  delete user['linkedinProvider'];
  delete user['__v'];
  delete user['hash'];
  delete user['salt'];
};

// Facebook Strategy Starts
var authenticate = expressJwt({
  secret: config.secret,
  requestProperty: 'auth', // Which property to add the user object in, this adds it at req.auth
  getToken: function(req) {
    if (req.headers['x-auth-token']) {
      return req.headers['x-auth-token'];
    }
    return null;
  }
});
var createToken = function(auth) {
  return jwt.sign({id: auth.id}, config.secret, {expiresIn: 60 * 120});
};
var generateToken = function(req, res, next) {
  req.token = createToken(req.auth);
  next();
};
var sendToken = function(req, res) {
  res.setHeader('x-auth-token', req.token);
  var user = req.user.toObject();
  filterUserData(user);
  res.status(200).send({user: user});
};

var getCurrentUser = function(req, res, next) {
  User.findById(req.auth.id, function(err, user) {
    if (err) {
      next(err);
    } else {
      req.user = user;
      next();
    }
  });
};

var getOne = function(req, res) {
  if (!req.user) return res.status(402).json({msg: 'Failed to fetch the user details.'});
  var user = req.user.toObject();
  filterUserData(user);
  res.json(user);
};

router.route('/profile').get(authenticate, getCurrentUser, getOne);

router.route('/profile/delete').delete(authenticate, getCurrentUser, function(req, res) {
  if (!req.user) return res.status(402).json({msg: 'User not found.'});
  req.user.remove(function(err) {
    res.json({
      msg: err ?
          'Failed to delete user. ' + err.message :
          'User deleted successfully.'
    });
  });
});

router.post('/signup', function(req, res) {
  if (!req.body.email || !req.body.password || !req.body.user_type) {
    res.status(400).json({success: false, msg: 'Please pass email/user_type and password.'});
  } else {
    var data = {
      email: req.body.email,
      user_type: req.body.user_type,
      verification_token: randToken.generate(32),
      verification_pending: true
    };

    if (req.body.name) data.name = req.body.name;
    if (req.body.phone) data.phone = req.body.phone;

    User.register(new User(data), req.body.password, function(err, user) {
      if (err) {
        return res.status(409).json({success: false, msg: err.message});
      }

      /* Send Confirmation Email */
      var data = {
        //Specify email data
        from: 'noreply@kilterplus.com',
        //The email to contact
        to: user.email,
        //Subject and text data
        subject: 'Welcome to Kilter+',
        html: 'Hello,  and welcome to Kilter+.<br>This email is here so that we can know you are the ' +
        'real owner of this Email account.<br><a href="' + baseUrl(req) +
        '/api/v1/verify-email/' + user.verification_token + '">Click here to verify it.</a>'
      };

      mailgunClient.messages().send(data, function(err, body) {
        if (err) {
          console.log('Failed to send email for confirmation to ' + user.email);
        } else {
          console.log('Email sent successfully to ' + user.email);
        }
      });
      /* Send Confirmation Email */

      user = user.toObject();
      filterUserData(user);

      var auth = {id: user._id.toString()};
      res.setHeader('x-auth-token', createToken(auth));
      res.status(200).json({success: true, msg: 'Successful created new user.', user: user});
    });
  }
});

router.get('/verify-email/:token', function(req, res) {
  User.find({verification_token: req.params.token}, function(err, user) {
    if (err) return res.send('Failed to verify email.');
    else {
      user.verification_pending = false;
      user.save();
      res.send('Email verification successful.');
    }
  });
});

router.post('/signin',
    passport.authenticate('local', {session: false}), function(req, res, next) {
      if (!req.user) {
        return authUtil.authFailed(res);
      }

      req.auth = {
        id: req.user.id
      };

      next();
    }, generateToken, sendToken
);

router.post('/auth/facebook',
    passport.authenticate('facebook-token', {session: false}),
    function(req, res, next) {
      if (!req.user) {
        return authUtil.authFailed(res);
      }

      // prepare token for API
      req.auth = {
        id: req.user.id
      };

      next();
    }, generateToken, sendToken
);

router.post('/auth/linkedin',
    passport.authenticate('linkedin-token', {session: false}),
    function(req, res, next) {
      if (!req.user) {
        return authUtil.authFailed(res);
      }

      // prepare token for API
      req.auth = {
        id: req.user.id
      };

      next();
    }, generateToken, sendToken
);

router.put('/profile/update', authenticate, getCurrentUser, function(req, res) {
  req.user.profile_created = true;
  if (req.body.name) req.user.name = req.body.name;
  if (req.body.phone) req.user.phone = req.body.phone;
  if (req.body.address) req.user.address = req.body.address;
  if (req.body.state) req.user.state = req.body.state;
  if (req.body.pin_code) req.user.pin_code = req.body.pin_code;
  if (req.body.city) req.user.city = req.body.city;
  if (req.body.cin_no) req.user.cin_no = req.body.cin_no;
  if (req.body.pan_no) req.user.pan_no = req.body.pan_no;
  if (req.body.gst_no) req.user.gst_no = req.body.gst_no;
  if (req.body.type) req.user.type = req.body.type;
  if (req.body.speciality) req.user.speciality = req.body.speciality;
  if (req.body.emergency_available) req.user.emergency_available = req.body.emergency_available;
  if (req.body.no_of_doctors) req.user.no_of_doctors = req.body.no_of_doctors;
  if (req.body.aadhar) req.user.aadhar = req.body.aadhar;
  if (req.body.doc_reg_no) req.user.doc_reg_no = req.body.doc_reg_no;
  if (req.body.experience) req.user.experience = req.body.experience;
  if (req.body.availability) req.user.availability = req.body.availability;
  if (req.body.qualification) req.user.qualification = req.body.qualification;
  if (req.body.type_of_consultation) req.user.type_of_consultation = req.body.type_of_consultation;
  req.user.save(function(err, user) {
    if (err) res.status(422).json({msg: err.message});
    else res.json(200, {msg: 'Profile updated successfully.', user: filterUserData(user.toObject())});
  });
});

router.use('/static', staticValues);

module.exports = router;