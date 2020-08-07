const Joi = require('joi');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const bodyParser = require('body-parser');
const User = require("../models/user");
const Content = require('../models/content');

// =========Bring the count from the Content Route==========
var ctgCountArrayAuth = [];
var totalCtgCountArrayAuth = [];

function ctgCountCheck() {
    if (Content.totalCtgCountArray > 0 && Content.ctgCountArray > 0) {
        ctgCountArrayAuth = Content.ctgCountArray;
        totalCtgCountArrayAuth = Content.totalCtgCountArray;
    }
}

router.get('/login', (req, res) => {
    ctgCountCheck()

    if(req.query.language){
        if(req.query.language == "en"){
            res.render('en/login', {
                ctgCount: ctgCountArrayAuth,
                totalCtgCount: totalCtgCountArrayAuth
            });
        } else if(req.query.language == "ko"){
            res.render('ko/login', {
                ctgCount: ctgCountArrayAuth,
                totalCtgCount: totalCtgCountArrayAuth
            });
        } else {
            res.render('en/login', {
                ctgCount: ctgCountArrayAuth,
                totalCtgCount: totalCtgCountArrayAuth
            });
        }
    } else {
        res.render('en/login', {
            ctgCount: ctgCountArrayAuth,
            totalCtgCount: totalCtgCountArrayAuth
        });
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

    res.redirect('/contents');
});

module.exports = router;
