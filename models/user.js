var mongoose = require('mongoose');
var Schema = mongoose.Schema;
var passportLocalMongoose = require('passport-local-mongoose');
const mongooseBeautifulUniqueValidation = require('mongoose-beautiful-unique-validation');
const mongooseValidationErrorTransform = require('mongoose-validation-error-transform');

var UserSchema = new Schema({
  email: {
    type: String, required: true,
    trim: true, unique: true,
    sparse: true
    // match: /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
  },
  verification_token: {
    type: String,
    required: false,
    select: false
  },
  verification_pending: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: false,
    select: false
  },
  phone: {
    type: String,
    unique: 'An account with that phone number is already registered.',
    sparse: true
  },
  user_type: {
    type: String,
    required: true,
    enum: ['doctor', 'hospital', 'patient', 'admin']
  },
  facebookProvider: {
    type: {
      id: String,
      token: String
    },
    select: false
  },
  linkedinProvider: {
    type: {
      id: String,
      token: String
    },
    select: false
  },
  name: {type: String},
  profile_created: {type: Boolean, default: false},
  address: {type: String},
  city: {type: String},
  state: {type: String},
  pin_code: {type: String},
  cin_no: {type: String},
  pan_no: {type: String},
  gst_no: {type: String},
  type: {type: String},
  speciality: {type: String},
  emergency_available: {type: String},
  no_of_doctors: {type: String},
  qualification: {type: String},
  aadhar: {type: String},
  doc_reg_no: {type: String},
  experience: {type: String},
  availability: {type: String},
  type_of_consultation: {
    chat: {type: Boolean},
    voice: {type: Boolean},
    video: {type: Boolean},
    offline_visit: {type: Boolean}
  },
  created_at: {type: Date},
  updated_at: {type: Date}
});

UserSchema.pre('save', function(next) {
  var now = new Date();
  this.updated_at = now;
  if (!this.created_at) {
    this.created_at = now;
  }
  next();
});

// Facebook Provider
UserSchema.statics.upsertFbUser = function(
    req, accessToken, refreshToken, profile, cb) {
  var that = this;
  return this.findOne({
    // 'facebookProvider.id': profile.id,
    email: profile.emails[0].value
  }, function(err, user) {
    // no user was found, lets create a new one
    if (!user) {
      var newUser = new that({
        name: profile.name.givenName + ' ' + profile.name.familyName,
        email: profile.emails[0].value,
        user_type: req.body.user_type,
        facebookProvider: {
          id: profile.id,
          token: accessToken
        }
      });

      newUser.save(function(error, savedUser) {
        if (error) {
          console.log(error);
        }
        return cb(error, savedUser);
      });
    } else {
      return cb(err, user);
    }
  });
};

// Linkedin Provider
UserSchema.statics.upsertLinkedinUser = function(
    req, accessToken, refreshToken, profile, cb) {
  var that = this;
  return this.findOne({
    // 'linkedinProvider.id': profile.id,
    email: profile.emails[0].value
  }, function(err, user) {
    // no user was found, lets create a new one
    if (!user) {
      var newUser = new that({
        name: profile.name.givenName + ' ' + profile.name.familyName,
        email: profile.emails[0].value,
        user_type: req.body.user_type,
        linkedinProvider: {
          id: profile.id,
          token: accessToken
        }
      });

      newUser.save(function(error, savedUser) {
        if (error) {
          console.log(error);
        }
        return cb(error, savedUser);
      });
    } else {
      return cb(err, user);
    }
  });
};

// To have better error messages for unique validations.
// Our phone number is using this for "unique" option.
mongoose.plugin(mongooseBeautifulUniqueValidation);
mongoose.plugin(mongooseValidationErrorTransform);

UserSchema.plugin(passportLocalMongoose, {
  usernameField: 'email',
  errorMessages: {
    UserExistsError: 'An account with that email address is already registered.'
  }
});

module.exports = mongoose.model('User', UserSchema);