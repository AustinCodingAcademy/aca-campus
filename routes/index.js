var express = require('express');
var bcrypt = require('bcrypt');
var router = express.Router();
var passport = require('../config/passport');
var User = require('../models/userModel');

/* GET home page. */
router.get('/', function(req, res, next) {
  if(!req.isAuthenticated()){
    res.redirect('/login');
  } else {
    res.render('index', { user: JSON.stringify(req.user) });
  }
});

router.get('/login', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.redirect('/');
  } else {
    res.render('login');
  }
});

router.post('/login', passport.authenticate('local', {
  successRedirect: '/',
  failureRedirect: '/login',
  failureFlash: true
}));

router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});

router.get('/register', function(req, res, next) {
  if(req.isAuthenticated()) {
    res.redirect('/');
  } else {
    res.render('register');
  }
});

// Todo: We should probably look at extracting this into a module
router.post('/register', function(req, res, next) {
  User.findOne({ username : req.body.username }, function (err, user) {
    var user;
    var saltRounds = 10;

    if (user) {
      req.flash('error', 'The email address has already been used');
      return res.redirect('/register');
    }

    if (req.body.password.length <= 5) {
      req.flash('error', 'Password must be at least 6 characters');
      return res.redirect('/register');
    }

    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
      // Set the hashed password on the body
      req.body.password = hash;

      user = new User(req.body);
      user.is_client = true;

      user.save(function (error, user) {

        if (error) {
          req.flash('error', error.message);
          res.redirect('/register');
        }

        user.client = user._id;
        user.save(function (error, user) {

          if (error) {
            req.flash('error', error.message);
            res.redirect('/register');
          }

          // If the users has been created successfully, log them in with
          // passport to start their session and redirect to the home route
          req.login(user, function(err) {
            if (err) { return res.redirect('/register'); }
            return res.redirect('/');
          });
        });
      });
    });
  });
});

module.exports = router;
