const express = require('express');
const router = express.Router();
const app = express();
const Content = require('../models/content');
const User    = require("../models/user");
const middleware = require("../middleware");



router.get("/", function (req, res) {
	if(req.query.search){
		const regex = new RegExp(escapeRegex(req.query.search), 'gi');
		var search = regex
		res.render("home")
	} else {
		res.render("home");
	}
});

router.get("/:url", function(req, res, next){
	res.status(404).render('./error', {
        err: "404",
        message: "Oops. Page not found"
    });
});

router.get("/en/:url", function(req, res, next){
	if(req.params.url == "contents" || req.params.url == "profile"){
		next();
	} else {
		res.status(404).render('./error', {
	        err: "404",
	        message: "Oops. Page not found"
	    });
	}
});

router.get("/ko/:url", function(req, res, next){
	if(req.params.url == "contents" || req.params.url == "profile"){
		next();
	} else {
		res.status(404).render('./error', {
	        err: "404",
	        message: "Oops. Page not found"
	    });
	}
});

router.get("/en/profile/:url", function(req, res, next){
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

router.get("/ko/profile/:url", function(req, res, next){
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

router.get("/en/profile/contents/:url", function(req, res, next){
	res.status(404).render('./error', {
        err: "404",
        message: "Oops. Page not found"
    });
});

router.get("/ko/profile/contents/:url", function(req, res, next){
	res.status(404).render('./error', {
        err: "404",
        message: "Oops. Page not found"
    });
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;