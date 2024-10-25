const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const User = require('./db');

// Set up strategy
function PassportConfig (passport) {
passport.use(new LocalStrategy({ usernameField: 'email'}, (email, password, done) =>{
      //check to see if emial is registered
    User.findOne({email: email})
      .then (user => {
        if (!user) {
          return done(null,false, {message: 'No such user'});
        }
        bcrypt.compare(password,user.password, (err, result) =>{
        if (err) { return done(err); }
        if (!result) { return done(null, false, {message: 'Incorrect password'}); }
        return done(null, user);
        });
    });
   }
  ));

  // Serialise and deserialise user

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });
  
  passport.deserializeUser((id, done) => {
    User.findById(id)
    .then ((user) => {
      if (!user) { return done(null, false); }
      return done (null, user)
    });
  });
}

  module.exports = PassportConfig;