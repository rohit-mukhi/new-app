const express = require('express');
const passport = require('passport');
const router = express.Router();
const User = require('../models/User');

// @desc    Show registration page
// @route   GET /register
router.get('/register', (req, res) => {
  res.render('register');
});

// @desc    Handle registration
// @route   POST /register
router.post('/register', (req, res) => {
  const { email, password, role, locality } = req.body;
  const newUser = new User({ email, role, locality });

  User.register(newUser, password, (err, user) => {
    if (err) {
      console.log(err);
      return res.render('register', { error: err.message });
    }
    passport.authenticate('local')(req, res, () => {
      res.redirect('/dashboard');
    });
  });
});

// @desc    Show login page
// @route   GET /login
router.get('/login', (req, res) => {
  res.render('login');
});

// @desc    Handle login
// @route   POST /login
router.post(
  '/login',
  passport.authenticate('local', {
    failureRedirect: '/login', // Redirect back to login page on failure
    failureFlash: false // You can enable flash messages later
  }),
  (req, res) => {
    res.redirect('/dashboard');
  }
);


// @desc    Handle logout
// @route   GET /logout
router.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    res.redirect('/login');
  });
});

module.exports = router;