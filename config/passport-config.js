const LocalStrategy = require('passport-local').Strategy;
const User = require('../models/User');

module.exports = function (passport) {
  // Use the User model's strategy from passport-local-mongoose
  passport.use(new LocalStrategy({ usernameField: 'email' }, User.authenticate()));

  // Serialize and deserialize user instances to and from the session
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());
};