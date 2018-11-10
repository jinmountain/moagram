const Joi = require('joi');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const bodyParser = require('body-parser');
const User = require("../models/user");

router.get('/login', (req, res) => {
	res.render('login');
});

// process the login form
router.post('/login', passport.authenticate('local-login', {
    successRedirect : '/contents', // redirect to the secure profile section
    failureRedirect : '/login', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

router.get('/register', (req, res) => {
	res.render('register');
});

router.post('/register', passport.authenticate('local-signup', {
    successRedirect : '/login', // redirect to the secure profile section
    failureRedirect : '/register', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
}));

// =====================================
// LOGOUT ==============================
// =====================================
router.get('/logout', (req, res) => {
	req.logout();
    req.flash("success", "LOGGED YOU OUT!");
	res.redirect('/');
});

//========google oauth========
router.get('/google', passport.authenticate('google', {
	scope: ['profile', 'email']
}));

//callback route for google to redirect to 
router.get('/google/redirect', passport.authenticate('google'), (req, res, next) => {
    backURL=req.header('Referer') || '/';
    res.redirect(backURL);
});

module.exports = router;
