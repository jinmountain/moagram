const Joi = require('joi');
const express = require('express');
const router = express.Router();
const passport = require('passport');
const bodyParser = require('body-parser');
const User = require("../models/user");
const Content = require('../models/content');

// =========Count Newly Upadated Content in Each CTG==========
function ctgCount(ctgCountArray) {
    var contentCtg = ["tntl", "mukbang", "news", "documentary", 
                    "educational", "fitness", "motivational", "music",
                    "beauty", "gaming", "vlog", "animal", "others"];

    var end = Date.now();
    var contentCreatedToday = end - 86400000;

    contentCtg.forEach(function(ctg, i, array) {
        Content.countDocuments({
            category: ctg,
            createdAt: {$gt: contentCreatedToday}
        }, function(err, count){
            if(err){
                err.httpStatusCode = 500
                return next(err);
            } else {
                ctgCountArray.splice(i, 1, count);
            }
        });
    });
}

var ctgCountArray = [];

router.get('/login', (req, res) => {
    ctgCount(ctgCountArray);

    if(req.query.language){
        if(req.query.language == "en"){
            res.render('en/login', {
                ctgCount: ctgCountArray
            });
        } else if(req.query.language == "ko"){
            res.render('ko/login', {
                ctgCount: ctgCountArray
            });
        } else {
            res.render('en/login', {
                ctgCount: ctgCountArray
            });
        }
    } else {
        res.render('en/login', {
            ctgCount: ctgCountArray
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
