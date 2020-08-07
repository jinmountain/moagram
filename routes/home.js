const express = require('express');
const router = express.Router();
const app = express();
const Content = require('../models/content');
const User    = require("../models/user");
const middleware = require("../middleware");
const moment = require('moment');

var ctgCountArrayHome = [];
var totalCtgCountArrayHome = [];

function ctgCountCheck() {
	if (Content.totalCtgCountArray > 0 && Content.ctgCountArray > 0) {
		ctgCountArrayHome = Content.ctgCountArray;
		totalCtgCountArrayHome = Content.totalCtgCountArray;
	}
}

router.get("/", function (req, res){
	ctgCountCheck();
	var lang;
    if(req.user){
        lang = req.user.lang;
    } else {
        lang = moment.locale();
    }

    res.render(lang + "/home", {
		pageType: 'home',
		ctgCount: ctgCountArrayHome,
		totalCtgCount: totalCtgCountArrayHome
	});
});

router.get("/about", function(req, res, next){

	var lang;
    if(req.user){
        lang = req.user.lang;
    } else {
        lang = moment.locale();
    }

    res.render(lang + "/about", {
		pageType: 'about',
		ctgCount: ctgCountArrayHome,
		totalCtgCount: totalCtgCountArrayHome
	});
});

router.get("/:url", function(req, res, next){
	res.status(404).render('./error', {
        err: "404",
        message: "Oops. Page not found"
    });
});

router.get("/:url", function(req, res, next){
	if(req.params.url == "contents" || req.params.url == "profile"){
		next();
	} else {
		res.status(404).render('./error', {
	        err: "404",
	        message: "Oops. Page not found"
	    });
	}
});


router.get("/profile/:url", function(req, res, next){
	User.findById(req.params.url, function(err, userFound){
 		if(req.params.url == "setting" 
			|| req.params.url == "likes"
			|| req.params.url == "contents"
			|| req.params.url == "following"
			|| userFound){
			next();
		} else {
			res.status(500).render('./error', {
	            err: "500",
	            message: "Oops. Internal Server Error"
	        });
		}
	});
});


router.get("/profile/contents/:url", function(req, res, next){
	res.status(404).render('./error', {
        err: "404",
        message: "Oops. Page not found"
    });
});


function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;