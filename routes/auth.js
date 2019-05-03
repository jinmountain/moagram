const Joi = require('joi');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const bodyParser = require('body-parser');
const User = require("../models/user");

router.get('/login', (req, res) => {
    if(req.query.language){
        if(req.query.language == "en"){
            res.render('en/login');
        } else if(req.query.language == "ko"){
            res.render('ko/login');
        } else {
            res.render('en/login');
        }
    } else {
        res.render('en/login');
    }
});

// =====================================
// LOGOUT ==============================
// =====================================
router.get('/logout', (req, res) => {
    if (req.user.lang == 'en'){
        req.logout();
        req.flash("success", "Logged You Out :D");
    } else if (req.user.lang == 'ko'){
        req.logout();
        req.flash("success", "로그아웃 되었습니다 :D");
    } else if (moment.locale() == 'en'){
        req.logout();
        req.flash("success", "Logged You Out :D");
    } else if (moment.locale() == 'ko'){
        req.logout();
        req.flash("success", "로그아웃 되었습니다 :D");
    } else {
        req.logout();
        req.flash("success", "Logged You Out :D");
    }
	res.redirect('/');
});

//========google oauth========
router.get('/google', passport.authenticate('google', {
	scope: ['profile', 'email']
}));

//callback route for google to redirect to 
router.get('/google/redirect', passport.authenticate('google'), (req, res, next) => {
    // backURL = req.header('Referer') || '/';
    // res.redirec(backURL);
    if (req.user.lang){
    	res.redirect('/' + req.user.lang + '/contents');
    } else if (moment.locale() == 'en'){
        res.redirect('/en/contents');
    } else if (moment.locale() == 'ko'){
    	res.redirect('/ko/contents');
    } else {
        res.redirect('/en/contents');
    }
});

module.exports = router;
